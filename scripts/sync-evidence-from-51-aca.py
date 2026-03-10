"""
# EVA-STORY: 37-DATA-MODEL-EVIDENCE-SYNC-001

Evidence Layer Synchronization Workflow (JSON-Based Orchestration)

Syncs 51-ACA evidence receipts → 37-data-model canonical evidence.json
Pattern: Similar to orchestrator-workflow (agents coordinate via JSON)

Pipeline:
1. Extract Stage: Read 51-ACA .eva/evidence/*.json  
   ↓ (Parse, validate as JSON)
2. Transform Stage: Map 51-ACA receipt format → 37 canonical schema
   ↓ (Transform JSON objects)
3. Merge Stage: Load 37-data-model evidence.json, append transformed records
   ↓ (Merge JSON arrays)
4. Validate Stage: Check all records against evidence.schema.json
   ↓ (JSON schema validation)
5. Report Stage: Generate sync report (JSON)

All operations are pure JSON transformations. No API calls, no cloud services.

Revisions:
    2026-03-10: Refactored to use eva_script_infra (Session 44 compliance)
"""

import json
import sys
import time
from pathlib import Path
from typing import Optional, Literal
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import hashlib

# Professional Coding Standards infrastructure
from eva_script_infra import (
    setup_logging, save_evidence, save_error_evidence, ensure_directories,
    timestamped_filename, check_directory_exists, check_file_exists,
    STATUS_PASS, STATUS_FAIL, STATUS_INFO, STATUS_ERROR, STATUS_WARN,
    format_status
)

logger = None  # Will be initialized in main


# ============================================================================
# DATA MODELS
# ============================================================================

@dataclass
class ReceiptRecord:
    """Raw receipt as stored in 51-ACA .eva/evidence/*.json"""
    story_id: str
    title: Optional[str] = None
    phase: Optional[str] = None  # e.g., "D|P|D|C|A"
    timestamp: Optional[str] = None
    artifacts: list = field(default_factory=list)
    test_result: Optional[str] = None
    lint_result: Optional[str] = None
    commit_sha: Optional[str] = None
    coverage_percent: Optional[float] = None
    audit_result: Optional[str] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class CanonicalEvidence:
    """37-data-model canonical evidence record format"""
    id: str
    sprint_id: str
    story_id: str
    phase: Literal["D1", "D2", "P", "D3", "A"]  # Individual phase
    created_at: str
    validation: dict
    metrics: dict = field(default_factory=dict)
    artifacts: list = field(default_factory=list)
    commits: list = field(default_factory=list)
    correlation_id: Optional[str] = None
    completed_at: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "sprint_id": self.sprint_id,
            "story_id": self.story_id,
            "phase": self.phase,
            "created_at": self.created_at,
            "validation": self.validation,
            "metrics": self.metrics,
            "artifacts": self.artifacts,
            "commits": self.commits,
            **({"correlation_id": self.correlation_id} if self.correlation_id else {}),
            **({"completed_at": self.completed_at} if self.completed_at else {}),
        }


@dataclass
class SyncResult:
    """Result of sync operation"""
    status: Literal["PASS", "FAIL", "WARN"]
    extracted_count: int
    transformed_count: int
    merged_count: int
    validated_count: int
    skipped_count: int
    failures: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    duration_ms: int = 0
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "extracted_count": self.extracted_count,
            "transformed_count": self.transformed_count,
            "merged_count": self.merged_count,
            "validated_count": self.validated_count,
            "skipped_count": self.skipped_count,
            "failure_count": len(self.failures),
            "warning_count": len(self.warnings),
            "duration_ms": self.duration_ms,
            "timestamp": self.timestamp,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ============================================================================
# STAGE 1: EXTRACT
# ============================================================================

def extract_51_aca_evidence(repo_path: Path) -> tuple[list[tuple[str, dict]], list[str]]:
    """
    Stage 1: Extract all evidence receipts from 51-ACA.
    
    Returns: (list of (filename, record_dict), list of errors)
    """
    evidence_dir = repo_path / ".eva" / "evidence"
    
    if not evidence_dir.exists():
        logger.error(f"[EXTRACT] Directory not found: {evidence_dir}")
        return [], [f"Evidence directory not found: {evidence_dir}"]
    
    records = []
    errors = []
    
    for receipt_file in sorted(evidence_dir.glob("*-receipt.json")):
        try:
            with open(receipt_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Validate required fields
            if not data.get("story_id"):
                errors.append(f"{receipt_file.name}: missing story_id")
                continue
            
            records.append((receipt_file.name, data))
            logger.info(f"{format_status(STATUS_PASS, f'[EXTRACT] {receipt_file.name}')}")
            
        except json.JSONDecodeError as e:
            errors.append(f"{receipt_file.name}: JSON decode error: {e}")
        except Exception as e:
            errors.append(f"{receipt_file.name}: {e}")
    
    logger.info(f"[EXTRACT] Extracted {len(records)} files, {len(errors)} errors")
    return records, errors


# ============================================================================
# STAGE 2: TRANSFORM
# ============================================================================

def infer_sprint_id_from_story_id(story_id: str) -> str:
    """Extract sprint ID from story ID. E.g., 'ACA-03-015' → 'ACA-03'"""
    parts = story_id.split("-")
    if len(parts) >= 2:
        return "-".join(parts[:2])  # "ACA-03"
    return story_id.replace("-", "-")


def transform_51_aca_receipt(
    filename: str,
    receipt: dict,
    project_prefix: str = "ACA"
) -> tuple[Optional[CanonicalEvidence], Optional[str]]:
    """
    Stage 2: Transform 51-ACA receipt → canonical 37-data-model format.
    
    Returns: (CanonicalEvidence, error_message or None)
    """
    
    try:
        story_id = receipt.get("story_id", "")
        if not story_id:
            return None, f"{filename}: missing story_id"
        
        # Infer sprint from story ID
        sprint_id = infer_sprint_id_from_story_id(story_id)
        
        # Parse phase (51-ACA uses combined "D|P|D|C|A", we split to individual receipts)
        # For now, use "D3" (do phase) as most receipts are from execution
        phase_str = receipt.get("phase", "D3")
        phase = "D3"  # Map most to do phase
        if "D1" in phase_str:
            phase = "D1"
        elif "D2" in phase_str:
            phase = "D2"
        elif "P" in phase_str:
            phase = "P"
        elif "A" in phase_str:
            phase = "A"
        
        # Build ID: {project}-{sprint}-{phase}-{story_id}
        canonical_id = f"{project_prefix}-{sprint_id}-{phase}-{story_id}"
        
        # Validation object (normalize test/lint results)
        validation = {
            "test_result": receipt.get("test_result", "SKIP"),
            "lint_result": receipt.get("lint_result", "SKIP"),
            "audit_result": receipt.get("audit_result", "SKIP"),
        }
        
        if receipt.get("coverage_percent") is not None:
            validation["coverage_percent"] = receipt["coverage_percent"]
        
        # Artifacts (normalized to canonical format)
        artifacts = []
        for art in receipt.get("artifacts", []):
            if isinstance(art, str):
                # Simple path → normalized object
                artifacts.append({
                    "path": art,
                    "type": "source",
                    "action": "modified"
                })
            elif isinstance(art, dict):
                # Already normalized
                artifacts.append(art)
        
        # Commits array (if commit_sha provided)
        commits = []
        if receipt.get("commit_sha"):
            commits.append({
                "sha": receipt["commit_sha"],
                "message": receipt.get("title", ""),
                "timestamp": receipt.get("timestamp", datetime.utcnow().isoformat())
            })
        
        # Build canonical evidence record
        canonical = CanonicalEvidence(
            id=canonical_id,
            sprint_id=f"{project_prefix}-{sprint_id}",
            story_id=story_id,
            phase=phase,
            created_at=receipt.get("timestamp", datetime.utcnow().isoformat()),
            validation=validation,
            artifacts=artifacts,
            commits=commits,
            completed_at=receipt.get("timestamp")
        )
        
        return canonical, None
        
    except Exception as e:
        return None, f"{filename}: transformation error: {e}"


def transform_51_aca_receipts(
    extracted: list[tuple[str, dict]]
) -> tuple[list[CanonicalEvidence], list[str]]:
    """
    Stage 2: Transform all extracted receipts.
    
    Returns: (list of CanonicalEvidence, list of errors)
    """
    
    transformed = []
    errors = []
    
    for filename, receipt in extracted:
        canonical, error = transform_51_aca_receipt(filename, receipt)
        
        if error:
            errors.append(error)
            logger.warning(f"[TRANSFORM] ✗ {filename}: {error}")
        else:
            transformed.append(canonical)
            arrow = "→"  # Unicode arrow (for display only, not in log formatting)
            logger.info(f"{format_status(STATUS_PASS, f'[TRANSFORM] {filename} {arrow} {canonical.id}')}")
    
    logger.info(f"[TRANSFORM] Transformed {len(transformed)} records, {len(errors)} errors")
    return transformed, errors


# ============================================================================
# STAGE 3: MERGE
# ============================================================================

def merge_into_evidence_json(
    evidence_json_path: Path,
    canonical_records: list[CanonicalEvidence]
) -> tuple[list[dict], list[str]]:
    """
    Stage 3: Load existing evidence.json, merge transformed records.
    
    Returns: (list of merged dicts, list of errors)
    """
    
    errors = []
    target_path = evidence_json_path
    
    if not target_path.exists():
        logger.warning(f"[MERGE] Creating new {target_path}")
        merged = []
    else:
        try:
            with open(target_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            
            # Extract objects array
            merged = existing.get("objects", [])
            logger.info(f"[MERGE] Loaded {len(merged)} existing records")
            
        except json.JSONDecodeError as e:
            errors.append(f"Evidence.json decode error: {e}")
            merged = []
    
    # Append new records (avoid duplicates by ID)
    existing_ids = {obj.get("id") for obj in merged}
    added_count = 0
    skipped_count = 0
    
    for canonical in canonical_records:
        if canonical.id in existing_ids:
            logger.info(f"[MERGE] Skipping duplicate: {canonical.id}")
            skipped_count += 1
        else:
            merged.append(canonical.to_dict())
            added_count += 1
    
    logger.info(f"[MERGE] Added {added_count}, skipped {skipped_count} duplicates")
    return merged, errors, skipped_count


# ============================================================================
# STAGE 4: VALIDATE
# ============================================================================

def validate_against_schema(
    records: list[dict],
    schema_path: Path
) -> tuple[int, list[str]]:
    """
    Stage 4: Validate all records against evidence.schema.json.
    
    Returns: (validated_count, errors)
    """
    
    errors = []
    
    if not schema_path.exists():
        logger.warning(f"[VALIDATE] Schema not found: {schema_path}, skipping validation")
        return len(records), errors
    
    try:
        import jsonschema
        
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = json.load(f)
        
        validated = 0
        for record in records:
            try:
                jsonschema.validate(instance=record, schema=schema)
                validated += 1
            except jsonschema.ValidationError as e:
                errors.append(f"Record {record.get('id')}: {e.message}")
        
        logger.info(f"[VALIDATE] Validated {validated} / {len(records)} records")
        return validated, errors
        
    except ImportError:
        logger.warning("[VALIDATE] jsonschema not installed, skipping schema validation")
        return len(records), errors
    except Exception as e:
        errors.append(f"Validation error: {e}")
        return 0, errors


# ============================================================================
# STAGE 5: REPORT & WRITE
# ============================================================================

def write_merged_evidence(
    evidence_json_path: Path,
    merged_records: list[dict],
    preserve_metadata: bool = True
) -> list[str]:
    """
    Stage 5: Write merged records back to evidence.json.
    
    Returns: List of errors (if any)
    """
    
    errors = []
    
    try:
        # Load existing to preserve schema/metadata
        if evidence_json_path.exists() and preserve_metadata:
            with open(evidence_json_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            
            output = {
                "$schema": existing.get("$schema", "../schema/evidence.schema.json"),
                "layer": existing.get("layer", "evidence"),
                "version": existing.get("version", "1.0.0"),
                "description": existing.get("description", "DPDCA evidence receipts for all stories"),
                "objects": merged_records
            }
        else:
            output = {
                "$schema": "../schema/evidence.schema.json",
                "layer": "evidence",
                "version": "1.0.0",
                "description": "DPDCA evidence receipts for all stories in all sprints across the EVA ecosystem",
                "objects": merged_records
            }
        
        # Write atomically (write to temp, then rename)
        temp_path = evidence_json_path.with_suffix(".json.tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
            f.write("\n")
        
        # Atomic rename
        temp_path.replace(evidence_json_path)
        logger.info(f"{format_status(STATUS_PASS, f'[WRITE] Wrote {len(merged_records)} records to {evidence_json_path}')}")
        
    except Exception as e:
        errors.append(f"Write error: {e}")
        logger.error(f"[WRITE] ✗ {e}")
    
    return errors


def generate_sync_report(
    result: SyncResult,
    report_path: Path
) -> None:
    """Generate sync report JSON"""
    
    try:
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
            f.write("\n")
        
        logger.info(f"[REPORT] Written to {report_path}")
        
    except Exception as e:
        logger.error(f"[REPORT] Write error: {e}")


# ============================================================================
# ORCHESTRATION ENTRY POINT
# ============================================================================

def orchestrate_evidence_sync(
    aca_repo_path: Path,
    data_model_path: Path
) -> SyncResult:
    """
    Main orchestration: Extract → Transform → Merge → Validate → Write
    
    Pure JSON-based (all operations on JSON objects)
    """
    
    import time
    start_time = time.time()
    
    logger.info("=" * 80)
    logger.info("EVIDENCE LAYER SYNCHRONIZATION WORKFLOW")
    logger.info("=" * 80)
    logger.info(f"Source:  {aca_repo_path}")
    logger.info(f"Target:  {data_model_path}")
    logger.info("")
    
    try:
        # STAGE 1: Extract
        logger.info("[STAGE 1] EXTRACT 51-ACA Evidence Receipts")
        extracted, extract_errors = extract_51_aca_evidence(aca_repo_path)
        
        # STAGE 2: Transform
        logger.info("\n[STAGE 2] TRANSFORM Receipts to Canonical Schema")
        transformed, transform_errors = transform_51_aca_receipts(extracted)
        
        # STAGE 3: Merge
        logger.info("\n[STAGE 3] MERGE with Existing evidence.json")
        evidence_json_path = data_model_path / "model" / "evidence.json"
        merged, merge_errors, skipped = merge_into_evidence_json(evidence_json_path, transformed)
        
        # STAGE 4: Validate
        logger.info("\n[STAGE 4] VALIDATE Against Schema")
        schema_path = data_model_path / "schema" / "evidence.schema.json"
        validated, validate_errors = validate_against_schema(merged, schema_path)
        
        # STAGE 5: Write
        logger.info("\n[STAGE 5] WRITE Merged Evidence to Disk")
        write_errors = write_merged_evidence(evidence_json_path, merged)
        
        # REPORT
        all_errors = extract_errors + transform_errors + merge_errors + validate_errors + write_errors
        
        duration_ms = int((time.time() - start_time) * 1000)
        result = SyncResult(
            status="FAIL" if all_errors else "WARN" if validate_errors else "PASS",
            extracted_count=len(extracted),
            transformed_count=len(transformed),
            merged_count=len(merged),
            validated_count=validated,
            skipped_count=skipped,
            failures=all_errors,
            warnings=validate_errors,
            duration_ms=duration_ms
        )
        
        logger.info("\n" + "=" * 80)
        logger.info("SYNC COMPLETE")
        logger.info("=" * 80)
        logger.info(f"Status: {result.status}")
        logger.info(f"Extracted: {result.extracted_count}")
        logger.info(f"Transformed: {result.transformed_count}")
        logger.info(f"Merged: {result.merged_count}")
        logger.info(f"Validated: {result.validated_count}")
        logger.info(f"Skipped: {result.skipped_count}")
        logger.info(f"Duration: {result.duration_ms}ms")
        logger.info(f"Errors: {len(all_errors)}")
        
        if all_errors:
            logger.info("\nErrors:")
            for err in all_errors:
                logger.error(f"  - {err}")
        
        logger.info("")
        
        return result
        
    except Exception as e:
        logger.error(f"[ORCHESTRATION] Fatal error: {e}")
        return SyncResult(
            status="FAIL",
            extracted_count=0,
            transformed_count=0,
            merged_count=0,
            validated_count=0,
            skipped_count=0,
            failures=[str(e)],
            duration_ms=int((time.time() - start_time) * 1000)
        )


# ============================================================================
# CLI ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    # Initialize module-level logger for use by all functions
    logger = setup_logging('sync-evidence-from-51-aca')
    
    # Professional Coding Standards: Create mandatory directories
    ensure_directories()
    
    try:
        # Parse arguments
        aca_repo = Path("C:/eva-foundry/51-ACA")
        data_model_repo = Path("C:/eva-foundry/37-data-model")
        
        if len(sys.argv) > 1:
            aca_repo = Path(sys.argv[1])
        if len(sys.argv) > 2:
            data_model_repo = Path(sys.argv[2])
        
        logger.info(format_status(STATUS_INFO, "Script: sync-evidence-from-51-aca"))
        logger.info(format_status(STATUS_INFO, f"Source: {aca_repo}"))
        logger.info(format_status(STATUS_INFO, f"Target: {data_model_repo}"))
        
        # Professional Coding Standards: Evidence at operation start
        save_evidence(
            operation="sync-evidence-from-51-aca",
            status="started",
            metrics={
                "source_repo": str(aca_repo),
                "target_repo": str(data_model_repo),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Professional Coding Standards: Pre-flight checks
        logger.info(format_status(STATUS_INFO, "Running pre-flight checks"))
        
        if not check_directory_exists(aca_repo, "51-ACA source repo", logger):
            logger.error(format_status(STATUS_ERROR, f"Source repo not found: {aca_repo}"))
            sys.exit(2)
        
        if not check_directory_exists(data_model_repo, "37-data-model target repo", logger):
            logger.error(format_status(STATUS_ERROR, f"Target repo not found: {data_model_repo}"))
            sys.exit(2)
        
        evidence_json_path = data_model_repo / "model" / "evidence.json"
        if not check_file_exists(evidence_json_path, "evidence file", logger):
            logger.error(format_status(STATUS_ERROR, f"Evidence file not found: {evidence_json_path}"))
            sys.exit(2)
        
        schema_path = data_model_repo / "schema" / "evidence.schema.json"
        if not check_file_exists(schema_path, "evidence schema", logger):
            logger.error(format_status(STATUS_ERROR, f"Schema file not found: {schema_path}"))
            sys.exit(2)
        
        logger.info(format_status(STATUS_PASS, "Pre-flight checks passed"))
        
        # Run orchestration
        result = orchestrate_evidence_sync(aca_repo, data_model_repo)
        
        # Professional Coding Standards: Timestamped output filename
        report_filename = timestamped_filename("sync-evidence-report", "51-aca", "json")
        report_path = data_model_repo / "evidence" / report_filename
        
        # Write report
        generate_sync_report(result, report_path)
        
        # Professional Coding Standards: Evidence at operation completion
        save_evidence(
            operation="sync-evidence-from-51-aca",
            status=result.status.lower(),
            metrics={
                "extracted_count": result.extracted_count,
                "transformed_count": result.transformed_count,
                "merged_count": result.merged_count,
                "validated_count": result.validated_count,
                "skipped_count": result.skipped_count,
                "failure_count": len(result.failures),
                "duration_ms": result.duration_ms,
                "report_path": str(report_path)
            }
        )
        
        # Professional Coding Standards: Exit codes (0=success, 1=business fail, 2=technical error)
        if result.status == "PASS":
            logger.info(format_status(STATUS_PASS, "Sync completed successfully"))
            sys.exit(0)
        elif result.status == "WARN":
            logger.warning(format_status(STATUS_WARN, "Sync completed with warnings"))
            sys.exit(1)
        else:  # FAIL
            logger.error(format_status(STATUS_FAIL, "Sync failed"))
            sys.exit(1)
    
    except Exception as e:
        # Professional Coding Standards: Structured error handling
        error_msg = f"Fatal error during sync: {str(e)}"
        logger.error(format_status(STATUS_ERROR, error_msg))
        
        save_error_evidence(e, "sync-evidence-from-51-aca")
        
        sys.exit(2)

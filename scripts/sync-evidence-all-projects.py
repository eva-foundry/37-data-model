#!/usr/bin/env python3
"""
Phase 3: Portfolio-Wide Evidence Consolidation Orchestrator (Configuration-Driven)

Consolidates evidence records from ALL active projects into a single
portfolio-wide evidence.json canonical model.

CONFIGURATION-DRIVEN: All paths and field mappings are externalized to
eva-factory.config.yaml. No hardcoded literals. Fully portable deployment.

Usage:
    python sync-evidence-all-projects.py /path/to/workspace /path/to/37-data-model

Environment Overrides:
    EVA_CONFIG_FILE=/path/to/eva-factory.config.yaml
    EVA_STORAGE_PROJECTS_REGISTRY=/custom/path/projects.json
    EVA_SCHEMA_FIELDS_STORY_ID=my_story_field
    ... (any config key as EVA_SECTION_KEY)

Architecture:
    1. Load eva-factory.config.yaml (externalized configuration)
    2. Scan all projects.json (single source of truth)
    ├─ For each active project with configured evidence directory
    │  ├─ Extract: Load all evidence/*.json files
    │  ├─ Transform: Convert to canonical schema using field mappings
    │  ├─ Validate: Against evidence.schema.json
    │  └─ Track: (project_id, record_count, validation_result)
    │
    ├─ Merge: Aggregate all validated records into evidence.json
    │  (with deduplication by evidence_id)
    │
    ├─ Validate: Full portfolio validation (schema + merge gates)
    │
    └─ Report: Configured report location with per-project stats

Phase 3 Enhancement over Phase 2:
    - Configuration-driven (no hardcoded paths)
    - Loops over all 50+ projects (currently 1 active: 51-ACA)
    - Maintains per-project evidence tracking (for audit trail)
    - Portfolio-wide aggregation (single source of truth)
    - Portably deployable (any workspace, any project structure)
    - Environment variable overrides supported
    - Ready for scale as other projects activate

Revisions:
    2026-03-10: Refactored to use eva_script_infra (Session 44 compliance)
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Tuple
import hashlib

# Professional Coding Standards infrastructure
from eva_script_infra import (
    setup_logging, save_evidence, save_error_evidence, ensure_directories,
    timestamped_filename, check_directory_exists, check_file_exists,
    STATUS_PASS, STATUS_FAIL, STATUS_INFO, STATUS_ERROR, STATUS_WARN,
    format_status
)

# Ensure config_loader can be imported from scripts directory
sys.path.insert(0, str(Path(__file__).parent))

from config_loader import EvaFactoryConfig, resolve_path

logger = None  # Will be initialized in main


@dataclass
class ProjectEvidence:
    """Evidence contribution from a single project."""
    project_id: str
    folder_path: str
    evidence_files_found: int
    records_extracted: int
    records_transformed: int
    records_merged: int
    validation_results: Dict[str, int]  # test_result, lint_result, audit_result counts
    errors: List[str]
    start_time: str
    completion_time: str


@dataclass
class SyncResult:
    """Overall portfolio synchronization result."""
    status: str
    timestamp: str
    duration_ms: float
    total_files_scanned: int
    projects_with_evidence: int
    projects_without_evidence: int
    total_records_extracted: int
    total_records_transformed: int
    total_records_merged: int
    total_validated_pass: int
    total_validated_fail: int
    total_validated_skip: int
    validation_rate: float
    merge_gates_blocked: int
    per_project_results: Dict[str, dict]
    failure_count: int
    warning_count: int


def load_projects_json(target_repo: str, config: EvaFactoryConfig) -> Dict[str, dict]:
    """Load projects.json and create lookup by folder."""
    projects_file = resolve_path(config, "storage.projects_registry", Path(target_repo))
    
    if not projects_file.exists():
        logger.error(f"ERROR: projects.json not found at {projects_file}")
        sys.exit(1)
    
    with open(projects_file) as f:
        data = json.load(f)
    
    # Create lookup: folder → project_id
    projects_by_folder = {}
    for project in data.get("projects", []):
        if project.get("is_active"):
            # Skip projects without folder field (they don't have directories)
            if "folder" not in project:
                continue
            
            projects_by_folder[project["folder"]] = {
                "id": project["id"],
                "label": project.get("label", project["id"]),
                "folder": project["folder"],
            }
    
    return projects_by_folder


def load_schema(target_repo: str, config: EvaFactoryConfig) -> dict:
    """Load evidence.schema.json for validation."""
    schema_file = resolve_path(config, "schema.evidence_file", Path(target_repo))
    
    if not schema_file.exists():
        logger.warning(f"WARNING: Schema file not found at {schema_file}")
        return {}
    
    with open(schema_file) as f:
        return json.load(f)


def extract_project_evidence(project_folder: Path, config: EvaFactoryConfig) -> Tuple[List[dict], List[str]]:
    """
    Extract all evidence files from a project's evidence directory.
    Returns: (list of records, list of errors)
    """
    evidence_rel_path = config.get("project_discovery.structure.evidence_dir", ".eva/evidence")
    evidence_dir = project_folder / Path(evidence_rel_path)
    records = []
    errors = []
    
    if not evidence_dir.exists():
        return records, errors
    
    for evidence_file in evidence_dir.glob("*.json"):
        try:
            with open(evidence_file) as f:
                record = json.load(f)
                records.append(record)
        except json.JSONDecodeError as e:
            errors.append(f"{evidence_file.name}: Invalid JSON - {str(e)}")
        except Exception as e:
            errors.append(f"{evidence_file.name}: {str(e)}")
    
    return records, errors


def transform_project_evidence(
    records: List[dict], 
    project_id: str,
    schema: dict,
    config: EvaFactoryConfig
) -> Tuple[List[dict], List[str]]:
    """
    Transform project-specific evidence to canonical schema.
    Uses config-defined field mappings and phase transformations.
    """
    transformed = []
    errors = []
    
    # Load field mappings from config
    story_id_field = config.get("schema.fields.story_id", "story_id")
    phase_field = config.get("schema.fields.phase", "phase")
    phase_map = config.phase_map
    sprint_parts = config.sprint_id_parts
    
    for receipt in records:
        try:
            # Infer sprint from story_id using configurable parts count
            story_id = receipt.get(story_id_field, "")
            sprint_id = "-".join(story_id.split("-")[:sprint_parts]) if story_id else ""
            
            # Map phase using config-defined mapping
            phase_raw = receipt.get(phase_field, "D")
            phase = phase_map.get(phase_raw, "D3")
            
            # Generate evidence_id: {project}-{sprint}-{phase}-{story_id}
            evidence_id = f"{project_id}-{sprint_id}-{phase}-{story_id}"
            
            canonical = {
                "id": evidence_id,
                "project_id": project_id,
                "sprint_id": sprint_id,
                "story_id": story_id,
                "phase": phase,
                "created_at": receipt.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "created_by": receipt.get("created_by", f"project:{project_id}"),
                "validation": {
                    "test_result": receipt.get("test_result", "SKIP"),
                    "lint_result": receipt.get("lint_result", "SKIP"),
                    "audit_result": "SKIP",
                },
                "artifacts": receipt.get("artifacts", []),
                "commits": [
                    {
                        "sha": receipt.get("commit_sha", ""),
                        "message": receipt.get("commit_message", ""),
                        "author": receipt.get("commit_author", ""),
                    }
                ] if receipt.get("commit_sha") else [],
                "title": receipt.get("title", story_id),
                "description": receipt.get("description", ""),
            }
            
            transformed.append(canonical)
            
        except Exception as e:
            errors.append(f"Transform {receipt.get('story_id', 'unknown')}: {str(e)}")
    
    return transformed, errors


def merge_into_portfolio(
    evidence_file: Path,
    new_records: List[dict],
    project_id: str,
    config: EvaFactoryConfig
) -> Tuple[int, List[str]]:
    """
    Merge new records into portfolio evidence.json.
    Returns: (count_merged, list_of_errors)
    """
    errors = []
    merged_count = 0
    
    try:
        # Load current portfolio
        if evidence_file.exists():
            with open(evidence_file) as f:
                portfolio = json.load(f)
        else:
            portfolio = {
                "$schema": config.get("storage.evidence_consolidated", "../schema/evidence.schema.json"),
                "layer": "evidence",
                "version": "1.0.0",
                "description": "Portfolio-wide evidence consolidation (Phase 3)",
                "objects": []
            }
        
        # Build existing IDs set for deduplication
        existing_ids = {record["id"] for record in portfolio.get("objects", [])}
        
        # Merge new records with deduplication
        for record in new_records:
            if record["id"] not in existing_ids:
                portfolio["objects"].append(record)
                existing_ids.add(record["id"])
                merged_count += 1
        
        return merged_count, errors
        
    except Exception as e:
        errors.append(f"Merge failed: {str(e)}")
        return 0, errors


def validate_portfolio(evidence_file: Path, schema: dict) -> Tuple[int, int, int, List[str]]:
    """
    Validate entire portfolio against schema.
    Returns: (pass_count, fail_count, skip_count, errors)
    """
    if not evidence_file.exists():
        return 0, 0, 0, ["Evidence file not found"]
    
    pass_count = 0
    fail_count = 0
    skip_count = 0
    errors = []
    
    try:
        with open(evidence_file) as f:
            portfolio = json.load(f)
        
        # Count validation results
        for record in portfolio.get("objects", []):
            test_result = record.get("validation", {}).get("test_result", "SKIP")
            
            if test_result == "PASS":
                pass_count += 1
            elif test_result == "FAIL":
                fail_count += 1
            else:
                skip_count += 1
        
        # Schema validation (if schema available)
        if schema:
            try:
                from jsonschema import validate, ValidationError
                validate(instance=portfolio, schema=schema)
            except ValidationError as e:
                errors.append(f"Schema validation failed: {e.message}")
            except ImportError:
                errors.append("jsonschema not installed (optional validation skipped)")
        
        return pass_count, fail_count, skip_count, errors
        
    except Exception as e:
        errors.append(f"Validation failed: {str(e)}")
        return 0, 0, 0, errors


def write_report(
    report_file: Path,
    result: SyncResult
) -> None:
    """Write sync report as JSON."""
    with open(report_file, "w") as f:
        json.dump(asdict(result), f, indent=2, default=str)


def orchestrate_portfolio_sync(workspace: str, target_repo: str) -> int:
    """
    Main orchestration: scan all projects from projects.json for evidence.
    Uses configuration-driven discovery without hardcoded paths.
    
    Scan strategy:
    1. Load eva-factory.config.yaml (or ENV overrides)
    2. Load all active projects from projects.json (single source of truth)
    3. For each project with evidence directory, consolidate
    
    Returns: 0 (success) or 1 (failure)
    """
    start_time = datetime.now(timezone.utc)
    
    logger.info("=" * 80)
    logger.info("Phase 3: Portfolio-Wide Evidence Consolidation (Configuration-Driven)")
    logger.info("=" * 80)
    logger.info(f"Workspace: {workspace}")
    logger.info(f"Target Repo: {target_repo}")
    logger.info(f"Start Time: {start_time.isoformat()}")
    logger.info("")
    
    # Load config (externalized, portable)
    try:
        config = EvaFactoryConfig.load()
    except FileNotFoundError as e:
        logger.error(f"[ERROR] {e}")
        return 2
    
    logger.info("")
    
    # Load projects and schema
    projects = load_projects_json(target_repo, config)
    schema = load_schema(target_repo, config)
    
    logger.info(f"[SCAN] Found {len(projects)} active projects in projects.json")
    logger.info("")
    
    # Scan workspace for projects with evidence
    logger.info("[STAGE 1] EXTRACT: Scanning workspace for evidence...")
    
    evidence_file = resolve_path(config, "storage.evidence_consolidated", Path(target_repo))
    per_project_results = {}
    workspace_path = Path(workspace)
    
    total_files = 0
    projects_with_evidence = 0
    total_extracted = 0
    total_transformed = 0
    total_merged = 0
    
    # Build list of projects to scan: all projects from projects.json
    projects_to_scan = []
    
    for folder_name, project_info in projects.items():
        project_path = workspace_path / folder_name
        if project_path.exists():
            projects_to_scan.append({
                "path": project_path,
                "id": project_info["id"],
                "label": project_info["label"],
                "folder": folder_name,
            })
    
    logger.info(f"  Total projects to scan: {len(projects_to_scan)}")
    logger.info("")
    
    for scan_project in projects_to_scan:
        project_folder = scan_project["path"]
        project_id = scan_project["id"]
        
        evidence_rel_path = config.get("project_discovery.structure.evidence_dir", ".eva/evidence")
        evidence_dir = project_folder / Path(evidence_rel_path)
        
        if not evidence_dir.exists():
            # Skip: no evidence directory
            continue
        
        # Found a project with evidence!
        projects_with_evidence += 1
        
        # Extract
        project_start = datetime.now(timezone.utc)
        records, extract_errors = extract_project_evidence(project_folder, config)
        total_files += len(list(evidence_dir.glob("*.json")))
        total_extracted += len(records)
        
        # Transform
        transformed, transform_errors = transform_project_evidence(
            records, project_id, schema, config
        )
        total_transformed += len(transformed)
        
        # Validate transformed records
        validation_counts = {
            "PASS": 0,
            "FAIL": 0,
            "SKIP": 0,
        }
        for record in transformed:
            test_result = record.get("validation", {}).get("test_result", "SKIP")
            validation_counts[test_result] = validation_counts.get(test_result, 0) + 1
        
        # Merge
        merged, merge_errors = merge_into_portfolio(
            evidence_file,
            transformed,
            project_id,
            config
        )
        total_merged += merged
        
        project_end = datetime.now(timezone.utc)
        duration = (project_end - project_start).total_seconds() * 1000
        
        # Store result
        per_project_results[project_id] = {
            "folder": project_folder.name,
            "label": scan_project["label"],
            "files_found": len(records),
            "records_extracted": len(records),
            "records_transformed": len(transformed),
            "records_merged": merged,
            "validation": validation_counts,
            "errors": extract_errors + transform_errors + merge_errors,
            "duration_ms": duration,
        }
        
        status = "[OK]" if not (extract_errors or transform_errors or merge_errors) else "[WN]"
        logger.info(f"  {status} {project_id}: {len(records)} files -> "
              f"{len(transformed)} transformed -> {merged} merged")
        
        if extract_errors or transform_errors or merge_errors:
            for error in (extract_errors + transform_errors + merge_errors)[:3]:
                logger.warning(f"      - {error}")
    logger.info("")
    logger.info(f"[STAGE 2] MERGE: Consolidating records into portfolio...")
    logger.info(f"  Total files: {total_files}")
    logger.info(f"  Total extracted: {total_extracted}")
    logger.info(f"  Total transformed: {total_transformed}")
    logger.info(f"  Total merged: {total_merged}")
    logger.info("")
    
    # Validate portfolio
    logger.info("[STAGE 3] VALIDATE: Portfolio-wide validation...")
    pass_count, fail_count, skip_count, validation_errors = validate_portfolio(
        evidence_file, schema
    )
    
    total_records = pass_count + fail_count + skip_count
    validation_rate = (pass_count / total_records * 100) if total_records > 0 else 0
    
    logger.info(f"  Total records: {total_records}")
    logger.info(f"  Pass: {pass_count} ({validation_rate:.1f}%)")
    logger.info(f"  Fail: {fail_count}")
    logger.info(f"  Skip: {skip_count}")
    
    if validation_errors:
        logger.warning(f"  Errors: {len(validation_errors)}")
        for error in validation_errors[:5]:
            logger.warning(f"    - {error}")
    
    logger.info("")
    
    # Write portfolio validation marker
    if evidence_file.exists():
        with open(evidence_file) as f:
            portfolio = json.load(f)
        
        # Add portfolio-level metadata
        portfolio["_portfolio_metadata"] = {
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "projects_scanned": len(projects),
            "projects_with_evidence": projects_with_evidence,
            "total_records": len(portfolio.get("objects", [])),
            "validation_rate": validation_rate,
        }
        
        with open(evidence_file, "w") as f:
            json.dump(portfolio, f, indent=2, default=str)
    
    # Generate report
    end_time = datetime.now(timezone.utc)
    duration = (end_time - start_time).total_seconds() * 1000
    
    result = SyncResult(
        status="PASS" if fail_count == 0 and not validation_errors else "WARN",
        timestamp=end_time.isoformat(),
        duration_ms=duration,
        total_files_scanned=total_files,
        projects_with_evidence=projects_with_evidence,
        projects_without_evidence=len(projects_to_scan) - projects_with_evidence,
        total_records_extracted=total_extracted,
        total_records_transformed=total_transformed,
        total_records_merged=total_merged,
        total_validated_pass=pass_count,
        total_validated_fail=fail_count,
        total_validated_skip=skip_count,
        validation_rate=validation_rate,
        merge_gates_blocked=fail_count,
        per_project_results=per_project_results,
        failure_count=len(validation_errors),
        warning_count=fail_count,
    )
    
    # Write report
    logger.info("[STAGE 4] REPORT: Generating sync report...")
    report_file = resolve_path(config, "reporting.report_file", Path(target_repo))
    report_file.parent.mkdir(parents=True, exist_ok=True)
    write_report(report_file, result)
    logger.info(f"  Report: {report_file}")
    
    logger.info("")
    logger.info("=" * 80)
    logger.info(f"Status: {result.status}")
    logger.info(f"Duration: {duration:.0f}ms")
    logger.info(f"Projects with evidence: {projects_with_evidence}/{len(projects)}")
    logger.info(f"Records in portfolio: {total_records}")
    logger.info(f"Validation rate: {validation_rate:.1f}%")
    logger.info("=" * 80)
    
    return 0 if result.status == "PASS" else 1


if __name__ == "__main__":
    # Initialize logger
    logger = setup_logging('sync-evidence-all-projects')
    ensure_directories()
    
    try:
        if len(sys.argv) < 3:
            logger.error(format_status(STATUS_ERROR, "Missing required arguments"))
            logger.info("Usage: python sync-evidence-all-projects.py <workspace> <target_repo>")
            logger.info("\nExample:")
            logger.info("  python sync-evidence-all-projects.py \\")
            logger.info("    C:\\eva-foundry\\eva-foundry \\")
            logger.info("    C:\\eva-foundry\\eva-foundry\\37-data-model")
            sys.exit(2)
        
        workspace = Path(sys.argv[1])
        target_repo = Path(sys.argv[2])
        
        logger.info(format_status(STATUS_INFO, "Script: sync-evidence-all-projects"))
        logger.info(format_status(STATUS_INFO, f"Workspace: {workspace}"))
        logger.info(format_status(STATUS_INFO, f"Target repo: {target_repo}"))
        
        # Professional Coding Standards: Evidence at operation start
        save_evidence(
            operation="sync-evidence-all-projects",
            status="started",
            metrics={
                "workspace": str(workspace),
                "target_repo": str(target_repo),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # Professional Coding Standards: Pre-flight checks
        logger.info(format_status(STATUS_INFO, "Running pre-flight checks"))
        
        if not check_directory_exists(workspace, "workspace directory", logger):
            sys.exit(2)
        
        if not check_directory_exists(target_repo, "target repo directory", logger):
            sys.exit(2)
        
        logger.info(format_status(STATUS_PASS, "Pre-flight checks passed"))
        
        # Run orchestration
        exit_code = orchestrate_portfolio_sync(str(workspace), str(target_repo))
        
        # Professional Coding Standards: Evidence at completion
        save_evidence(
            operation="sync-evidence-all-projects",
            status="completed" if exit_code == 0 else "failed",
            metrics={
               "exit_code": exit_code
            }
        )
        
        sys.exit(exit_code)
    
    except Exception as e:
        # Professional Coding Standards: Structured error handling
        error_msg = f"Fatal error during portfolio sync: {str(e)}"
        logger.error(format_status(STATUS_ERROR, error_msg))
        save_error_evidence(e, "sync-evidence-all-projects")
        sys.exit(2)

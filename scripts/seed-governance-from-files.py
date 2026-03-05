#!/usr/bin/env python3
"""
Seed governance data from files to data model.

Extracts governance metadata from README.md, PLAN.md, STATUS.md, and ACCEPTANCE.md
and creates/updates workspace_config, projects (with governance), and project_work records.

Usage:
    python scripts/seed-governance-from-files.py --project 07-foundation-layer
    python scripts/seed-governance-from-files.py --workspace eva-foundry
    python scripts/seed-governance-from-files.py --all-projects
"""
import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def extract_governance_from_readme(readme_path: Path) -> dict[str, Any]:
    """Extract governance metadata from README.md."""
    if not readme_path.exists():
        return {}
    
    content = readme_path.read_text(encoding="utf-8")
    
    governance = {
        "readme_summary": "",
        "purpose": "",
        "key_artifacts": [],
        "current_sprint": {},
        "latest_achievement": {}
    }
    
    # Extract first paragraph as summary (after title)
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if line.startswith("# ") and i + 2 < len(lines):
            # Skip to first non-empty line after title
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            if j < len(lines):
                governance["readme_summary"] = lines[j].strip()[:500]  # Limit to 500 chars
            break
    
    # Extract purpose (look for "## Purpose" section)
    purpose_match = re.search(r"## Purpose[^\n]*\n+(.*?)(?=##|\Z)", content, re.DOTALL)
    if purpose_match:
        purpose_text = purpose_match.group(1).strip()
        governance["purpose"] = purpose_text[:1000]  # Limit to 1000 chars
    
    # Extract latest achievement (look for "## Latest Achievement" section)
    achievement_match = re.search(
        r"## Latest Achievement[^\n]*\n+\[x\]\s+\*\*Session\s+\d+\s+\(([^)]+)\)\*\*:\s+([^\n]+)",
        content
    )
    if achievement_match:
        date_str, title = achievement_match.groups()
        # Parse date (format: "2026-03-03 19:39 ET")
        try:
            date_parsed = datetime.strptime(date_str.split()[0], "%Y-%m-%d")
            governance["latest_achievement"] = {
                "date": date_parsed.strftime("%Y-%m-%d"),
                "title": title.strip(),
                "deliverables": []  # Could be enhanced to extract from content
            }
        except ValueError:
            pass
    
    return governance


def extract_work_from_status(status_path: Path) -> dict[str, Any]:
    """Extract work session data from STATUS.md."""
    if not status_path.exists():
        return {}
    
    content = status_path.read_text(encoding="utf-8")
    
    work_session = {
        "session_summary": {},
        "tasks": [],
        "blockers": [],
        "metrics": {}
    }
    
    # Extract current phase
    phase_match = re.search(r"\*\*Active\*\*:\s+([^\n]+)", content)
    if phase_match:
        work_session["current_phase"] = phase_match.group(1).strip()
    
    # Extract session summary
    session_match = re.search(
        r"## Session Summary[^\n]*\n+### [^:]+:\s+([^\n]+)\n+\*\*Objective\*\*:\s+([^\n]+)",
        content
    )
    if session_match:
        title, objective = session_match.groups()
        work_session["session_summary"] = {
            "session_number": 1,  # Could be extracted from title
            "date": datetime.now().strftime("%Y-%m-%d"),
            "objective": objective.strip(),
            "status": "Complete"
        }
    
    return work_session


def extract_acceptance_criteria(acceptance_path: Path) -> list[dict[str, Any]]:
    """Extract acceptance criteria from ACCEPTANCE.md."""
    if not acceptance_path.exists():
        return []
    
    content = acceptance_path.read_text(encoding="utf-8")
    criteria = []
    
    # Look for table rows with gate criteria
    table_pattern = r"\|\s+([A-Z0-9-]+)\s+\|\s+([^|]+)\s+\|\s+([A-Z_]+)\s+\|"
    for match in re.finditer(table_pattern, content):
        gate, desc, status = match.groups()
        criteria.append({
            "gate": gate.strip(),
            "criteria": desc.strip(),
            "status": status.strip()
        })
    
    return criteria


def seed_workspace_config(workspace_root: Path, api_base: str) -> dict[str, Any]:
    """Create workspace_config record."""
    workspace_id = workspace_root.name
    
    config = {
        "id": workspace_id,
        "label": "EVA Foundry Workspace",
        "workspace_root": str(workspace_root),
        "best_practices": {
            "encoding_safety": "ASCII-only, no Unicode characters in production code",
            "component_architecture": "DebugArtifactCollector, SessionManager, StructuredErrorHandler",
            "evidence_collection": "Capture state at every operation boundary (pre/success/error)",
            "timestamped_naming": "{component}_{context}_{YYYYMMDD_HHMMSS}.{ext}",
            "zero_setup_execution": "Auto-detect structure, validate environment, normalize parameters"
        },
        "bootstrap_rules": {
            "step_1": "Read workspace best practices",
            "step_2": "Query data model for project context",
            "step_3": "Read project-specific skills",
            "fallback_strategy": "Read local governance files (README, PLAN, STATUS, ACCEPTANCE)"
        },
        "data_model_config": {
            "cloud_endpoint": "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io",
            "local_endpoint": "http://localhost:8010",
            "timeout_seconds": 30
        },
        "notes": "Configuration-as-data architecture implemented March 5, 2026"
    }
    
    print(f"[INFO] Created workspace_config for {workspace_id}")
    return config


def seed_project_governance(project_folder: Path) -> dict[str, Any]:
    """Extract and create project governance data."""
    project_id = project_folder.name
    
    readme_path = project_folder / "README.md"
    status_path = project_folder / "STATUS.md"
    acceptance_path = project_folder / "ACCEPTANCE.md"
    
    governance = extract_governance_from_readme(readme_path)
    work_session = extract_work_from_status(status_path)
    acceptance_criteria = extract_acceptance_criteria(acceptance_path)
    
    print(f"[INFO] Extracted governance for {project_id}")
    print(f"  - Governance fields: {len([k for k, v in governance.items() if v])}")
    print(f"  - Acceptance criteria: {len(acceptance_criteria)}")
    print(f"  - Work session: {'Yes' if work_session.get('session_summary') else 'No'}")
    
    return {
        "governance": governance,
        "acceptance_criteria": acceptance_criteria,
        "work_session": work_session
    }


def main():
    parser = argparse.ArgumentParser(description="Seed governance data from files")
    parser.add_argument("--project", help="Single project folder to process")
    parser.add_argument("--workspace", help="Workspace folder to create workspace_config")
    parser.add_argument("--all-projects", action="store_true", help="Process all projects")
    parser.add_argument("--output", help="Output JSON file", default="governance-seed.json")
    
    args = parser.parse_args()
    
    # Determine workspace root
    workspace_root = Path(__file__).parent.parent.parent
    if args.workspace:
        workspace_root = Path(args.workspace)
    
    seed_data = {
        "workspace_config": [],
        "projects_updates": [],
        "project_work": []
    }
    
    # Seed workspace config if requested
    if args.workspace or args.all_projects:
        config = seed_workspace_config(workspace_root, "http://localhost:8010")
        seed_data["workspace_config"].append(config)
    
    # Process projects
    projects_to_process = []
    if args.project:
        projects_to_process.append(workspace_root / args.project)
    elif args.all_projects:
        # Find all project folders (pattern: NN-name)
        for folder in workspace_root.iterdir():
            if folder.is_dir() and re.match(r"^\d{2}-", folder.name):
                projects_to_process.append(folder)
    
    for project_folder in projects_to_process:
        if not project_folder.exists():
            print(f"[WARN] Project folder not found: {project_folder}")
            continue
        
        project_id = project_folder.name
        governance_data = seed_project_governance(project_folder)
        
        # Create project update entry
        seed_data["projects_updates"].append({
            "id": project_id,
            "governance": governance_data["governance"],
            "acceptance_criteria": governance_data["acceptance_criteria"]
        })
        
        # Create project_work entry if work session data available
        if governance_data["work_session"].get("session_summary"):
            seed_data["project_work"].append({
                "id": f"{project_id}-{datetime.now().strftime('%Y-%m-%d')}",
                "project_id": project_id,
                "current_phase": governance_data["work_session"].get("current_phase", "Unknown"),
                "session_summary": governance_data["work_session"]["session_summary"],
                "tasks": governance_data["work_session"].get("tasks", []),
                "blockers": governance_data["work_session"].get("blockers", []),
                "metrics": governance_data["work_session"].get("metrics", {})
            })
    
    # Write output
    output_path = Path(args.output)
    output_path.write_text(json.dumps(seed_data, indent=2), encoding="utf-8")
    print(f"\n[PASS] Governance seed data written to {output_path}")
    print(f"  - Workspace configs: {len(seed_data['workspace_config'])}")
    print(f"  - Project updates: {len(seed_data['projects_updates'])}")
    print(f"  - Project work sessions: {len(seed_data['project_work'])}")
    print(f"\nNext steps:")
    print(f"  1. Review {output_path}")
    print(f"  2. Use data model API to PUT records")
    print(f"  3  3. Run export-governance-to-files.py to regenerate files from model")


if __name__ == "__main__":
    main()

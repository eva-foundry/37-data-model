#!/usr/bin/env python3
"""
Export governance data from data model to files.

Generates README.md, STATUS.md sections from workspace_config, projects (governance), and project_work records.
Files become snapshots/exports from the data model (single source of truth).

Usage:
    python scripts/export-governance-to-files.py --project 07-foundation-layer
    python scripts/export-governance-to-files.py --all-projects
"""
import argparse
import sys
from pathlib import Path
from typing import Any
import urllib.request
import urllib.error
import json

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


def query_data_model(endpoint: str, api_base: str) -> Any:
    """Query the data model API."""
    url = f"{api_base}{endpoint}"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"[ERROR] Failed to query {url}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"[ERROR] Failed to parse JSON from {url}: {e}")
        return None


def generate_readme_governance_section(project: dict[str, Any]) -> str:
    """Generate governance section for README.md from project record."""
    governance = project.get("governance", {})
    if not governance:
        return ""
    
    lines = ["---", "", "## Governance (Data Model-First)", ""]
    
    # Purpose
    if governance.get("purpose"):
        lines.extend(["### Purpose", "", governance["purpose"], ""])
    
    # Current sprint
    current_sprint = governance.get("current_sprint", {})
    if current_sprint:
        lines.extend(["### Current Sprint", ""])
        if current_sprint.get("phase"):
            lines.append(f"**Phase**: {current_sprint['phase']}")
        if current_sprint.get("focus"):
            lines.append(f"**Focus**: {current_sprint['focus']}")
        lines.append("")
    
    # Latest achievement
    latest = governance.get("latest_achievement", {})
    if latest:
        lines.extend(["### Latest Achievement", ""])
        if latest.get("date"):
            lines.append(f"**Date**: {latest['date']}")
        if latest.get("title"):
            lines.append(f"**Title**: {latest['title']}")
        if latest.get("deliverables"):
            lines.append(f"**Deliverables**:")
            for deliverable in latest["deliverables"]:
                lines.append(f"- {deliverable}")
        lines.append("")
    
    # Key artifacts
    artifacts = governance.get("key_artifacts", [])
    if artifacts:
        lines.extend(["### Key Artifacts", "", "| Artifact | Version | Description |", "|----------|---------|-------------|"])
        for artifact in artifacts:
            name = artifact.get("name", "")
            version = artifact.get("version", "")
            desc = artifact.get("description", "")
            lines.append(f"| {name} | {version} | {desc} |")
        lines.append("")
    
    lines.append("")
    lines.append("*This section is auto-generated from the data model. Query: GET /model/projects/{id}*")
    lines.append("")
    
    return "\n".join(lines)


def generate_status_work_section(project_work: dict[str, Any]) -> str:
    """Generate work session section for STATUS.md from project_work record."""
    if not project_work:
        return ""
    
    lines = ["---", "", "## Current Work Session (Data Model-First)", ""]
    
    session = project_work.get("session_summary", {})
    if session:
        lines.extend([
            f"**Session**: {session.get('session_number', 'N/A')}",
            f"**Date**: {session.get('date', 'N/A')}",
            f"**Objective**: {session.get('objective', 'N/A')}",
            f"**Status**: {session.get('status', 'N/A')}",
            ""
        ])
    
    # Tasks
    tasks = project_work.get("tasks", [])
    if tasks:
        lines.extend(["### Tasks", ""])
        for task in tasks:
            status_icon = {"not_started": "[ ]", "in_progress": "[~]", "complete": "[x]", "blocked": "[!]"}.get(
                task.get("status", "not_started"), "[ ]"
            )
            lines.append(f"{status_icon} **{task.get('id')}**: {task.get('title')}")
        lines.append("")
    
    # Blockers
    blockers = project_work.get("blockers", [])
    if blockers:
        lines.extend(["### Blockers", ""])
        for blocker in blockers:
            lines.append(f"- **{blocker.get('id')}** [{blocker.get('severity', 'medium').upper()}]: {blocker.get('description')}")
        lines.append("")
    
    # Metrics
    metrics = project_work.get("metrics", {})
    if metrics:
        lines.extend(["### Metrics", ""])
        if "mti_score" in metrics:
            lines.append(f"- **MTI Score**: {metrics['mti_score']}")
        if "test_count" in metrics:
            lines.append(f"- **Test Count**: {metrics['test_count']}")
        if "coverage_percent" in metrics:
            lines.append(f"- **Coverage**: {metrics['coverage_percent']}%")
        lines.append("")
    
    lines.append("")
    lines.append("*This section is auto-generated from the data model. Query: GET /model/project_work/{id}*")
    lines.append("")
    
    return "\n".join(lines)


def export_project_governance(project_id: str, project_folder: Path, api_base: str):
    """Export governance data for a single project."""
    print(f"[INFO] Exporting governance for {project_id}")
    
    # Query data model
    project = query_data_model(f"/model/projects/{project_id}", api_base)
    if not project:
        print(f"[WARN] Project {project_id} not found in data model")
        return
    
    # Query project work (use latest date)
    project_work_list = query_data_model(f"/model/project_work/", api_base)
    project_work = None
    if project_work_list:
        # Filter by project_id
        matching = [pw for pw in project_work_list if pw.get("project_id") == project_id]
        if matching:
            # Sort by date descending, take first
            matching.sort(key=lambda x: x.get("id", ""), reverse=True)
            project_work = matching[0]
    
    # Generate README governance section
    readme_section = generate_readme_governance_section(project)
    if readme_section:
        readme_path = project_folder / "README-GOVERNANCE.md"
        readme_path.write_text(readme_section, encoding="utf-8")
        print(f"  [PASS] Generated {readme_path}")
    
    # Generate STATUS work section
    if project_work:
        status_section = generate_status_work_section(project_work)
        if status_section:
            status_path = project_folder / "STATUS-WORK.md"
            status_path.write_text(status_section, encoding="utf-8")
            print(f"  [PASS] Generated {status_path}")


def main():
    parser = argparse.ArgumentParser(description="Export governance data to files")
    parser.add_argument("--project", help="Single project ID to export")
    parser.add_argument("--all-projects", action="store_true", help="Export all projects")
    parser.add_argument("--api-base", 
                       default="https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io",
                       help="Data model API base URL")
    
    args = parser.parse_args()
    
    # Determine workspace root
    workspace_root = Path(__file__).parent.parent.parent
    
    # Process projects
    projects_to_export = []
    if args.project:
        projects_to_export.append(args.project)
    elif args.all_projects:
        # Query all projects from data model
        projects = query_data_model("/model/projects/", args.api_base)
        if projects:
            projects_to_export = [p.get("id") for p in projects if p.get("id")]
        else:
            print("[ERROR] Failed to query projects from data model")
            sys.exit(1)
    else:
        print("[ERROR] Must specify --project or --all-projects")
        sys.exit(1)
    
    for project_id in projects_to_export:
        project_folder = workspace_root / project_id
        if not project_folder.exists():
            print(f"[WARN] Project folder not found: {project_folder}")
            continue
        
        export_project_governance(project_id, project_folder, args.api_base)
    
    print(f"\n[PASS] Export complete for {len(projects_to_export)} projects")
    print(f"\nGenerated files:")
    print(f"  - README-GOVERNANCE.md (append to existing README.md)")
    print(f"  - STATUS-WORK.md (append to existing STATUS.md)")
    print(f"\nNext steps:")
    print(f"  1. Review generated files")
    print(f"  2. Merge into existing governance docs")
    print(f"  3. Remove outdated manual sections")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import json
from pathlib import Path
import sys

workspace = sys.argv[1] if len(sys.argv) > 1 else "C:\\AICOE\\eva-foundry"

# Load projects
with open('model/projects.json') as f:
    data = json.load(f)

projects_by_folder = {}
for project in data.get("projects", []):
    if project.get("is_active") and "folder" in project:
        projects_by_folder[project["folder"]] = {
            "id": project['id'],
            "label": project.get("label"),
        }

print(f"Projects in projects.json: {len(projects_by_folder)}")
print("Sample folders in projects.json:")
for folder in sorted(projects_by_folder.keys())[:5]:
    print(f"  - {folder}: {projects_by_folder[folder]['id']}")

workspace_path = Path(workspace)
print(f"\nWorkspace: {workspace_path}")
print(f"Exists: {workspace_path.exists()}")

print("\nScanning workspace:")
found_with_evidence = []
for d in sorted(workspace_path.iterdir()):
    if not d.is_dir():
        continue
    
    folder_name = d.name
    
    if folder_name in projects_by_folder:
        # Check for evidence
        evidence_dir = d / ".eva" / "evidence"
        if evidence_dir.exists():
            count = len(list(evidence_dir.glob("*.json")))
            print(f"  ✓ {folder_name}: FOUND with evidence ({count} files)")
            found_with_evidence.append((folder_name, count))
        else:
            print(f"  ✓ {folder_name}: in projects but NO evidence")

print(f"\nTotal with evidence: {len(found_with_evidence)}")
for folder, count in found_with_evidence:
    print(f"  - {folder}: {count} files")

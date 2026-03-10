#!/usr/bin/env python3
import json

with open('model/projects.json') as f:
    data = json.load(f)

# Check which projects have which folders and ADO IDs
print("Checking for missing projects...")
print()

# Get ADO and folder mapping
existing = {}
for proj in data['projects']:
    existing[proj['id']] = proj.get('ado_epic_id', 'NOT SET')

# Sample
print("Sample existing projects:")
for proj_id in list(existing.keys())[:5]:
    print(f"  {proj_id}: ado_epic_id={existing[proj_id]}")

print()
print(f"Total: {len(existing)} projects in projects.json")

# Check which numbered folders are in workspace
from pathlib import Path
workspace = Path('../../')
all_folders = sorted([d.name for d in workspace.iterdir() if d.is_dir() and d.name[0].isdigit()])
print(f"Numbered folders in workspace: {len(all_folders)}")
for folder in all_folders[:10]:
    status = "✓" if folder in existing else "✗ MISSING"
    print(f"  {status} {folder}")

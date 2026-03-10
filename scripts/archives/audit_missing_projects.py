#!/usr/bin/env python3
"""Audit projects.json against workspace folders."""
import json
from pathlib import Path

# Load projects.json
with open('model/projects.json') as f:
    data = json.load(f)

in_json = {proj['id'] for proj in data['projects']}
print(f'Projects already in JSON: {len(in_json)}')

# All folders in workspace
workspace = Path(__file__).parent.parent.parent  # Go back to eva-foundry
print(f'Script location: {Path(__file__).absolute()}', )
print(f'Workspace: {workspace.absolute()}')
all_folders = sorted([d.name for d in workspace.iterdir() if d.is_dir() and (d.name[0].isdigit() or d.name == '51-ACA')])

# Skip backups and utility folders
skip_patterns = ['bak', 'workspace-notes', 'system-analysis', 'test-project']
folders_to_check = [f for f in all_folders if not any(skip in f for skip in skip_patterns)]

print(f'Folders to check: {len(folders_to_check)}')

# Find missing
missing = [f for f in folders_to_check if f not in in_json]

print(f'\n✗ Missing from projects.json ({len(missing)}):')
for m in sorted(missing):
    print(f'  - {m}')

print(f'\n✓ Present in projects.json: {len(folders_to_check) - len(missing)}')

# Show duplicate/conflicting entries (like 34-AIRA vs 34-eva-agents)
print(f'\nPotential duplicates or conflicts:')
thirty_four = [p for p in data['projects'] if p['id'].startswith('34-')]
if len(thirty_four) > 1:
    for proj in thirty_four:
        print(f'  - {proj["id"]}: {proj.get("label", "NO LABEL")}')

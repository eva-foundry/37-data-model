#!/usr/bin/env python3
import json

with open('model/projects.json') as f:
    data = json.load(f)

print(f'✓ Valid JSON')
print(f'Total projects: {len(data["projects"])}')
print()

# List the projects we just added
recent = ['34-AIRA', '50-eva-ops', '51-ACA', '52-DA-space-cleanup', '53-refactor', '54-ai-engineering-hub']
for proj_id in recent:
    proj = next((p for p in data['projects'] if p['id'] == proj_id), None)
    if proj:
        print(f"✓ {proj_id}: {proj.get('label', 'NO LABEL')}")
    else:
        print(f"✗ {proj_id}: NOT FOUND")

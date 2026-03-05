#!/usr/bin/env python3
import json

with open('model/projects.json') as f:
    data = json.load(f)

print("Checking projects for missing 'folder' field...")
missing_count = 0
for i, proj in enumerate(data['projects']):
    if 'folder' not in proj:
        print(f"Project {i}: {proj.get('id', 'UNKNOWN')} - NO FOLDER FIELD")
        missing_count += 1
        # Print the whole project to understand structure
        print(f"  Content: {proj}")

if missing_count == 0:
    print("✓ All projects have 'folder' field")
else:
    print(f"\n⚠ {missing_count} projects missing 'folder' field")

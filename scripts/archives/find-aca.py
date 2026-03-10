#!/usr/bin/env python3
import json

with open('model/projects.json') as f:
    data = json.load(f)

print("Looking for project with '51' or 'ACA' in ID...")
for proj in data['projects']:
    proj_id = proj.get('id', '')
    if '51' in proj_id or 'ACA' in proj_id:
        print(f"ID: {proj_id}")
        print(f"  Folder: {proj.get('folder', 'NOT SET')}")
        print(f"  Active: {proj.get('is_active', False)}")
        print()

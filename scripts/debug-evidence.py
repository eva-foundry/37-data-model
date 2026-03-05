#!/usr/bin/env python3
import json

with open('model/evidence.json') as f:
    data = json.load(f)

print(f'Total records: {len(data.get("objects", []))}')
print()

if data.get('objects'):
    first = data['objects'][0]
    print(f'First record keys: {list(first.keys())}')
    print(f'First record:')
    print(json.dumps(first, indent=2)[:500])
    print()
    
    # Check which records have 'id' field
    has_id = sum(1 for obj in data['objects'] if 'id' in obj)
    print(f'Records with id field: {has_id}/{len(data["objects"])}')

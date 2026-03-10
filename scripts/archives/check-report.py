#!/usr/bin/env python3
import json

with open('sync-evidence-report.json') as f:
    report = json.load(f)

print('Status:', report['status'])
print('Projects with evidence:', report['projects_with_evidence'])
print('Total records:', report['total_records_merged'])
print('Per-project:')
for proj_id, result in report['per_project_results'].items():
    print(f"  {proj_id}: {result['records_merged']} merged, {len(result.get('errors', []))} errors")
    if result.get('errors'):
        for error in result['errors'][:2]:
            print(f"    - {error}")

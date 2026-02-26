import json
from pathlib import Path

f = Path('model/endpoints.json')
data = json.loads(f.read_text(encoding='utf-8'))
key = 'endpoints'
fixed = 0

for ep in data[key]:
    if 'feature_flag' not in ep:
        ep['feature_flag'] = None
        fixed += 1
    if 'auth' not in ep:
        ep['auth'] = []
        fixed += 1
    if ep.get('cosmos_reads') is None:
        ep['cosmos_reads'] = []
        fixed += 1
    if ep.get('cosmos_writes') is None:
        ep['cosmos_writes'] = []
        fixed += 1

f.write_text(json.dumps(data, indent=2, ensure_ascii=True), encoding='utf-8')
total = len(data[key])
print("Fixed. Total endpoints: " + str(total) + ". Fields patched: " + str(fixed))

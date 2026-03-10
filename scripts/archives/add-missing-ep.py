import json
from pathlib import Path

f = Path('model/endpoints.json')
data = json.loads(f.read_text(encoding='utf-8'))
key = 'endpoints'

ids = {e['id'] for e in data[key]}
to_add = [
    {
        'id': 'GET /v1/config/translations/export',
        'method': 'GET', 'path': '/v1/config/translations/export',
        'service': 'eva-brain-api', 'status': 'planned',
        'description': 'Export all translations for all languages as CSV. Format: key,language,value. Used by AdminI18nByScreenPage and TranslationsPage export button.',
        'feature_flag': None, 'auth': [], 'cosmos_reads': [], 'cosmos_writes': [],
        'source_file': 'model/endpoints.json', 'is_active': True, 'row_version': 1
    }
]

added = 0
for ep in to_add:
    if ep['id'] not in ids:
        data[key].append(ep)
        added += 1
        print('ADDED: ' + ep['id'])

f.write_text(json.dumps(data, indent=2, ensure_ascii=True), encoding='utf-8')
print('Done. Total: ' + str(len(data[key])) + '  Added: ' + str(added))

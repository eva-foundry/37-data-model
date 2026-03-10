"""Quick script to check and seed production data"""
import requests
import json

BASE_URL = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

print("=" * 80)
print("Priority 1: Seed Infrastructure Monitoring Data")
print("=" * 80)
print()

# Check before
print("BEFORE SEED:")
print("-" * 40)
r = requests.get(f"{BASE_URL}/model/agent-summary")
data = r.json()
# Handle both response formats
if 'layers' in data and isinstance(data['layers'], dict):
    layers = data['layers']
    total = data.get('total', sum(layers.values()))
    operational = sum(1 for count in layers.values() if count > 0)
elif isinstance(data, dict) and all(isinstance(v, int) for v in data.values()):
    layers = data
    total = sum(layers.values())
    operational = sum(1 for count in layers.values() if count > 0)
else:
    print("Unexpected response format:")
    print(json.dumps(data, indent=2))
    import sys; sys.exit(1)

print(f"Operational layers: {operational}")
print(f"Total records: {total}")
empty = {name: count for name, count in layers.items() if count == 0}
print(f"Empty layers: {len(empty)}")
for name in empty:
    print(f"  - {name}")
print()

# Seed
print("SEEDING...")
print("-" * 40)
r = requests.post(
    f"{BASE_URL}/model/admin/seed",
    headers={"Authorization": "Bearer dev-admin"},
    timeout=120
)
seed_result = r.json()
print(f"Status: {r.status_code}")
print(f"Total: {seed_result.get('total', 'N/A')}")
print(f"Success: {seed_result.get('success', 'N/A')}")
print(f"Errors: {len(seed_result.get('errors', []))}")
print()

# Check after
print("AFTER SEED:")
print("-" * 40)
r = requests.get(f"{BASE_URL}/model/agent-summary")
data = r.json()
# Handle both response formats
if 'layers' in data and isinstance(data['layers'], dict):
    layers = data['layers']
    total = data.get('total', sum(layers.values()))
    operational = sum(1 for count in layers.values() if count > 0)
elif isinstance(data, dict) and all(isinstance(v, int) for v in data.values()):
    layers = data
    total = sum(layers.values())
    operational = sum(1 for count in layers.values() if count > 0)
else:
    print("Unexpected response format")

print(f"Operational layers: {operational}")
print(f"Total records: {total}")
empty = {name: count for name, count in layers.items() if count == 0}
print(f"Empty layers: {len(empty)}")
for name in empty:
    print(f"  - {name}")
print()

print("=" * 80)
print("Priority 1 Complete!" if len(empty) == 0 else f"Still {len(empty)} empty layers")
print("=" * 80)

import requests
import json

url = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
r = requests.get(f"{url}/model/agent-summary")
data = r.json()

with open("C:\\eva-foundry\\eva-foundry\\37-data-model\\status-check.json", "w") as f:
    json.dump(data, f, indent=2)

layers = data if isinstance(data, dict) and 'total' not in data else data.get('layers', data)
operational = sum(1 for c in layers.values() if c > 0)
total = sum(layers.values())
empty = [n for n, c in layers.items() if c == 0]

result = {
    "operational_layers": operational,
    "total_records": total,
    "empty_count": len(empty),
    "empty_layers": empty
}

with open("C:\\eva-foundry\\eva-foundry\\37-data-model\\status-summary.json", "w") as f:
    json.dump(result, f, indent=2)

print("Status check complete. See status-summary.json")

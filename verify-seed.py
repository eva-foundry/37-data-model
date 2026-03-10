import requests
import json
from datetime import datetime

# Query API
url = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent-summary"
response = requests.get(url)
data = response.json()

# Count operational layers (those with objects > 0)
operational = sum(1 for count in data['by_layer'].values() if count > 0)
total_objects = data['total']

# Display results
print(f"\n{'='*60}")
print(f"  SEED VERIFICATION - {datetime.now().strftime('%Y-%m-%d %H:%M:%S ET')}")
print(f"{'='*60}")
print(f"\nOperational Layers: {operational}")
print(f"Total Objects: {total_objects:,}")
print(f"\nBefore: 51 operational layers")
print(f"After:  {operational} operational layers")
print(f"Gain:   +{operational - 51} layers")
print(f"\n{'='*60}\n")

# Save evidence
evidence = {
    "operation": "seed-verification",
    "timestamp": datetime.now().isoformat(),
    "operational_layers": operational,
    "total_objects": total_objects,
    "before_layers": 51,
    "improvement": operational - 51
}

with open("evidence/seed-verification_" + datetime.now().strftime("%Y%m%d_%H%M%S") + ".json", "w") as f:
    json.dump(evidence, f, indent=2)

print(f"Evidence saved: evidence/seed-verification_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json\n")

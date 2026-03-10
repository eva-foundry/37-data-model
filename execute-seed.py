#!/usr/bin/env python
"""Call seed endpoint and display result."""
import subprocess
import requests
import json
from datetime import datetime

# Get admin token from Key Vault
print("[1/3] Retrieving admin token...")
result = subprocess.run([
    "az", "keyvault", "secret", "show",
    "--vault-name", "msubsandkv202603031449",
    "--name", "admin-token",
    "--query", "value",
    "-o", "tsv"
], capture_output=True, text=True)

if result.returncode != 0:
    print(f"ERROR: Failed to get admin token: {result.stderr}")
    exit(1)

admin_token = result.stdout.strip()
print(f"Token retrieved: {len(admin_token)} characters")

# Call seed endpoint
print("[2/3] Calling POST /model/admin/seed...")
url = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/admin/seed"
headers = {
    "Authorization": f"Bearer {admin_token}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, headers=headers, timeout=120)
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("\n=== SEED OPERATION SUCCESS ===")
        print(f"Message: {data.get('message', 'N/A')}")
        print(f"Duration: {data.get('duration_seconds', 'N/A')}s")
        print(f"Objects seeded: {data.get('objects_seeded', 'N/A')}")
        print(f"Layers processed: {data.get('layers_processed', 'N/A')}")
        
        # Save response
        with open(f"evidence/seed-success_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(data, f, indent=2)
        print("\nEvidence saved to evidence/seed-success_*.json")
    else:
        print(f"\n=== SEED OPERATION FAILED ===")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"ERROR: {e}")
    exit(2)

# Verify result
print("\n[3/3] Verifying operational layer count...")
guide_url = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/agent-guide"
guide_response = requests.get(guide_url)
if guide_response.status_code == 200:
    guide_data = guide_response.json()
    layer_count = len(guide_data.get("layers_available", []))
    print(f"Operational layers: {layer_count}")
    if layer_count >= 91:
        print("SUCCESS: Target of 91+ operational layers achieved!")
    else:
        print(f"WARNING: Only {layer_count} operational layers (target: 91)")
else:
    print(f"ERROR: Could not verify layer count (status: {guide_response.status_code})")

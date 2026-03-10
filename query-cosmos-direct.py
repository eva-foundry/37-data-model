#!/usr/bin/env python
"""Query Cosmos DB directly to count objects per layer."""
import os
import subprocess
from azure.cosmos import CosmosClient

print("=== DIRECT COSMOS DB QUERY ===\n")

# Get Cosmos credentials from Key Vault
print("[1/3] Retrieving Cosmos credentials...")
cosmos_url_result = subprocess.run([
    "az", "keyvault", "secret", "show",
    "--vault-name", "msubsandkv202603031449",
    "--name", "cosmos-url",
    "--query", "value",
    "-o", "tsv"
], capture_output=True, text=True)

cosmos_key_result = subprocess.run([
    "az", "keyvault", "secret", "show",
    "--vault-name", "msubsandkv202603031449",
    "--name", "cosmos-key",
    "--query", "value",
    "-o", "tsv"
], capture_output=True, text=True)

if cosmos_url_result.returncode != 0 or cosmos_key_result.returncode != 0:
    print("ERROR: Failed to retrieve Cosmos credentials")
    exit(1)

cosmos_url = cosmos_url_result.stdout.strip()
cosmos_key = cosmos_key_result.stdout.strip()
print(f"  Cosmos URL: {cosmos_url}")
print(f"  Cosmos Key: {len(cosmos_key)} characters\n")

# Connect to Cosmos
print("[2/3] Connecting to Cosmos DB...")
try:
    client = CosmosClient(cosmos_url, credential=cosmos_key)
    database = client.get_database_client("eva-data-model")
    container = database.get_container_client("model_objects")
    print("  Connected successfully\n")
except Exception as e:
    print(f"  ERROR: {e}")
    exit(2)

# Query for distinct layers
print("[3/3] Counting objects per layer...")
query = "SELECT c.layer, COUNT(1) as count FROM c GROUP BY c.layer"

try:
    results = list(container.query_items(
        query=query,
        enable_cross_partition_query=True
    ))
    
    # Sort by layer name
    results_sorted = sorted(results, key=lambda x: x.get('layer', ''))
    
    total_layers = len(results_sorted)
    total_objects = sum(r.get('count', 0) for r in results_sorted)
    
    print(f"\n{'Layer':<40} {'Count':>10}")
    print("=" * 52)
    
    for result in results_sorted:
        layer = result.get('layer', 'UNKNOWN')
        count = result.get('count', 0)
        print(f"{layer:<40} {count:>10,}")
    
    print("=" * 52)
    print(f"{'TOTAL OPERATIONAL LAYERS':<40} {total_layers:>10}")
    print(f"{'TOTAL OBJECTS':<40} {total_objects:>10,}")
    
    print(f"\n=== RESULT ===")
    print(f"Operational Layers: {total_layers}")
    print(f"Target: 91 layers")
    
    if total_layers >= 91:
        print("STATUS: SUCCESS - Target achieved!")
    elif total_layers > 51:
        print(f"STATUS: PARTIAL - Improved from 51 to {total_layers}")
    else:
        print(f"STATUS: NO CHANGE - Still at {total_layers} layers")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    exit(2)

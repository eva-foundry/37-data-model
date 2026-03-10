#!/usr/bin/env python3
"""
Generate layer-metadata-index.json from Data Model API.
This runs during deployment to ensure the metadata index reflects Cosmos DB truth.

Usage:
    python generate-layer-metadata-index.py                    # Cloud (production)
    python generate-layer-metadata-index.py --local             # Local dev (localhost:8010)
    python generate-layer-metadata-index.py --url <custom-url>  # Custom API endpoint
"""
import json
import sys
import os
import argparse
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("[ERROR] requests library not installed. Run: pip install requests")
    sys.exit(1)

def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description="Generate layer-metadata-index.json from Data Model API")
    parser.add_argument("--local", action="store_true", help="Use local API (http://localhost:8010)")
    parser.add_argument("--url", type=str, help="Custom API URL")
    args = parser.parse_args()
    
    print("=== LAYER METADATA INDEX GENERATOR ===")
    print("Generates layer-metadata-index.json from Cosmos DB ground truth\n")
    
    # Configuration
    if args.url:
        api_url = args.url.rstrip('/')
        source = f"Custom API ({api_url})"
    elif args.local:
        api_url = "http://localhost:8010"
        source = "Local API (MemoryStore or local Cosmos)"
    else:
        # Default: Cloud production
        api_url = os.getenv(
            "DATA_MODEL_API_URL",
            "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
        )
        source = "Cosmos DB (via production API)"
    
    metadata_file = Path(__file__).parent.parent / "model" / "layer-metadata-index.json"
    
    print(f"API endpoint: {api_url}")
    print(f"Data source: {source}\n")
    
    # Step 1: Query API
    print("[1/3] Querying Data Model API for layer counts...")
    try:
        response = requests.get(f"{api_url}/model/agent-summary", timeout=30)
        response.raise_for_status()
        summary = response.json()
        total_objects = summary.get("total", 0)
        print(f"  Total objects in Cosmos: {total_objects}")
    except Exception as e:
        print(f"  ERROR: Failed to query API: {e}")
        sys.exit(2)
    
    # Step 2: Generate metadata entries
    print("\n[2/3] Generating metadata entries...")
    metadata_entries = []
    layer_count = 0
    operational_count = 0
    
    layers_data = summary.get("layers", {})
    for layer_name, object_count in layers_data.items():
        layer_count += 1
        is_operational = object_count > 0
        if is_operational:
            operational_count += 1
        
        entry = {
            "layer_name": layer_name,
            "operational": is_operational,
            "object_count": object_count,
            "priority": "P3",  # Default
            "category": "General"  # Default
        }
        metadata_entries.append(entry)
    
    print(f"  Processed {layer_count} layers ({operational_count} operational)")
    
    # Step 3: Load existing metadata to preserve priority/category
    category_map = {}
    priority_map = {}
    
    if metadata_file.exists():
        print("\n  Loading existing metadata for priority/category preservation...")
        with open(metadata_file, 'r', encoding='utf-8') as f:
            existing = json.load(f)
        
        for existing_layer in existing.get("layers", []):
            layer_name = existing_layer.get("layer_name")
            if layer_name:
                category_map[layer_name] = existing_layer.get("category", "General")
                priority_map[layer_name] = existing_layer.get("priority", "P3")
        
        print(f"  Preserved {len(category_map)} category/priority mappings")
    
    # Apply preserved values
    for entry in metadata_entries:
        layer_name = entry["layer_name"]
        if layer_name in category_map:
            entry["category"] = category_map[layer_name]
        if layer_name in priority_map:
            entry["priority"] = priority_map[layer_name]
    
    # Build final metadata index
    metadata_index = {
        "schema_version": "2.0",
        "generated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generated_by": "generate-layer-metadata-index.py",
        "source": "Cosmos DB (via API /model/agent-summary)",
        "total_layers": layer_count,
        "operational_layers": operational_count,
        "layers": metadata_entries
    }
    
    # Step 4: Save
    print("\n[3/3] Writing metadata index...")
    print(f"  Total layers: {layer_count}")
    print(f"  Operational: {operational_count}")
    print(f"  Stub (no data): {layer_count - operational_count}")
    print(f"  Generated at: {metadata_index['generated_at']}")
    
    # Backup existing file
    if metadata_file.exists():
        backup_path = metadata_file.with_suffix(f".backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        metadata_file.rename(backup_path)
        print(f"\n  Backed up existing file to: {backup_path.name}")
    
    # Write new file
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata_index, f, indent=2, ensure_ascii=False)
    
    file_size = metadata_file.stat().st_size
    print(f"\n=== SUCCESS ===")
    print(f"Generated: {metadata_file}")
    print(f"File size: {file_size:,} bytes")
    
    # Verify
    with open(metadata_file, 'r', encoding='utf-8') as f:
        verify = json.load(f)
    
    print(f"\nVerification:")
    print(f"  Schema version: {verify.get('schema_version')}")
    print(f"  Total layers: {verify.get('total_layers')}")
    print(f"  Operational: {verify.get('operational_layers')}")
    print(f"  Generated: {verify.get('generated_at')}")
    
    print("\n=== COMPLETE ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())

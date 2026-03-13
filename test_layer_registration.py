#!/usr/bin/env python3
"""
Test Layer Registration Endpoint (Phase A L122-L129)

Usage:
    python test_layer_registration.py --layer L122-discovery_contexts.json --api-url https://... --admin-token <token>
"""

import json
import sys
import argparse
from pathlib import Path
from typing import Any
import urllib.request
import urllib.error

def load_layer_schema(filepath: str) -> dict[str, Any]:
    """Load and parse layer schema JSON file."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Layer file not found: {path}")
    
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def register_layer(
    layer_schema: dict[str, Any],
    api_url: str,
    admin_token: str
) -> dict[str, Any]:
    """
    POST /model/admin/layers with layer registration request.
    
    Returns:
        Success response or error details.
    """
    endpoint = f"{api_url}/model/admin/layers"
    
    # Prepare registration payload
    payload = {
        "layer_id": layer_schema["layer_id"],
        "layer_name": layer_schema["layer"],
        "domain_id": layer_schema.get("domain_id", "D13"),
        "domain_name": layer_schema.get("domain_name", "Discovery & Sense-Making"),
        "schema": layer_schema["schema"],
        "relationships": layer_schema.get("relationships", {}),
        "description": layer_schema.get("description", ""),
        "purpose": layer_schema.get("purpose", ""),
        "notes": layer_schema.get("notes", ""),
        "immutable": False,  # Default to mutable unless explicitly set
    }
    
    payload_json = json.dumps(payload).encode("utf-8")
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json",
    }
    
    print(f"[INFO] POST {endpoint}")
    print(f"[INFO] Payload: {len(payload_json):,} bytes")
    print(f"[INFO] Layer: {payload['layer_id']} — {payload['layer_name']}")
    
    try:
        req = urllib.request.Request(
            endpoint,
            data=payload_json,
            headers=headers,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            return {
                "success": True,
                "status_code": resp.status,
                "body": resp_data,
            }
    
    except urllib.error.HTTPError as exc:
        error_body = None
        try:
            error_body = json.loads(exc.read().decode("utf-8"))
        except:
            error_body = exc.read().decode("utf-8", errors="ignore")
        
        return {
            "success": False,
            "status_code": exc.code,
            "error": str(exc),
            "error_body": error_body,
        }
    except Exception as exc:
        return {
            "success": False,
            "error": str(exc),
            "error_type": type(exc).__name__,
        }

def main():
    parser = argparse.ArgumentParser(
        description="Test Layer Registration Endpoint (Phase A L122-L129)"
    )
    parser.add_argument(
        "--layer",
        required=True,
        help="Path to layer schema JSON file (e.g., evidence/phase-a/schemas/L122-discovery_contexts.json)",
    )
    parser.add_argument(
        "--api-url",
        default="https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io",
        help="API base URL (defaults to cloud)",
    )
    parser.add_argument(
        "--admin-token",
        default="dev-admin",
        help="Admin token for authentication",
    )
    
    args = parser.parse_args()
    
    print("═" * 81)
    print("Phase A Layer Registration Test")
    print("═" * 81)
    print()
    
    # Load schema
    try:
        layer_schema = load_layer_schema(args.layer)
        print(f"[OK] Layer schema loaded from {args.layer}")
        print(f"     - Layer ID: {layer_schema['layer_id']}")
        print(f"     - Layer Name: {layer_schema['layer']}")
        print(f"     - Domain: {layer_schema.get('domain_id', 'D13')}")
        print()
    except Exception as exc:
        print(f"[ERROR] Failed to load schema: {exc}")
        return 1
    
    # Register layer
    print("Registering layer...")
    result = register_layer(layer_schema, args.api_url, args.admin_token)
    
    if result["success"]:
        print(f"[OK] Registration successful! Status: {result['status_code']}")
        print()
        print("Response:")
        print(json.dumps(result["body"], indent=2))
        print()
        print("═" * 81)
        return 0
    else:
        print(f"[ERROR] Registration failed!")
        if "status_code" in result:
            print(f"[ERROR] Status: {result['status_code']}")
        print(f"[ERROR] {result.get('error', 'Unknown error')}")
        if result.get("error_body"):
            print(f"[ERROR] Details: {result['error_body']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())

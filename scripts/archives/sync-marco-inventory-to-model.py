#!/usr/bin/env python3
"""
Sync marco* resources from MARCO-INVENTORY to data model infrastructure layer.

This script reads the MARCO-INVENTORY markdown file and populates the
/model/infrastructure/ layer with all 24 resources from EsDAICoE-Sandbox.

Usage:
  python sync-marco-inventory-to-model.py [--dry-run] [--model-url URL]

Environment:
  EVA_MODEL_URL: override for data model endpoint (default: ACA)
  EVA_ACTOR: identity stamp for modifications (default: "agent:copilot")
"""
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Optional

try:
    import requests
except ImportError:
    print("ERROR: requests not installed (pip install requests)")
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

MODEL_URL = os.getenv("EVA_MODEL_URL", "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io")
ACTOR = os.getenv("EVA_ACTOR", "agent:copilot")
DRY_RUN = "--dry-run" in sys.argv
INVENTORY_FILE = Path(__file__).parent.parent.parent / "system-analysis" / "inventory" / ".eva-cache" / "current" / "MARCO-INVENTORY-20260213-155026.md"

# Service assignments: resource name → service(s)
SERVICE_MAP = {
    "marco-sandbox-openai": "eva-brain-api",
    "marco-sandbox-openai-v2": "eva-brain-api",
    "marco-sandbox-foundry": "foundry-agent-fleet",
    "marco-sandbox-aisvc": "eva-brain-api",
    "marco-sandbox-docint": "document-intelligence-service",
    "marco-sandbox-apim": "api-gateway",
    "marco-eva-data-model": "eva-data-model",
    "marcoeva.azurecr.io": "container-registry",
    "esdaicoesandboxst": "blob-storage",
    "marcosandboxfinopshub": "finops-hub",
    "marco-sandbox-appinsights": "observability",
    "marco-sandbox-appinsights-kvdb": "observability",
    "marco-sandbox-keyvault": "secrets-management",
    "marco-sandbox-policy": "governance",
    "marco-sandbox-msi": "workload-identity",
    "marco-sandbox-adf": "data-factory",
    "marco-sandbox-eventgrid": "event-routing",
    "marco-eva-faces-app": "eva-faces",
    "marco-eva-brain-v2-app": "eva-brain-v2",
    "marco-eva-ops-api": "eva-ops",
    "marco-sandbox-foundry-app": "foundry-hosting",
}

# Purpose/description mapping
PURPOSE_MAP = {
    "marco-sandbox-openai": "Azure OpenAI (GPT, embeddings)",
    "marco-sandbox-openai-v2": "Secondary OpenAI deployment (fallback/load balancing)",
    "marco-sandbox-foundry": "Microsoft Foundry (formerly Azure AI Foundry) hosted models",
    "marco-sandbox-aisvc": "General AI services (fallback)",
    "marco-sandbox-docint": "Document Intelligence OCR (extract data from PDFs, images)",
    "marco-sandbox-apim": "External API gateway (throttling, auth, cost headers)",
    "marco-eva-data-model": "Data model HTTP API (24x7 production, Cosmos-backed)",
    "marcoeva.azurecr.io": "Docker images for EVA services",
    "esdaicoesandboxst": "General blob storage (logs, artifacts)",
    "marcosandboxfinopshub": "FinOps hub (cost data, reservations, discounts)",
    "marco-sandbox-appinsights": "APM + distributed tracing for Web apps",
    "marco-sandbox-keyvault": "Secrets: COSMOS_KEY, APIM_KEY, PAT tokens",
    "marco-sandbox-adf": "ETL pipelines for corpus refresh, compliance audits",
    "marco-eva-faces-app": "EVA Faces frontend (React, Fluent UI)",
    "marco-eva-brain-v2-app": "EVA Brain backend (FastAPI)",
}

# Type mapping: Microsoft.X/Y → infrastructure type
TYPE_MAP = {
    "Microsoft.CognitiveServices/accounts": "ai_service_account",
    "Microsoft.CognitiveServices/accounts/projects": "ai_project",
    "Microsoft.Web/serverFarms": "app_service_plan",
    "Microsoft.Web/sites": "app_service",
    "Microsoft.EventGrid/systemTopics": "event_grid",
    "Microsoft.Insights/components": "application_insights",
    "Microsoft.Storage/storageAccounts": "blob_storage",
    "Microsoft.ApiManagement/service": "api_management",
    "Microsoft.ContainerRegistry/registries": "container_registry",
    "Microsoft.DataFactory/factories": "data_factory",
    "Microsoft.DocumentDB/databaseAccounts": "cosmos_db",
    "Microsoft.KeyVault/vaults": "key_vault",
    "Microsoft.Search/searchServices": "ai_search",
}


# ─────────────────────────────────────────────────────────────────────────────
# Parsing
# ─────────────────────────────────────────────────────────────────────────────

def parse_inventory(path: Path) -> dict[str, dict[str, Any]]:
    """
    Parse MARCO-INVENTORY markdown and extract resource table.
    
    Returns dict of {resource_name: {fields}}
    """
    if not path.exists():
        raise FileNotFoundError(f"Inventory not found: {path}")
    
    content = path.read_text(encoding="utf-8")
    
    # Find "Complete Marco Resources List" table
    section_start = content.find("## Complete Marco Resources List")
    if section_start == -1:
        raise ValueError("Could not find 'Complete Marco Resources List' section")
    
    # Extract table (lines between ## and next ## or EOF)
    section_end = content.find("\n## ", section_start + 1)
    if section_end == -1:
        section_end = len(content)
    
    section = content[section_start:section_end]
    
    # Parse table
    lines = section.split("\n")
    resources = {}
    in_table = False
    
    for line in lines:
        # Skip header separator and empty lines
        if line.startswith("|---") or not line.strip() or line.startswith("## "):
            in_table = line.startswith("|---")
            continue
        
        if not line.startswith("|"):
            continue
        
        # Parse table row
        parts = [p.strip() for p in line.split("|")[1:-1]]
        if len(parts) < 5:
            continue
        
        name = parts[0]
        res_type = parts[1]
        resource_group = parts[2]
        location = parts[3]
        tags_str = parts[4] if len(parts) > 4 else ""
        
        # Skip header row
        if name.lower() == "name":
            in_table = True
            continue
        
        if in_table and name and res_type:
            resources[name] = {
                "name": name,
                "type": res_type,
                "resource_group": resource_group,
                "location": location,
                "tags": tags_str,
            }
    
    return resources


# ─────────────────────────────────────────────────────────────────────────────
# Transform
# ─────────────────────────────────────────────────────────────────────────────

def transform_resource(name: str, raw: dict[str, Any]) -> dict[str, Any]:
    """
    Transform raw inventory entry to infrastructure layer object.
    """
    res_type = TYPE_MAP.get(raw["type"], "unknown_resource")
    service = SERVICE_MAP.get(name, "unassigned")
    purpose = PURPOSE_MAP.get(name, f"{name} resource")
    
    return {
        "id": name,
        "type": res_type,
        "azure_resource_name": name,
        "service": service,
        "resource_group": raw["resource_group"],
        "location": raw["location"],
        "status": "provisioned",
        "notes": purpose,
        "provision_order": 100,
        "is_active": True,
    }


# ─────────────────────────────────────────────────────────────────────────────
# API Operations
# ─────────────────────────────────────────────────────────────────────────────

def put_resource(resource: dict[str, Any]) -> bool:
    """
    PUT a resource to /model/infrastructure/{id}.
    
    Returns True if successful, False otherwise.
    """
    url = f"{MODEL_URL}/model/infrastructure/{resource['id']}"
    headers = {
        "Content-Type": "application/json",
        "X-Actor": ACTOR,
    }
    
    if DRY_RUN:
        print(f"[DRY-RUN] PUT {url}")
        print(f"         Body: {json.dumps(resource, indent=2)}")
        return True
    
    try:
        resp = requests.put(url, json=resource, headers=headers, timeout=10)
        if resp.status_code in (200, 201):
            print(f"[OK] {resource['id']}: {resp.status_code}")
            return True
        else:
            print(f"[FAIL] {resource['id']}: {resp.status_code}")
            print(f"       Response: {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"[ERROR] {resource['id']}: {e}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print(f"[INFO] EVA Sync: Marco* Inventory -> Infrastructure Layer")
    print(f"[INFO] Model URL: {MODEL_URL}")
    print(f"[INFO] Actor: {ACTOR}")
    print(f"[INFO] Dry-run: {DRY_RUN}")
    print()
    
    # Parse
    print(f"[INFO] Parsing: {INVENTORY_FILE}")
    try:
        raw_resources = parse_inventory(INVENTORY_FILE)
        print(f"[OK] Found {len(raw_resources)} resources")
    except Exception as e:
        print(f"[FAIL] {e}")
        return 1
    
    # Transform
    print(f"[INFO] Transforming to infrastructure schema...")
    transformed = {}
    for name, raw in raw_resources.items():
        transformed[name] = transform_resource(name, raw)
    print(f"[OK] {len(transformed)} resources ready")
    
    # Upload
    print(f"[INFO] Uploading to data model...")
    success_count = 0
    fail_count = 0
    
    for name in sorted(transformed.keys()):
        resource = transformed[name]
        if put_resource(resource):
            success_count += 1
        else:
            fail_count += 1
    
    print()
    print(f"[SUMMARY] Success: {success_count}, Failed: {fail_count}")
    
    if fail_count == 0:
        print(f"[OK] All {success_count} resources synced successfully")
        return 0
    else:
        print(f"[WARN] {fail_count} resources failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())

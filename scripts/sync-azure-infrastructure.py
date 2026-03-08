#!/usr/bin/env python3
"""
Sync Azure infrastructure resources to L42 (azure_infrastructure layer).

Queries Azure Resource Graph for all resources in MarcoSub subscription and
populates the data model with current infrastructure inventory.

Usage:
  python sync-azure-infrastructure.py [--dry-run] [--subscription-id ID]

Environment:
  AZURE_SUBSCRIPTION_ID: Override default subscription
  DATA_MODEL_URL: Override data model endpoint
  X_ACTOR: Identity stamp for modifications (default: "agent:infrastructure-sync")

Requirements:
  - Azure CLI authenticated (az login)
  - Python 3.10+
  - requests library (pip install requests)

Author: EVA Foundation (Session 39)
Date: 2026-03-08
"""

import json
import os
import subprocess
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

SUBSCRIPTION_ID = os.getenv("AZURE_SUBSCRIPTION_ID", "c59ee575-eb2a-4b51-a865-4b618f9add0a")
DATA_MODEL_URL = os.getenv("DATA_MODEL_URL", "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io")
X_ACTOR = os.getenv("X_ACTOR", "agent:infrastructure-sync")
DRY_RUN = "--dry-run" in sys.argv

# Override subscription if provided via CLI
if "--subscription-id" in sys.argv:
    idx = sys.argv.index("--subscription-id")
    if idx + 1 < len(sys.argv):
        SUBSCRIPTION_ID = sys.argv[idx + 1]

# Azure Resource Graph Query (KQL)
RESOURCE_QUERY = f"""
Resources
| where subscriptionId == '{SUBSCRIPTION_ID}'
| where type !~ 'microsoft.alertsmanagement/smartDetectorAlertRules'
| where type !~ 'microsoft.insights/actiongroups'
| project 
    id,
    name,
    type,
    location,
    resourceGroup,
    tags,
    sku,
    properties,
    kind,
    identity
| order by name asc
"""


# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

def log(message: str, level: str = "INFO") -> None:
    """Print log message with timestamp and level."""
    colors = {
        "INFO": "\033[96m",     # Cyan
        "SUCCESS": "\033[92m",  # Green
        "WARNING": "\033[93m",  # Yellow
        "ERROR": "\033[91m",    # Red
    }
    reset = "\033[0m"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    color = colors.get(level, "")
    print(f"{color}[{timestamp}] [{level}] {message}{reset}")


def query_azure_resource_graph() -> List[Dict[str, Any]]:
    """Query Azure Resource Graph for all resources in subscription."""
    log(f"Querying Azure Resource Graph for subscription {SUBSCRIPTION_ID}...")
    
    # Determine Azure CLI command (Windows uses az.cmd)
    az_cmd = "az.cmd" if sys.platform == "win32" else "az"
    
    try:
        # Use Azure CLI to query Resource Graph
        result = subprocess.run(
            [az_cmd, "graph", "query", "-q", RESOURCE_QUERY, "--query", "data", "-o", "json"],
            capture_output=True,
            text=True,
            check=True,
            timeout=60
        )
        
        resources = json.loads(result.stdout)
        log(f"✓ Retrieved {len(resources)} resources from Azure", "SUCCESS")
        return resources
        
    except subprocess.CalledProcessError as e:
        log(f"✗ Azure Resource Graph query failed: {e.stderr}", "ERROR")
        sys.exit(1)
    except subprocess.TimeoutExpired:
        log("✗ Azure Resource Graph query timed out (60s)", "ERROR")
        sys.exit(1)
    except json.JSONDecodeError as e:
        log(f"✗ Failed to parse Azure response: {e}", "ERROR")
        sys.exit(1)


def transform_to_l42_schema(resource: Dict[str, Any]) -> Dict[str, Any]:
    """Transform Azure resource to L42 schema format."""
    
    # Extract resource ID components
    resource_id = resource.get("id", "")
    resource_name = resource.get("name", "unknown")
    resource_type = resource.get("type", "unknown")
    
    # Parse properties for security and cost tracking
    # Ensure properties is always a dict (some resources return None)
    properties = resource.get("properties") or {}
    tags = resource.get("tags") or {}
    sku = resource.get("sku") or {}
    
    # Build security configuration
    security_config = {
        "public_network_access": properties.get("publicNetworkAccess", "unknown"),
        "encryption_enabled": True if "encryption" in str(properties).lower() else False,
        "rbac_enabled": True if "identity" in resource else False,
        "network_rules": properties.get("networkRuleSet", {}),
        "firewall_rules": properties.get("firewallRules", [])
    }
    
    # Build cost tracking
    cost_tracking = {
        "cost_center": tags.get("CostCenter", tags.get("cost-center", "unknown")),
        "environment": tags.get("Environment", tags.get("environment", "unknown")),
        "owner": tags.get("Owner", tags.get("owner", "unknown")),
        "sku_name": sku.get("name", "unknown") if sku else "unknown",
        "sku_tier": sku.get("tier", "unknown") if sku else "unknown"
    }
    
    # Determine status from provisioning state
    provisioning_state = properties.get("provisioningState", "unknown")
    status_map = {
        "Succeeded": "running",
        "Failed": "failed",
        "Canceled": "stopped",
        "Deleting": "deleting"
    }
    status = status_map.get(provisioning_state, "unknown")
    
    # Build L42 record
    l42_record = {
        "id": f"azure-{resource_name}",
        "subscription_id": SUBSCRIPTION_ID,
        "resource_id": resource_id,
        "resource_name": resource_name,
        "resource_type": resource_type,
        "resource_group": resource.get("resourceGroup", "unknown"),
        "location": resource.get("location", "unknown"),
        "status": status,
        "configuration": {
            "properties": properties,
            "sku": sku,
            "kind": resource.get("kind"),
            "tags": tags
        },
        "security_config": security_config,
        "cost_tracking": cost_tracking,
        "last_synced": datetime.now().isoformat(),
        "sync_agent": X_ACTOR
    }
    
    return l42_record


def put_to_data_model(record: Dict[str, Any]) -> bool:
    """PUT resource record to data model L42 layer."""
    url = f"{DATA_MODEL_URL}/model/azure_infrastructure/{record['id']}"
    headers = {
        "Content-Type": "application/json",
        "X-Actor": X_ACTOR
    }
    
    if DRY_RUN:
        log(f"[DRY-RUN] Would PUT to {url}", "INFO")
        log(f"[DRY-RUN] Payload: {json.dumps(record, indent=2)[:200]}...", "INFO")
        return True
    
    try:
        response = requests.put(url, json=record, headers=headers, timeout=10)
        
        if response.status_code in [200, 201]:
            log(f"✓ {record['resource_name']} synced", "SUCCESS")
            return True
        else:
            log(f"✗ {record['resource_name']} failed: {response.status_code} {response.text[:100]}", "ERROR")
            return False
            
    except requests.exceptions.RequestException as e:
        log(f"✗ {record['resource_name']} error: {e}", "ERROR")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# Main Execution
# ─────────────────────────────────────────────────────────────────────────────

def main():
    """Main execution flow."""
    
    print("\n" + "="*80)
    print("  EVA INFRASTRUCTURE SYNC - Azure Resource Graph to L42")
    print("="*80 + "\n")
    
    log(f"Configuration:")
    log(f"  Subscription: {SUBSCRIPTION_ID}")
    log(f"  Data Model: {DATA_MODEL_URL}")
    log(f"  Actor: {X_ACTOR}")
    log(f"  Dry Run: {DRY_RUN}")
    print()
    
    # Step 1: Query Azure Resource Graph
    resources = query_azure_resource_graph()
    
    if not resources:
        log("No resources found. Exiting.", "WARNING")
        return 0
    
    # Step 2: Transform and upload
    log(f"\nTransforming and uploading {len(resources)} resources...")
    
    success_count = 0
    failed_count = 0
    
    for idx, resource in enumerate(resources, 1):
        resource_name = resource.get("name", "unknown")
        log(f"[{idx}/{len(resources)}] Processing {resource_name}...")
        
        try:
            # Transform to L42 schema
            l42_record = transform_to_l42_schema(resource)
            
            # PUT to data model
            if put_to_data_model(l42_record):
                success_count += 1
            else:
                failed_count += 1
                
        except Exception as e:
            log(f"✗ Failed to process {resource_name}: {e}", "ERROR")
            failed_count += 1
    
    # Summary
    print("\n" + "="*80)
    log(f"SYNC COMPLETE", "SUCCESS")
    log(f"  Total: {len(resources)}")
    log(f"  Success: {success_count}")
    log(f"  Failed: {failed_count}")
    print("="*80 + "\n")
    
    return 0 if failed_count == 0 else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log("\nSync interrupted by user", "WARNING")
        sys.exit(130)

#!/usr/bin/env python3
"""
Count records in Cosmos DB via msub API (Evidence 2: Actual Records)

Purpose: Query Cosmos DB after seeding to count actual records present.
         Uses layer list from Evidence 1 to know which layers to query.

Input:  evidence/01-expected-records.json (layer list)
Output: evidence/{script}_{timestamp}.json with layer -> count mapping

Exit Codes:
  0 = Success
  1 = Query errors encountered
  2 = Evidence 1 not found or API unreachable or technical error
"""
import json
import sys
import requests
from pathlib import Path
from datetime import datetime

# EVA Script Infrastructure (Professional Coding Standards)
from eva_script_infra import (
    setup_logging,
    save_evidence,
    save_error_evidence,
    ensure_directories,
    timestamped_filename,
    check_file_exists,
    check_api_reachable,
    STATUS_PASS,
    STATUS_FAIL,
    STATUS_INFO,
    STATUS_ERROR,
    format_status
)


API_BASE = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"


def count_cosmos_layer(layer_name: str, logger) -> dict:
    """
    Query a single layer from Cosmos DB and count records.
    
    Returns:
        dict with keys: success (bool), count (int), error (str|None)
    """
    url = f"{API_BASE}/model/{layer_name}/"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Count records in response
        if 'data' in data and isinstance(data['data'], list):
            count = len(data['data'])
        elif isinstance(data, list):
            count = len(data)
        else:
            count = 0
        
        return {
            "success": True,
            "count": count,
            "status_code": response.status_code,
            "error": None
        }
    
    except requests.HTTPError as e:
        return {
            "success": False,
            "count": -1,
            "status_code": e.response.status_code if e.response else None,
            "error": f"HTTP {e.response.status_code}" if e.response else str(e)
        }
    except requests.RequestException as e:
        return {
            "success": False,
            "count": -1,
            "status_code": None,
            "error": str(e)
        }


def main():
    # Setup logging (Standard #1: Logging with dual handlers)
    logger = setup_logging('count-cosmos-records')
    
    # Ensure directories exist (Standard #1: logs/, evidence/, debug/)
    ensure_directories()
    
    # Save evidence at start (Standard #3: Evidence at operation boundaries)
    operation_name = 'count-cosmos-records'
    save_evidence(
        operation=operation_name,
        status='started',
        metrics={},
        script_name='count-cosmos-records'
    )
    logger.info(format_status(STATUS_INFO, "Operation started"))
    
    try:
        evidence_dir = Path('evidence')
        expected_file = evidence_dir / "01-expected-records.json"
        
        # Pre-flight check (Standard #6: Verify inputs before execution)
        if not check_file_exists(expected_file, 'Evidence 1', logger):
            logger.error(format_status(STATUS_ERROR, "Run count-source-records.py first"))
            save_evidence(
                operation=operation_name,
                status='failed',
                metrics={'error': 'Evidence 1 not found'},
                script_name='count-cosmos-records'
            )
            sys.exit(2)
        
        with open(expected_file, 'r', encoding='utf-8') as f:
            expected = json.load(f)
        
        layers = list(expected['layer_counts'].keys())
        
        # Pre-flight check: API reachability (Standard #6)
        logger.info(format_status(STATUS_INFO, "Testing API connectivity..."))
        health_url = f"{API_BASE}/health"
        if not check_api_reachable(health_url, logger, timeout=5):
            logger.error(format_status(STATUS_ERROR, "API unreachable, verify container is deployed and healthy"))
            save_evidence(
                operation=operation_name,
                status='failed',
                metrics={'error': 'API unreachable', 'api_base': API_BASE},
                script_name='count-cosmos-records'
            )
            sys.exit(2)
        
        logger.info(format_status(STATUS_INFO, f"API: {API_BASE}"))
        logger.info(format_status(STATUS_INFO, f"Counting records in Cosmos DB for {len(layers)} layers"))
        
        actual_counts = {}
        total_records = 0
        errors = []
        
        # Query each layer
        for i, layer in enumerate(layers, 1):
            pct = int((i / len(layers)) * 100)
            logger.info(f"  [{pct:3d}%] {layer}...")
            
            result = count_cosmos_layer(layer, logger)
            
            if result['success']:
                count = result['count']
                actual_counts[layer] = count
                total_records += count
                logger.info(f"    {count} records")
            else:
                actual_counts[layer] = -1
                errors.append({
                    "layer": layer,
                    "error": result['error'],
                    "status_code": result['status_code']
                })
                logger.error(f"    {STATUS_ERROR} {result['error']}")
        
        # Create Evidence 2 with timestamped filename (Standard #5)
        evidence = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": f"{API_BASE}/model/",
            "layer_counts": actual_counts,
            "total_layers": len(actual_counts),
            "total_records": total_records,
            "errors": errors,
            "error_count": len(errors)
        }
        
        # Use timestamped filename for output (Standard #5)
        output_filename = timestamped_filename('count-cosmos-records', 'actual', 'json')
        output_file = evidence_dir / output_filename
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(evidence, f, indent=2)
        
        # Also write legacy filename for backwards compatibility
        legacy_file = evidence_dir / "02-actual-records.json"
        with open(legacy_file, 'w', encoding='utf-8') as f:
            json.dump(evidence, f, indent=2)
        
        logger.info(format_status(STATUS_INFO, f"Evidence saved: {output_file}"))
        logger.info(format_status(STATUS_INFO, f"Legacy evidence: {legacy_file}"))
        logger.info(format_status(STATUS_PASS, f"Total: {total_records} records across {len(actual_counts)} layers"))
        
        # Save success evidence (Standard #3: Evidence at success boundary)
        save_evidence(
            operation=operation_name,
            status='success',
            metrics={
                'total_layers': len(actual_counts),
                'total_records': total_records,
                'query_errors': len(errors),
                'output_file': str(output_file)
            },
            script_name='count-cosmos-records'
        )
        
        # Exit with appropriate code (Standard #4: Exit codes)
        if errors:
            logger.warning(format_status(STATUS_FAIL, f"{len(errors)} layers failed to query"))
            sys.exit(1)
        else:
            logger.info(format_status(STATUS_PASS, "Operation completed successfully"))
            sys.exit(0)
    
    except Exception as e:
        # Error handling (Standard #8: Catch exceptions, save structured JSON)
        logger.error(format_status(STATUS_ERROR, f"Unexpected error: {e}"))
        save_error_evidence(e, operation_name, script_name='count-cosmos-records')
        save_evidence(
            operation=operation_name,
            status='failed',
            metrics={'error': str(e), 'error_type': type(e).__name__},
            script_name='count-cosmos-records'
        )
        sys.exit(2)


if __name__ == '__main__':
    main()

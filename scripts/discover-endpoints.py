#!/usr/bin/env python3
"""
Discover and test all API endpoints from OpenAPI spec.

Purpose: Create comprehensive endpoint inventory with response examples.
         Used for before/after deployment comparison.

Usage:
    python scripts/discover-endpoints.py
    python scripts/discover-endpoints.py --local           # Test localhost:8010
    python scripts/discover-endpoints.py --url <custom>    # Custom URL

Output:
    evidence/endpoint-discovery_{stage}_{timestamp}.json
    logs/discover-endpoints_run_{timestamp}.log

Evidence Structure:
    {
        "timestamp": "2026-03-10T21:30:00Z",
        "api_url": "https://...",
        "endpoints_discovered": 42,
        "endpoints_tested": 38,
        "endpoints": [
            {
                "path": "/model/projects",
                "method": "GET",
                "status": "success",
                "response_code": 200,
                "response_time_ms": 123,
                "response_size_bytes": 4567,
                "response_sample": {...},  # First 10 records
                "error": null
            }
        ]
    }
"""
import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

try:
    import requests
except ImportError:
    print("[ERROR] requests library not installed. Run: pip install requests")
    sys.exit(1)

# EVA Script Infrastructure (Professional Coding Standards)
from eva_script_infra import (
    setup_logging,
    save_evidence,
    ensure_directories,
    timestamped_filename,
    STATUS_PASS,
    STATUS_FAIL,
    STATUS_INFO,
    STATUS_ERROR,
    format_status
)


def discover_endpoints_from_openapi(api_url: str, logger: logging.Logger) -> List[Dict[str, Any]]:
    """
    Fetch OpenAPI spec and extract all endpoints.
    
    Returns:
        List of endpoint definitions with path, method, summary
    """
    try:
        logger.info(format_status(STATUS_INFO, f"Fetching OpenAPI spec from {api_url}/openapi.json"))
        response = requests.get(f"{api_url}/openapi.json", timeout=30)
        response.raise_for_status()
        
        spec = response.json()
        endpoints = []
        
        # Parse OpenAPI paths
        paths = spec.get("paths", {})
        logger.info(f"Found {len(paths)} path definitions in OpenAPI spec")
        
        for path, methods in paths.items():
            for method, details in methods.items():
                if method.upper() in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
                    endpoints.append({
                        "path": path,
                        "method": method.upper(),
                        "summary": details.get("summary", ""),
                        "tags": details.get("tags", []),
                        "operationId": details.get("operationId", ""),
                        "parameters": details.get("parameters", [])
                    })
        
        logger.info(format_status(STATUS_PASS, f"Discovered {len(endpoints)} endpoints"))
        return endpoints
        
    except Exception as e:
        logger.error(format_status(STATUS_ERROR, f"Failed to fetch OpenAPI spec: {e}"))
        return []


def test_endpoint(api_url: str, endpoint: Dict[str, Any], logger: logging.Logger) -> Dict[str, Any]:
    """
    Test a single endpoint and capture response details.
    
    Args:
        api_url: Base API URL
        endpoint: Endpoint definition from OpenAPI
        logger: Logger instance
    
    Returns:
        Test result with response details
    """
    path = endpoint["path"]
    method = endpoint["method"]
    
    # Skip endpoints requiring auth or path parameters for now
    if "{" in path:
        logger.debug(f"Skipping {method} {path} (requires path parameters)")
        return {
            "path": path,
            "method": method,
            "status": "skipped",
            "reason": "requires_parameters",
            "response_code": None,
            "response_time_ms": None,
            "response_size_bytes": None,
            "response_sample": None,
            "error": None
        }
    
    # Skip POST/PUT/DELETE for read-only discovery
    if method in ["POST", "PUT", "DELETE", "PATCH"]:
        logger.debug(f"Skipping {method} {path} (write operation)")
        return {
            "path": path,
            "method": method,
            "status": "skipped",
            "reason": "write_operation",
            "response_code": None,
            "response_time_ms": None,
            "response_size_bytes": None,
            "response_sample": None,
            "error": None
        }
    
    # Test GET endpoints
    try:
        url = f"{api_url}{path}"
        logger.debug(f"Testing: {method} {path}")
        
        start_time = time.time()
        response = requests.get(url, timeout=30)
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        # Get response content
        try:
            response_json = response.json()
            response_size = len(response.content)
            
            # Sample response (first 10 items if array, full if small object)
            if isinstance(response_json, list):
                sample = response_json[:10]
            elif isinstance(response_json, dict):
                # Limit large dict responses
                if len(json.dumps(response_json)) > 10000:
                    sample = {k: v for k, v in list(response_json.items())[:10]}
                else:
                    sample = response_json
            else:
                sample = response_json
        except Exception as e:
            response_json = None
            response_size = len(response.content) if response.content else 0
            sample = response.text[:500] if response.text else None
        
        # Determine success
        is_success = 200 <= response.status_code < 300
        status = "success" if is_success else "failed"
        
        result = {
            "path": path,
            "method": method,
            "status": status,
            "response_code": response.status_code,
            "response_time_ms": elapsed_ms,
            "response_size_bytes": response_size,
            "response_sample": sample,
            "error": None if is_success else f"HTTP {response.status_code}"
        }
        
        # Log to file (verbose)
        logger.info(format_status(
            STATUS_PASS if is_success else STATUS_FAIL,
            f"{method} {path} -> {response.status_code} ({elapsed_ms}ms, {response_size}b)"
        ))
        
        # Console output only for failures
        if not is_success:
            print(f"  [FAIL] {method} {path} -> {response.status_code}")
        
        return result
        
    except Exception as e:
        logger.error(format_status(STATUS_ERROR, f"{method} {path} -> {e}"))
        print(f"  [ERROR] {method} {path} -> {e}")
        return {
            "path": path,
            "method": method,
            "status": "error",
            "response_code": None,
            "response_time_ms": None,
            "response_size_bytes": None,
            "response_sample": None,
            "error": str(e)
        }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Discover and test API endpoints with evidence capture"
    )
    parser.add_argument(
        "--local",
        action="store_true",
        help="Use local API (http://localhost:8010)"
    )
    parser.add_argument(
        "--url",
        type=str,
        help="Custom API URL"
    )
    parser.add_argument(
        "--stage",
        type=str,
        default="before",
        choices=["before", "after"],
        help="Deployment stage (before/after)"
    )
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging('discover-endpoints')
    ensure_directories()
    
    # Determine API URL
    if args.url:
        api_url = args.url.rstrip('/')
        source = f"Custom ({api_url})"
    elif args.local:
        api_url = "http://localhost:8010"
        source = "Local API"
    else:
        api_url = os.getenv(
            "DATA_MODEL_API_URL",
            "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
        )
        source = "Production API"
    
    logger.info("=" * 70)
    logger.info(" ENDPOINT DISCOVERY & TESTING")
    logger.info("=" * 70)
    logger.info(f"API URL: {api_url}")
    logger.info(f"Source: {source}")
    logger.info(f"Stage: {args.stage}")
    logger.info("")
    
    # Save start evidence
    save_evidence(
        operation='discover-endpoints',
        status='started',
        metrics={'api_url': api_url, 'stage': args.stage},
        script_name='discover-endpoints'
    )
    
    try:
        # Step 1: Discover endpoints from OpenAPI
        logger.info("[1/3] Discovering endpoints from OpenAPI spec...")
        endpoints = discover_endpoints_from_openapi(api_url, logger)
        
        if not endpoints:
            logger.error(format_status(STATUS_ERROR, "No endpoints discovered"))
            save_evidence(
                operation='discover-endpoints',
                status='failed',
                metrics={'error': 'No endpoints discovered'},
                script_name='discover-endpoints'
            )
            sys.exit(1)
        
        # Step 2: Test each endpoint
        logger.info(f"\n[2/3] Testing {len(endpoints)} endpoints...")
        print(f"[INFO] Testing {len(endpoints)} endpoints", end="", flush=True)
        results = []
        success_count = 0
        failed_count = 0
        skipped_count = 0
        error_count = 0
        
        for i, endpoint in enumerate(endpoints, 1):
            # Log to file only (verbose)
            logger.debug(f"[{i}/{len(endpoints)}] {endpoint['method']} {endpoint['path']}")
            
            # Console: print dot every 10 endpoints
            if i % 10 == 0:
                print(".", end="", flush=True)
            
            result = test_endpoint(api_url, endpoint, logger)
            results.append(result)
            
            if result["status"] == "success":
                success_count += 1
            elif result["status"] == "failed":
                failed_count += 1
            elif result["status"] == "skipped":
                skipped_count += 1
            elif result["status"] == "error":
                error_count += 1
            
            # Small delay to avoid overwhelming the API
            time.sleep(0.1)
        
        # Console: complete the dots line
        print(" done")
        
        # Step 3: Save evidence
        logger.info(f"\n[3/3] Saving evidence...")
        
        evidence = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "api_url": api_url,
            "stage": args.stage,
            "endpoints_discovered": len(endpoints),
            "endpoints_tested": success_count + failed_count + error_count,
            "endpoints_skipped": skipped_count,
            "success_count": success_count,
            "failed_count": failed_count,
            "error_count": error_count,
            "endpoints": results
        }
        
        # Save to evidence file
        evidence_file = Path("evidence") / f"endpoint-discovery_{args.stage}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(evidence_file, 'w', encoding='utf-8') as f:
            json.dump(evidence, f, indent=2, ensure_ascii=True)
        
        logger.info("=" * 70)
        logger.info(" SUMMARY")
        logger.info("=" * 70)
        logger.info(f"Total endpoints discovered: {len(endpoints)}")
        logger.info(f"Tested successfully: {success_count}")
        logger.info(f"Failed: {failed_count}")
        logger.info(f"Errors: {error_count}")
        logger.info(f"Skipped: {skipped_count}")
        logger.info(f"\nEvidence saved: {evidence_file}")
        logger.info("")
        
        # Save success evidence
        save_evidence(
            operation='discover-endpoints',
            status='success',
            metrics={
                'total': len(endpoints),
                'tested': success_count + failed_count + error_count,
                'success': success_count,
                'failed': failed_count,
                'error': error_count,
                'skipped': skipped_count
            },
            script_name='discover-endpoints'
        )
        
        logger.info(format_status(STATUS_PASS, "Endpoint discovery complete"))
        sys.exit(0)
        
    except Exception as e:
        logger.error(format_status(STATUS_ERROR, f"Fatal error: {e}"))
        import traceback
        logger.error(traceback.format_exc())
        
        save_evidence(
            operation='discover-endpoints',
            status='error',
            metrics={'error': str(e)},
            script_name='discover-endpoints'
        )
        
        sys.exit(2)


if __name__ == "__main__":
    main()

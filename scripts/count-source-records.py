#!/usr/bin/env python3
"""
Count records in model/*.json files (Evidence 1: Expected Records)

Purpose: Establish ground truth by counting records in source JSON files
         before seeding Cosmos DB.

Output: evidence/{script}_{timestamp}.json with layer -> count mapping

Exit Codes:
  0 = Success
  1 = Error reading files
  2 = Technical error (directory not found, exception)
"""
import json
import sys
from pathlib import Path
from datetime import datetime

# EVA Script Infrastructure (Professional Coding Standards)
from eva_script_infra import (
    setup_logging,
    save_evidence,
    save_error_evidence,
    ensure_directories,
    timestamped_filename,
    check_directory_exists,
    STATUS_PASS,
    STATUS_FAIL,
    STATUS_INFO,
    STATUS_ERROR,
    format_status
)


def count_records_in_file(file_path: Path, logger) -> int:
    """
    Count records in a JSON file.
    
    Handles multiple JSON structures:
    - Direct array: [...]
    - Object with data array: {"layer": [...]}
    - Object with named array: {"projects": [...]}
    - Single object: {...} (counts as 1)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Case 1: Direct array
        if isinstance(data, list):
            return len(data)
        
        # Case 2: Dictionary
        elif isinstance(data, dict):
            # Check for 'data' key
            if 'data' in data and isinstance(data['data'], list):
                return len(data['data'])
            
            # Check for layer name key (e.g., {"projects": [...]})
            # Get first key that contains a list
            for key, value in data.items():
                if isinstance(value, list):
                    return len(value)
            
            # Single object - count as 1 record
            return 1
        
        else:
            return 0
    
    except json.JSONDecodeError as e:
        logger.error(f"{STATUS_ERROR} parsing {file_path.name}: {e}")
        return -1
    except Exception as e:
        logger.error(f"{STATUS_ERROR} reading {file_path.name}: {e}")
        return -1


def main():
    # Setup logging (Standard #1: Logging with dual handlers)
    logger = setup_logging('count-source-records')
    
    # Ensure directories exist (Standard #1: logs/, evidence/, debug/)
    ensure_directories()
    
    # Save evidence at start (Standard #3: Evidence at operation boundaries)
    operation_name = 'count-source-records'
    save_evidence(
        operation=operation_name,
        status='started',
        metrics={},
        script_name='count-source-records'
    )
    logger.info(format_status(STATUS_INFO, "Operation started"))
    
    try:
        model_dir = Path('model')
        output_dir = Path('evidence')
        
        # Pre-flight check (Standard #6: Verify inputs before execution)
        if not check_directory_exists(model_dir, 'Source data (model/)', logger):
            logger.error(format_status(STATUS_ERROR, "Run this script from project root (37-data-model/)"))
            save_evidence(
                operation=operation_name,
                status='failed',
                metrics={'error': 'model/ directory not found'},
                script_name='count-source-records'
            )
            sys.exit(2)
        
        logger.info(format_status(STATUS_INFO, f"Counting records in source JSON files"))
        logger.info(format_status(STATUS_INFO, f"Source: {model_dir.absolute()}"))
        
        expected_counts = {}
        total_records = 0
        error_count = 0
        
        # Get all JSON files
        json_files = sorted(model_dir.glob('*.json'))
        
        if not json_files:
            logger.error(format_status(STATUS_ERROR, f"No JSON files found in {model_dir}"))
            save_evidence(
                operation=operation_name,
                status='failed',
                metrics={'error': 'No JSON files found', 'files_found': 0},
                script_name='count-source-records'
            )
            sys.exit(1)
        
        logger.info(format_status(STATUS_INFO, f"Found {len(json_files)} JSON files"))
        
        # Count records in each file
        for json_file in json_files:
            layer_name = json_file.stem
            count = count_records_in_file(json_file, logger)
            
            if count == -1:
                error_count += 1
                continue
            
            expected_counts[layer_name] = count
            total_records += count
            
            logger.info(f"  [{layer_name}] {count} records")
        
        if error_count > 0:
            logger.warning(format_status(STATUS_FAIL, f"{error_count} files failed to parse"))
        
        # Create evidence file with timestamped name (Standard #5: Timestamped files)
        evidence = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": str(model_dir.absolute()),
            "layer_counts": expected_counts,
            "total_layers": len(expected_counts),
            "total_records": total_records,
            "parse_errors": error_count
        }
        
        # Use timestamped filename for output (Standard #5)
        output_filename = timestamped_filename('count-source-records', 'expected', 'json')
        output_file = output_dir / output_filename
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(evidence, f, indent=2)
        
        # Also write legacy filename for backwards compatibility with deploy-hardened.yml
        legacy_file = output_dir / "01-expected-records.json"
        with open(legacy_file, 'w', encoding='utf-8') as f:
            json.dump(evidence, f, indent=2)
        
        logger.info(format_status(STATUS_INFO, f"Evidence saved: {output_file}"))
        logger.info(format_status(STATUS_INFO, f"Legacy evidence: {legacy_file}"))
        logger.info(format_status(STATUS_PASS, f"Total: {total_records} records across {len(expected_counts)} layers"))
        
        # Save success evidence (Standard #3: Evidence at success boundary)
        save_evidence(
            operation=operation_name,
            status='success',
            metrics={
                'total_layers': len(expected_counts),
                'total_records': total_records,
                'parse_errors': error_count,
                'output_file': str(output_file)
            },
            script_name='count-source-records'
        )
        
        # Exit with appropriate code (Standard #4: Exit codes)
        if error_count > 0:
            logger.warning(format_status(STATUS_FAIL, "Completed with errors"))
            sys.exit(1)
        else:
            logger.info(format_status(STATUS_PASS, "Operation completed successfully"))
            sys.exit(0)
    
    except Exception as e:
        # Error handling (Standard #8: Catch exceptions, save structured JSON)
        logger.error(format_status(STATUS_ERROR, f"Unexpected error: {e}"))
        save_error_evidence(e, operation_name, script_name='count-source-records')
        save_evidence(
            operation=operation_name,
            status='failed',
            metrics={'error': str(e), 'error_type': type(e).__name__},
            script_name='count-source-records'
        )
        sys.exit(2)


if __name__ == '__main__':
    main()

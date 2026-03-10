#!/usr/bin/env python3
"""
EVA Script Infrastructure Module

Shared infrastructure for Professional Coding Standards compliance.
Provides logging, evidence tracking, error handling, and file management.

Standards Implemented:
1. Logging: Dual handlers (console + file with timestamps)
2. Encoding: ASCII-only tokens ([PASS]/[FAIL]/[INFO]/[ERROR])
3. Evidence: JSON at start/success/error with operation metadata
4. Exit codes: Not enforced here (caller responsibility: 0/1/2)
5. Timestamped files: timestamped_filename() helper
6. Pre-flight checks: Helpers for validation
7. Dependencies: requirements.txt managed externally
8. Error handling: save_error_evidence() for exceptions

Usage:
    from eva_script_infra import setup_logging, save_evidence, ensure_directories
    
    logger = setup_logging('my-script')
    ensure_directories()
    
    save_evidence('my-operation', 'started', {})
    try:
        # ... work ...
        save_evidence('my-operation', 'success', {'records': 100})
        sys.exit(0)
    except Exception as e:
        save_error_evidence(e, 'my-operation')
        logger.error(f"[ERROR] Operation failed: {e}")
        sys.exit(2)
"""

import json
import logging
import sys
import traceback
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional


# Standard directories (relative to script execution context)
LOGS_DIR = Path('logs')
EVIDENCE_DIR = Path('evidence')
DEBUG_DIR = Path('debug')


def ensure_directories() -> None:
    """
    Create mandatory directories if they don't exist.
    
    Creates:
        - logs/
        - evidence/
        - debug/
    
    Called automatically by setup_logging(), but can be called explicitly.
    """
    LOGS_DIR.mkdir(exist_ok=True)
    EVIDENCE_DIR.mkdir(exist_ok=True)
    DEBUG_DIR.mkdir(exist_ok=True)


def timestamped_filename(component: str, context: str, extension: str) -> str:
    """
    Generate timestamped filename following standard pattern.
    
    Pattern: {component}_{context}_{YYYYMMDD_HHMMSS}.{ext}
    
    Benefits:
        - Prevents overwrites
        - Enables parallel runs
        - Chronological sorting
    
    Args:
        component: Component name (e.g., 'count-source', 'verify-deployment')
        context: Context/operation (e.g., 'run', 'evidence', 'error')
        extension: File extension without dot (e.g., 'json', 'log')
    
    Returns:
        Filename string like 'count-source_run_20260310_143022.log'
    
    Example:
        >>> timestamped_filename('my-script', 'evidence', 'json')
        'my-script_evidence_20260310_143022.json'
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f"{component}_{context}_{timestamp}.{extension}"


def setup_logging(script_name: str, level: int = logging.INFO) -> logging.Logger:
    """
    Setup Python logging with dual handlers (console + file).
    
    Creates:
        - Console handler: Outputs to stdout
        - File handler: Outputs to logs/{script_name}_{timestamp}.log
    
    Auto-creates logs/ directory.
    
    Args:
        script_name: Name of script (used for logger name and log filename)
        level: Logging level (default: logging.INFO)
    
    Returns:
        Configured logger instance
    
    Example:
        logger = setup_logging('count-source-records')
        logger.info("[INFO] Starting operation")
        logger.error("[ERROR] Something failed")
    """
    ensure_directories()
    
    # Generate timestamped log filename
    log_filename = timestamped_filename(script_name, 'run', 'log')
    log_path = LOGS_DIR / log_filename
    
    # Clear any existing handlers (prevents duplicate logs)
    logger = logging.getLogger(script_name)
    logger.handlers.clear()
    logger.setLevel(level)
    
    # Create formatters (ASCII-only)
    formatter = logging.Formatter(
        fmt='%(asctime)s [%(levelname)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler
    file_handler = logging.FileHandler(log_path, mode='w', encoding='utf-8')
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Log initialization
    logger.info(f"[INFO] Logging initialized: {log_path}")
    logger.info(f"[INFO] Script: {script_name}")
    
    return logger


def save_evidence(
    operation: str,
    status: str,
    metrics: Dict[str, Any],
    script_name: Optional[str] = None,
    **kwargs: Any
) -> Path:
    """
    Save operation evidence as timestamped JSON file.
    
    Evidence structure:
        {
            "timestamp": "2026-03-10T14:30:22.123456Z",
            "operation": "count-source-records",
            "status": "started" | "success" | "failed",
            "metrics": { ... },
            ...additional kwargs...
        }
    
    Args:
        operation: Operation name (e.g., 'count-source-records')
        status: Operation status ('started', 'success', 'failed')
        metrics: Dictionary of operation metrics (records counted, errors, etc.)
        script_name: Optional script name (defaults to operation)
        **kwargs: Additional fields to include in evidence JSON
    
    Returns:
        Path to saved evidence file
    
    Example:
        # At start
        save_evidence('count-source', 'started', {'input_dir': 'model/'})
        
        # At success
        save_evidence('count-source', 'success', {'records': 113, 'layers': 87})
        
        # At error
        save_evidence('count-source', 'failed', {'error': 'Directory not found'})
    """
    ensure_directories()
    
    component = script_name or operation
    filename = timestamped_filename(component, status, 'json')
    evidence_path = EVIDENCE_DIR / filename
    
    evidence = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'operation': operation,
        'status': status,
        'metrics': metrics,
        **kwargs
    }
    
    with open(evidence_path, 'w', encoding='utf-8') as f:
        json.dump(evidence, f, indent=2, ensure_ascii=True)
    
    return evidence_path


def save_error_evidence(
    error: Exception,
    operation: str,
    script_name: Optional[str] = None,
    **kwargs: Any
) -> Path:
    """
    Save exception details as structured JSON evidence.
    
    Captures:
        - Timestamp
        - Operation name
        - Error type (exception class name)
        - Error message
        - Stack trace
        - Additional context (kwargs)
    
    Args:
        error: Exception instance
        operation: Operation name that failed
        script_name: Optional script name (defaults to operation)
        **kwargs: Additional context to include
    
    Returns:
        Path to saved error evidence file
    
    Example:
        try:
            # ... operation ...
        except Exception as e:
            save_error_evidence(e, 'count-source-records', input_dir='model/')
            logger.error(f"[ERROR] Operation failed: {e}")
            sys.exit(2)
    """
    ensure_directories()
    
    component = script_name or operation
    filename = timestamped_filename(component, 'error', 'json')
    error_path = EVIDENCE_DIR / filename
    
    error_details = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'operation': operation,
        'error_type': type(error).__name__,
        'error_message': str(error),
        'stack_trace': traceback.format_exc(),
        **kwargs
    }
    
    with open(error_path, 'w', encoding='utf-8') as f:
        json.dump(error_details, f, indent=2, ensure_ascii=True)
    
    return error_path


def check_directory_exists(path: Path, name: str, logger: logging.Logger) -> bool:
    """
    Pre-flight check: Verify directory exists.
    
    Args:
        path: Directory path to check
        name: Human-readable name for error messages
        logger: Logger instance for error reporting
    
    Returns:
        True if exists, False otherwise (logs error)
    
    Example:
        if not check_directory_exists(Path('model'), 'source data', logger):
            sys.exit(2)
    """
    if not path.exists():
        logger.error(f"[ERROR] {name} directory not found: {path}")
        return False
    if not path.is_dir():
        logger.error(f"[ERROR] {name} is not a directory: {path}")
        return False
    return True


def check_file_exists(path: Path, name: str, logger: logging.Logger) -> bool:
    """
    Pre-flight check: Verify file exists.
    
    Args:
        path: File path to check
        name: Human-readable name for error messages
        logger: Logger instance for error reporting
    
    Returns:
        True if exists, False otherwise (logs error)
    
    Example:
        evidence_file = Path('evidence/01-expected-records.json')
        if not check_file_exists(evidence_file, 'Evidence 1', logger):
            sys.exit(2)
    """
    if not path.exists():
        logger.error(f"[ERROR] {name} file not found: {path}")
        return False
    if not path.is_file():
        logger.error(f"[ERROR] {name} is not a file: {path}")
        return False
    return True


def check_api_reachable(url: str, logger: logging.Logger, timeout: int = 5) -> bool:
    """
    Pre-flight check: Verify API is reachable.
    
    Args:
        url: API endpoint URL to test
        logger: Logger instance for error reporting
        timeout: Request timeout in seconds (default: 5)
    
    Returns:
        True if reachable, False otherwise (logs error)
    
    Example:
        api_url = "https://example.com/api/health"
        if not check_api_reachable(api_url, logger):
            logger.error("[ERROR] API unreachable, cannot proceed")
            sys.exit(2)
    
    Note:
        Requires 'requests' package. Import check handled internally.
    """
    try:
        import requests
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            logger.info(f"[INFO] API reachable: {url}")
            return True
        else:
            logger.error(f"[ERROR] API returned {response.status_code}: {url}")
            return False
    except ImportError:
        logger.error("[ERROR] 'requests' package not installed")
        return False
    except Exception as e:
        logger.error(f"[ERROR] Cannot reach API {url}: {e}")
        return False


# ASCII-only status tokens (Standard #2)
STATUS_PASS = "[PASS]"
STATUS_FAIL = "[FAIL]"
STATUS_INFO = "[INFO]"
STATUS_ERROR = "[ERROR]"
STATUS_WARN = "[WARN]"


def format_status(token: str, message: str) -> str:
    """
    Format status message with ASCII-only token.
    
    Args:
        token: Status token (STATUS_PASS, STATUS_FAIL, etc.)
        message: Message text
    
    Returns:
        Formatted string like "[PASS] Operation successful"
    
    Example:
        logger.info(format_status(STATUS_PASS, "All tests passed"))
        logger.error(format_status(STATUS_FAIL, "Validation failed"))
    """
    return f"{token} {message}"

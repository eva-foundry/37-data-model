#!/usr/bin/env python3
"""
EVA Factory Configuration Loader

Loads and normalizes eva-factory.config.yaml for all scripting operations.
Ensures EVA Factory can be deployed without code changes—only config changes.

Usage:
    from config_loader import load_config, resolve_path
    
    config = load_config()
    evidence_dir = resolve_path(config, "storage.evidence_root", workspace_path)
    
Environment Overrides:
    EVA_CONFIG_FILE - Path to eva-factory.config.yaml (default: ./eva-factory.config.yaml)
    EVA_STORAGE_PROJECTS_REGISTRY - Override projects.json path
    EVA_AUTOMATION_SCHEDULE_SYNC_51_ACA - Override Phase 2 schedule
    ... all other config keys as EVA_SECTION_KEY=value
"""

import os
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional
from dataclasses import dataclass


def load_yaml(filepath: Path) -> dict:
    """Load YAML config file. Falls back to JSON if YAML not available."""
    try:
        import yaml
        with open(filepath) as f:
            return yaml.safe_load(f)
    except ImportError:
        # Fallback: parse as JSON-like structure (simplified)
        print(f"WARNING: PyYAML not installed, attempting JSON fallback for {filepath}")
        with open(filepath) as f:
            content = f.read()
            # Basic YAML→JSON conversion for simple configs
            # Replace "key: value" with "key: "value""
            content = content.replace(": ", ': "').replace("\n", '",\n')
            try:
                return json.loads("{" + content + "}")
            except json.JSONDecodeError:
                raise RuntimeError(f"Failed to parse {filepath} - install PyYAML for proper support")


def get_config_file() -> Path:
    """
    Locate eva-factory.config.yaml.
    
    Search order:
    1. EVA_CONFIG_FILE environment variable
    2. ./eva-factory.config.yaml (current directory)
    3. ../eva-factory.config.yaml (parent directory)
    4. ../../eva-factory.config.yaml (two levels up)
    """
    if env_config := os.getenv("EVA_CONFIG_FILE"):
        return Path(env_config)
    
    search_paths = [
        Path("eva-factory.config.yaml"),
        Path("..") / "eva-factory.config.yaml",
        Path("../..") / "eva-factory.config.yaml",
    ]
    
    for candidate in search_paths:
        if candidate.exists():
            return candidate.resolve()
    
    raise FileNotFoundError(
        "eva-factory.config.yaml not found. "
        "Set EVA_CONFIG_FILE env var or place config in current/parent directory"
    )


def apply_env_overrides(config: dict) -> dict:
    """
    Apply environment variable overrides to config.
    
    LIMITATION: Due to ambiguous parsing with underscores, only simple flat keys
    are supported via environment variables. For complex nested overrides,
    use EVA_CONFIG_FILE to point to a custom config file.
    
    ENV format: EVA_<FLATKEY>=value
    Examples:
    - EVA_CONFIG_FILE=/etc/eva-factory.yaml (use custom config file)
    - For nested keys like "automation.schedules.sync_51_aca", use a custom config file
    
    WORKAROUND: Copy eva-factory.config.yaml, modify it, and point to it:
    ``` bash
    cp eva-factory.config.yaml /etc/deployment-config.yaml
    # Edit /etc/deployment-config.yaml as needed
    EVA_CONFIG_FILE=/etc/deployment-config.yaml python sync-evidence-all-projects.py ...
    ```
    """
    # For now, this is a no-op. Environment overrides for complex nested
    # keys are unreliable due to underscore ambiguity. Users should either:
    # 1. Use EVA_CONFIG_FILE to point to a custom config file
    # 2. Modify eva-factory.config.yaml directly in their deployment
    
    return config


def resolve_path(config, key_path: str, base_path: Path = None) -> Path:
    """
    Resolve a config path key to an absolute Path.
    
    Args:
        config: Loaded config dict or EvaFactoryConfig object
        key_path: Config key path (e.g., "storage.evidence_root")
        base_path: Base path for relative paths (default: cwd)
    
    Returns:
        Absolute Path object
    
    Example:
        resolve_path(config, "storage.evidence_root", Path("/workspace/51-ACA"))
        → Path("/workspace/51-ACA/.eva/evidence")
    """
    # Handle EvaFactoryConfig objects
    if isinstance(config, EvaFactoryConfig):
        config_dict = config.config
    else:
        config_dict = config
    
    if base_path is None:
        base_path = Path.cwd()
    
    # Navigate config dict by dot-separated key
    value = config_dict
    for part in key_path.split("."):
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            raise KeyError(f"Config key not found: {key_path}")
    
    # Convert to Path
    result = Path(value)
    
    # Resolve relative paths
    if not result.is_absolute():
        result = base_path / result
    
    # Expand environment variables
    result = Path(os.path.expandvars(str(result)))
    
    return result.resolve()


def get_config_value(config: dict, key_path: str, default: Any = None) -> Any:
    """
    Get a config value by dot-separated key path.
    
    Args:
        config: Loaded config dict
        key_path: Config key path (e.g., "validation.gates.pass_threshold")
        default: Default value if key not found
    
    Returns:
        Config value or default
    
    Example:
        get_config_value(config, "validation.gates.pass_threshold")
        → 0.15
    """
    value = config
    for part in key_path.split("."):
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return default
    return value


class EvaFactoryConfig:
    """
    Normalized EVA Factory configuration.
    
    Provides convenience methods for common operations:
    - resolve_path(): Convert config paths to absolute Path objects
    - get_value(): Get nested config values with defaults
    - storage paths, schema fields, validation gates, etc.
    """
    
    def __init__(self, config_dict: dict):
        """Initialize with loaded config."""
        self.config = config_dict
    
    @classmethod
    def load(cls) -> "EvaFactoryConfig":
        """Load config from file and apply overrides."""
        config_file = get_config_file()
        print(f"[CONFIG] Loading from {config_file}")
        
        config = load_yaml(config_file)
        config = apply_env_overrides(config)
        
        return cls(config)
    
    def resolve_path(self, key_path: str, base_path: Path = None) -> Path:
        """Resolve config path to absolute Path."""
        return resolve_path(self.config, key_path, base_path)
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """Get config value by dot-separated key."""
        return get_config_value(self.config, key_path, default)
    
    # Convenience properties
    
    @property
    def projects_registry_path(self) -> str:
        """Relative path to projects.json."""
        return self.get("storage.projects_registry", "model/projects.json")
    
    @property
    def evidence_root_dir(self) -> str:
        """Evidence directory (relative to project root)."""
        return self.get("storage.evidence_root", ".eva/evidence")
    
    @property
    def evidence_consolidated_path(self) -> str:
        """Path to consolidated evidence.json."""
        return self.get("storage.evidence_consolidated", "model/evidence.json")
    
    @property
    def schema_evidence_file(self) -> str:
        """Path to evidence schema."""
        return self.get("schema.evidence_file", "schema/evidence.schema.json")
    
    @property
    def phase_map(self) -> Dict[str, str]:
        """Phase transformation mapping."""
        return self.get("schema.phase_map", {"D": "D3", "P": "P", "C": "C", "A": "A"})
    
    @property
    def sprint_id_parts(self) -> int:
        """Number of parts to use for sprint ID inference."""
        return self.get("schema.sprint_id_parts", 2)
    
    @property
    def pass_threshold(self) -> float:
        """Validation pass threshold."""
        return self.get("validation.gates.pass_threshold", 0.15)
    
    @property
    def fail_threshold(self) -> float:
        """Validation fail threshold."""
        return self.get("validation.gates.fail_threshold", 0.50)
    
    @property
    def schedule_sync_51_aca(self) -> str:
        """Phase 2 sync schedule (cron)."""
        return self.get("automation.schedules.sync_51_aca", "0 8 * * *")
    
    @property
    def schedule_sync_portfolio(self) -> str:
        """Phase 3 sync schedule (cron)."""
        return self.get("automation.schedules.sync_portfolio", "30 8 * * *")
    
    @property
    def report_file(self) -> str:
        """Relative path to sync report."""
        return self.get("reporting.report_file", "model/reports/sync-evidence-report.json")


def main():
    """Test: Load and display config."""
    try:
        config = EvaFactoryConfig.load()
        print("\n[CONFIG] Successfully loaded eva-factory.config.yaml")
        print(f"  Factory: {config.get('factory.name')} v{config.get('factory.version')}")
        print(f"  Projects Registry: {config.projects_registry_path}")
        print(f"  Evidence Root: {config.evidence_root_dir}")
        print(f"  Phase 2 Schedule: {config.schedule_sync_51_aca}")
        print(f"  Phase 3 Schedule: {config.schedule_sync_portfolio}")
        print(f"  Pass Threshold: {config.pass_threshold * 100:.1f}%")
        return 0
    except Exception as e:
        print(f"[ERROR] Failed to load config: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

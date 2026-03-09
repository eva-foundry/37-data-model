#!/usr/bin/env python3
"""
Test: No Emojis in Production Code

Enforces professional coding standards by preventing emoji characters
in code, workflows, and scripts.

Per workspace copilot-instructions.md:
  "Professional standards prohibit decorative characters in code"

This test scans:
  - Python files (*.py)
  - GitHub workflows (.github/workflows/*.yml)
  - Shell scripts (scripts/*.sh)
  - Documentation that ships with code (README.md in api/, scripts/)

Excluded:
  - Session documentation (docs/sessions/*)
  - Markdown files (*.md) except for READMEs in code directories
  - Test files (tests/*.py) themselves

Author: EVA Foundation (Session 41 Part 11)
Date: 2026-03-09
"""

import re
from pathlib import Path
from typing import List, Tuple

import pytest


# Emoji detection regex: matches pictographic emojis and common status symbols
# Excludes box drawing characters (U+2500-U+257F) and em dash (U+2014)
# which are used for code formatting/organization
EMOJI_PATTERN = re.compile(
    r"[\U0001F300-\U0001F9FF]|"  # Emoticons & symbols
    r"[\u2705\u274c\u26a0\ufe0f]|"  # Check mark, X, warning
    r"[\u2713\u2717\u2660-\u2667]"  # Check, X, card suits
)

# Directories and file patterns to scan
SCAN_PATTERNS = [
    ".github/workflows/*.yml",
    ".github/workflows/*.yaml",
    "api/**/*.py",
    "scripts/**/*.py",
    "scripts/**/*.sh",
    "api/README.md",
    "scripts/README.md",
]

# Files to exclude (known exceptions)
EXCLUDE_PATTERNS = [
    "docs/sessions/**",
    "tests/**",
    "**/__pycache__/**",
    "**/.pytest_cache/**",
]


def should_scan_file(file_path: Path, project_root: Path) -> bool:
    """Determine if file should be scanned for emojis."""
    relative = file_path.relative_to(project_root)
    relative_str = str(relative).replace("\\", "/")
    
    # Check exclusions first
    for exclude in EXCLUDE_PATTERNS:
        if Path(relative_str).match(exclude):
            return False
    
    # Check if matches scan patterns
    for pattern in SCAN_PATTERNS:
        if Path(relative_str).match(pattern):
            return True
    
    return False


def find_emojis_in_file(file_path: Path) -> List[Tuple[int, str]]:
    """
    Scan file for emoji characters.
    
    Returns:
        List of (line_number, line_content) tuples containing emojis
    """
    violations = []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line_num, line in enumerate(f, start=1):
                if EMOJI_PATTERN.search(line):
                    # Found emoji - record violation
                    violations.append((line_num, line.rstrip()))
    except Exception as e:
        # If we can't read the file, skip it (binary file, encoding issue, etc.)
        pass
    
    return violations


def test_no_emojis_in_production_code():
    """
    Enforce no-emoji policy across production code and workflows.
    
    Fails if any emoji characters are detected in:
      - GitHub workflows (.github/workflows/*.yml)
      - Python modules (api/**/*.py, scripts/**/*.py)
      - Shell scripts (scripts/**/*.sh)
      - Code READMEs (api/README.md, scripts/README.md)
    """
    project_root = Path(__file__).parent.parent
    all_violations = {}
    
    # Scan all matching files
    for pattern in SCAN_PATTERNS:
        for file_path in project_root.glob(pattern):
            if should_scan_file(file_path, project_root):
                violations = find_emojis_in_file(file_path)
                if violations:
                    relative = file_path.relative_to(project_root)
                    all_violations[str(relative)] = violations
    
    # Build detailed failure message
    if all_violations:
        error_lines = [
            "",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "EMOJI POLICY VIOLATION",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
            "Professional standards prohibit decorative characters (emojis) in",
            "production code, workflows, and scripts.",
            "",
            f"Found {sum(len(v) for v in all_violations.values())} emoji instances in {len(all_violations)} files:",
            "",
        ]
        
        for file_path, violations in sorted(all_violations.items()):
            error_lines.append(f"  {file_path}:")
            for line_num, line_content in violations[:5]:  # Show first 5 per file
                # Truncate long lines
                if len(line_content) > 80:
                    line_content = line_content[:77] + "..."
                error_lines.append(f"    Line {line_num}: {line_content}")
            
            if len(violations) > 5:
                error_lines.append(f"    ... and {len(violations) - 5} more")
            error_lines.append("")
        
        error_lines.extend([
            "REMEDIATION:",
            "  Replace emojis with text alternatives:",
            "    ✅ → [OK] or [SUCCESS]",
            "    ❌ → [FAIL] or [ERROR]",
            "    ⚠️  → [WARN] or [WARNING]",
            "    📦 → [PACKAGE] or remove",
            "    🔨 → [BUILD] or remove",
            "    🔍 → [CHECK] or remove",
            "    🚀 → [DEPLOY] or remove",
            "    ⏳ → [WAIT] or remove",
            "",
            "See: .github/copilot-instructions.md for professional standards",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
        ])
        
        pytest.fail("\n".join(error_lines))


def test_emoji_detection_regex():
    """Verify emoji detection regex catches pictographic emojis but allows code formatting."""
    test_cases = [
        ("No emojis here", False),
        ("emoji 🚀 here", True),
        ("checkmark ✓ present", True),
        ("warning ⚠️ sign", True),
        ("ASCII only: [OK] [FAIL]", False),
        ("Package 📦 icon", True),
        ("Box drawing: ─────", False),  # Code formatting - allowed
        ("Em dash: —", False),  # Punctuation - allowed
        ("Right arrow: →", False),  # Typography - allowed
        ("Check mark ✅", True),  # Emoji - blocked
        ("X mark ❌", True),  # Emoji - blocked
    ]
    
    for text, should_match in test_cases:
        has_emoji = bool(EMOJI_PATTERN.search(text))
        assert has_emoji == should_match, f"Failed for: {text!r}"


if __name__ == "__main__":
    # Allow running directly for quick checks
    pytest.main([__file__, "-v"])

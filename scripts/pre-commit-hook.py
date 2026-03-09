#!/usr/bin/env python3
"""
Pre-commit hook: Auto-fix banal quality issues locally

Usage:
  1. Copy this to .git/hooks/pre-commit
  2. Make executable: chmod +x .git/hooks/pre-commit
  3. Fixes are applied automatically before each commit

Professional standard: Catch issues before pushing to GitHub
"""
import re
import sys
from pathlib import Path

# Workspace encoding standard: NEVER use Unicode in scripts
UNICODE_REPLACEMENTS = {
    "✓": "[PASS]",
    "✅": "[PASS]",
    "✗": "[FAIL]",
    "❌": "[ERROR]",
    "⚠": "[WARN]",
    "⏳": "[WAIT]",
    "🎯": "[TARGET]",
    "📄": "[FILE]",
    "📊": "[DATA]",
    "🔄": "[PROCESSING]",
    "💾": "[SAVE]",
    "🚀": "[LAUNCH]",
    "…": "...",
}


def fix_f541_in_file(file_path: Path) -> bool:
    """Remove f prefix from f-strings without placeholders."""
    content = file_path.read_text(encoding="utf-8")
    original = content
    
    # Pattern: f"string" or f'string' with no {placeholder}
    pattern = r'\bf(["\'])((?:(?!\1|\{).)*)\1'
    
    def replace_if_no_placeholder(match):
        quote = match.group(1)
        string_content = match.group(2)
        if "{" not in string_content:
            return f"{quote}{string_content}{quote}"
        return match.group(0)
    
    content = re.sub(pattern, replace_if_no_placeholder, content)
    
    if content != original:
        file_path.write_text(content, encoding="utf-8")
        return True
    return False


def fix_unicode_in_file(file_path: Path) -> bool:
    """Replace Unicode characters with ASCII equivalents."""
    content = file_path.read_text(encoding="utf-8")
    original = content
    
    for unicode_char, ascii_replacement in UNICODE_REPLACEMENTS.items():
        content = content.replace(unicode_char, ascii_replacement)
    
    if content != original:
        file_path.write_text(content, encoding="utf-8")
        return True
    return False


def main():
    """Run auto-fixes on staged Python files."""
    import subprocess
    
    # Get staged Python files
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        capture_output=True,
        text=True,
    )
    
    if result.returncode != 0:
        return 0
    
    staged_files = [
        Path(f) for f in result.stdout.strip().split("\n")
        if f.endswith(".py") and Path(f).exists()
    ]
    
    if not staged_files:
        return 0
    
    fixed_files = []
    
    for file_path in staged_files:
        f541_fixed = fix_f541_in_file(file_path)
        unicode_fixed = fix_unicode_in_file(file_path)
        
        if f541_fixed or unicode_fixed:
            fixed_files.append(file_path)
            # Re-stage the fixed file
            subprocess.run(["git", "add", str(file_path)])
            
            issues = []
            if f541_fixed:
                issues.append("F541")
            if unicode_fixed:
                issues.append("Unicode")
            
            print(f"✓ Auto-fixed {', '.join(issues)} in {file_path}")
    
    if fixed_files:
        print(f"\n✓ Auto-fixed {len(fixed_files)} file(s)")
        print("  Fixed issues: F541 (f-strings), Unicode characters")
        print("  Changes staged for commit")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

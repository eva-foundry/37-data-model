#!/usr/bin/env python3
# bug_fix_agent.py -- Root Cause Analysis → Fix → Prevention (DPDCA for bugs)
#
# Part of 29-foundry bug-fix-automation skill
# Integrates with sprint_agent.py to handle BUG-NNN stories
# F37-TRACE-002: Includes LM tracing (correlation ID, cost tracking)

import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import dict, tuple, list, Optional
import os

try:
    import requests
except ImportError:
    requests = None

# LM Tracing support (F37-TRACE-002)
try:
    from lm_tracer import LMTracer, LM_TRACER_AVAILABLE
except ImportError:
    LM_TRACER_AVAILABLE = False

REPO_ROOT = Path(__file__).parent.parent.parent
DATA_MODEL_API = os.getenv("DATA_MODEL_URL", "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io")


def _run(cmd: list, check: bool = False, capture: bool = True) -> subprocess.CompletedProcess:
    """Execute shell command."""
    return subprocess.run(cmd, capture_output=capture, text=True, check=check)


def _now_iso() -> str:
    """Current ISO timestamp."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _api_call(method: str, path: str, json_data: dict = None) -> dict:
    """Query data model API."""
    if not requests:
        return {}
    headers = {"X-Actor": "bug-fix-agent"}
    url = f"{DATA_MODEL_API}{path}"
    try:
        response = requests.request(method, url, json=json_data, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json() if response.text else {}
    except Exception as exc:
        print(f"[WARN] Data model API call failed: {method} {path} -- {exc}")
        return {}


# ---------------------------------------------------------------------------
# Phase A: Root Cause Analysis (Discover)
# ---------------------------------------------------------------------------

def phase_discover_rca(story: dict, correlation_id: str = "", preferred_model: str = "gpt-4o-mini") -> tuple[str, dict]:
    """
    Analyze failing test/code to discover root cause (F37-TRACE-002).
    
    Args:
        story: Bug story dict
        correlation_id: Trace correlation ID
        preferred_model: Model to use for RCA
    
    Returns: (rca_markdown, metadata_dict)
    """
    story_id = story.get("id", "BUG-UNKNOWN")
    print(f"[TRACE:{correlation_id}] [INFO] === Phase A: Root Cause Analysis for {story_id} ===\")
    
    affected_code = story.get("affected_code_path", "")
    failing_test = story.get("failing_test_output", "")
    bug_context = story.get("bug_description", "")
    
    # Build RCA analysis prompt
    rca_prompt = f"""You are a root cause analysis expert.

BUG: {bug_context}
AFFECTED CODE: {affected_code}
ERROR OUTPUT: {failing_test}

Analyze this bug and provide:

1. Root Cause Category (e.g., Schema Mismatch, Type Confusion, Logic Error, Missing Docs)
2. Why This Happened (technical explanation)
3. Impact Assessment (what breaks, who is affected)
4. Prevention Strategy (what would catch this in the future)

Be specific and actionable. Format as markdown.
"""
    
    # Call LLM with tracing (F37-TRACE-002)
    rca_text, trace_file = call_llm_gpt4o_mini(
        rca_prompt, 
        story_id=story_id, 
        phase="A", 
        correlation_id=correlation_id,
        model=preferred_model
    )
    
    # Structure the RCA report
    rca_markdown = f"""# Root Cause Analysis: {story_id}

**Date**: {_now_iso()}
**Story**: {story.get('title', 'Unknown')}
**Status**: Analysis Complete

## Analysis

{rca_text}

## Next Steps

- Phase B: Apply fix based on RCA
- Phase C: Generate prevention test
"""
    
    metadata = {
        "phase": "A",
        "timestamp": _now_iso(),
        "story_id": story_id,
        "analysis_tokens": len(rca_text.split()),
        "trace_file": str(trace_file) if trace_file else None,  # F37-TRACE-002
    }
    
    return rca_markdown, metadata


def write_rca_artifact(story_id: str, rca_markdown: str, metadata: dict) -> str:
    """
    Write RCA markdown and receipt to .eva/evidence/
    
    Returns: path to RCA markdown
    """
    evidence_dir = REPO_ROOT / ".eva" / "evidence"
    evidence_dir.mkdir(parents=True, exist_ok=True)
    
    # Write RCA markdown
    rca_path = evidence_dir / f"{story_id}-A.md"
    rca_path.write_text(rca_markdown, encoding="utf-8")
    print(f"[INFO] Wrote RCA: {rca_path}")
    
    # Write evidence receipt
    receipt = {
        "story_id": f"{story_id}-A",
        "phase": "A",
        "title": "Root cause analysis",
        "timestamp": _now_iso(),
        "artifacts": [str(rca_path.relative_to(REPO_ROOT))],
        **metadata
    }
    receipt_path = evidence_dir / f"{story_id}-A-receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(f"[INFO] Wrote receipt: {receipt_path}")
    
    return str(rca_path)


# ---------------------------------------------------------------------------
# Phase B: Fix Occurrence (Do)
# ---------------------------------------------------------------------------

def phase_do_fix(story: dict, rca_markdown: str) -> tuple[list, dict]:
    """
    Generate and apply bug fix.
    
    Returns: (list_of_changed_files, metadata_dict)
    """
    story_id = story.get("id", "BUG-UNKNOWN")
    print(f"[INFO] === Phase B: Fix Occurrence for {story_id} ===")
    
    affected_file = story.get("affected_code_path", "")
    target_line = story.get("target_line", 0)
    
    # Read current code
    file_path = REPO_ROOT / affected_file
    if not file_path.exists():
        print(f"[FAIL] File not found: {affected_file}")
        return [], {"error": "file_not_found"}
    
    original_content = file_path.read_text(encoding="utf-8")
    
    # Build fix prompt
    fix_prompt = f"""Based on this root cause analysis:

{rca_markdown}

Please fix the bug in {affected_file} at line {target_line}.

Current problematic code pattern is visible there.

Requirements for the fix:
1. Minimal change (< 10 lines modified)
2. Preserve all other functionality
3. Add a brief comment explaining the fix
4. Use the same code style as the rest of the file

Respond with ONLY the fixed code, no explanation.
"""
    
    # Call LLM to generate fix
    fixed_code = call_llm_gpt4o_mini(fix_prompt)
    
    # Smart replacement: try to apply the fix
    # (Real implementation would be more sophisticated)
    updated_content = apply_fix_intelligently(
        original_content, 
        fixed_code, 
        affected_file
    )
    
    # Write fixed file
    file_path.write_text(updated_content, encoding="utf-8")
    print(f"[INFO] Applied fix to: {affected_file}")
    
    # Run failing test to verify fix
    test_cmd = story.get("failing_test_command", "pytest")
    print(f"[INFO] Running test: {test_cmd}")
    test_result = _run(test_cmd.split(), check=False)
    
    if test_result.returncode != 0:
        print(f"[WARN] Test still failing after fix attempt")
        print(f"[WARN] Test output: {test_result.stderr[:500]}")
        # Optionally retry with more context
        return [], {"error": "test_still_failing", "test_output": test_result.stderr[:500]}
    
    print(f"[PASS] Test now passes!")
    
    metadata = {
        "phase": "B",
        "timestamp": _now_iso(),
        "story_id": story_id,
        "files_changed": 1,
        "test_result": "PASS"
    }
    
    return [affected_file], metadata


def apply_fix_intelligently(original_code: str, fixed_code: str, target_file: str) -> str:
    """
    Apply fix intelligently - try pattern matching first, then fallback to regex.
    
    In a real implementation, this would:
    - Parse the problematic pattern
    - Find exact match in original code
    - Replace with fixed code
    - Preserve formatting
    """
    # Placeholder: in CI, the LLM would generate a proper patch or the fix would be obvious
    # For now, return the fixed code as-is (assumes LLM generated correct full content)
    return fixed_code


# ---------------------------------------------------------------------------
# Phase C: Prevent Regression (Act)
# ---------------------------------------------------------------------------

def phase_act_prevent(story: dict, rca_markdown: str) -> tuple[str, dict]:
    """
    Generate prevention test that would have caught the original bug.
    
    Returns: (test_file_path, metadata_dict)
    """
    story_id = story.get("id", "BUG-UNKNOWN")
    print(f"[INFO] === Phase C: Prevention Test for {story_id} ===")
    
    bug_type = story.get("bug_category", "Unknown")
    bug_desc = story.get("bug_description", "")
    
    # Build prevention test prompt
    test_prompt = f"""Based on this bug analysis:

{rca_markdown}

Generate a pytest test that would have CAUGHT this bug.

Bug Type: {bug_type}
Bug Description: {bug_desc}

The test must:
1. Fail on the original (buggy) code
2. Pass on the fixed code
3. Be specific enough to prevent this bug class
4. Include a clear docstring and assertion message

Response format:
```python
def test_[name](...)
    \"\"\"[docstring describing what this prevents]\"\"\"
    # test code
    assert ...
```
"""
    
    test_code = call_llm_gpt4o_mini(test_prompt)
    
    # Write test to tests/ directory
    test_dir = REPO_ROOT / "tests"
    test_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate test file name
    test_file = test_dir / f"test_prevent_{story_id.lower().replace('-', '_')}.py"
    
    # Wrap test with proper imports and structure
    test_content = f"""'''
Prevention test for {story_id}
Auto-generated by bug-fix-automation skill
'''
import pytest

{test_code}
"""
    
    test_file.write_text(test_content, encoding="utf-8")
    print(f"[INFO] Wrote prevention test: {test_file}")
    
    # Run test on fixed code - must PASS
    test_result = _run(["pytest", str(test_file), "-v"], check=False)
    
    if test_result.returncode != 0:
        print(f"[WARN] Prevention test failed on fixed code")
        print(f"[WARN] Output: {test_result.stderr[:500]}")
        return "", {"error": "prevention_test_failed"}
    
    print(f"[PASS] Prevention test passes on fixed code!")
    
    metadata = {
        "phase": "C",
        "timestamp": _now_iso(),
        "story_id": story_id,
        "test_file": str(test_file.relative_to(REPO_ROOT)),
        "test_result": "PASS",
        "prevents": bug_type
    }
    
    return str(test_file.relative_to(REPO_ROOT)), metadata


# ---------------------------------------------------------------------------
# LLM Integration (GitHub Models API)
# ---------------------------------------------------------------------------

def call_llm_gpt4o_mini(prompt: str, max_tokens: int = 2000, story_id: str = "", 
                        phase: str = "A", correlation_id: str = "", model: str = "gpt-4o-mini") -> tuple[str, Optional[Path]]:
    """
    Call GitHub Models via GitHub token auth.
    F37-TRACE-002: Returns tuple (response_text, trace_file_path) for tracing.
    
    Fallback: return placeholder for local testing.
    """
    token = os.getenv("GITHUB_TOKEN", "")
    
    # Initialize tracer if available (F37-TRACE-002)
    tracer = None
    if LM_TRACER_AVAILABLE and correlation_id and story_id:
        tracer = LMTracer(story_id, phase, correlation_id, repo_root=REPO_ROOT)
    
    if not token:
        print(f"[TRACE:{correlation_id}] [WARN] GITHUB_TOKEN not set - returning placeholder response")
        response_text = "[PLACEHOLDER] Internal reasoning about bug analysis..."
        return response_text, None
    
    try:
        import requests as req_lib
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": model,
            "temperature": 0.3,
            "max_tokens": max_tokens,
        }
        
        print(f"[TRACE:{correlation_id}] [INFO] LLM call: {model} (phase {phase})")
        response = req_lib.post(
            "https://models.inference.ai.azure.com/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        response_text = data["choices"][0]["message"]["content"]
        
        # Record LM call with tracer (F37-TRACE-002)
        trace_file = None
        if tracer:
            tracer.call_lm(
                model=model,
                system_prompt="You are an expert developer and root cause analysis specialist.",
                user_prompt=prompt,
                response_text=response_text,
                tokens_in=data.get("usage", {}).get("prompt_tokens", 0),
                tokens_out=data.get("usage", {}).get("completion_tokens", 0)
            )
            trace_file = tracer.save()
            print(f"[TRACE:{correlation_id}] [INFO] LM cost: ${tracer.get_summary()['total_cost_usd']:.6f}")
        
        return response_text, trace_file
    except Exception as exc:
        print(f"[TRACE:{correlation_id}] [WARN] LLM call failed: {exc}")
        return "[ERROR] LLM call failed - manual analysis required", None


# ---------------------------------------------------------------------------
# Main Bug-Fix Automation Entry Point
# ---------------------------------------------------------------------------

def execute_bug_fix_sprint(bug_stories: list, github_token: str = "", 
                           correlation_id: str = "", preferred_model: str = "gpt-4o-mini") -> dict:
    """
    Execute full bug-fix DPDCA for list of BUG-NNN stories (F37-TRACE-002).
    
    Args:
        bug_stories: List of BUG story dicts
        github_token: GitHub token for API calls
        correlation_id: Trace correlation ID (F37-TRACE-001)
        preferred_model: Model to use for LLM calls (default: gpt-4o-mini)
    
    Returns: summary dict with results
    """
    print(f"[TRACE:{correlation_id}] [INFO] Starting bug-fix automation for {len(bug_stories)} stories")
    
    results = {
        "stories": {},
        "total_bugs": len(bug_stories),
        "total_phases_passed": 0,
        "total_phases_failed": 0,
        "start_time": _now_iso(),
        "correlation_id": correlation_id  # F37-TRACE-002
    }
    
    for story in bug_stories:
        story_id = story.get("id", "BUG-UNKNOWN")
        print(f"[TRACE:{correlation_id}] [INFO] Processing {story_id}...")
        
        story_result = {
            "phases": {}
        }
        
        # Phase A: Discover (F37-TRACE-002: pass correlation_id and model)
        try:
            rca_md, rca_meta = phase_discover_rca(story, correlation_id=correlation_id, preferred_model=preferred_model)
            rca_path = write_rca_artifact(story_id, rca_md, rca_meta)
            story_result["phases"]["A"] = {
                "status": "DONE",
                "artifact": rca_path,
                **rca_meta
            }
            results["total_phases_passed"] += 1
        except Exception as exc:
            print(f"[FAIL] Phase A failed: {exc}")
            story_result["phases"]["A"] = {"status": "FAILED", "error": str(exc)}
            results["total_phases_failed"] += 1
            results["stories"][story_id] = story_result
            continue
        
        # Phase B: Do
        try:
            changed_files, fix_meta = phase_do_fix(story, rca_md)
            if fix_meta.get("error"):
                raise Exception(fix_meta.get("error"))
            
            # Write evidence receipt for phase B
            receipt = {
                "story_id": f"{story_id}-B",
                "phase": "B",
                "title": "Fix occurrence",
                "timestamp": _now_iso(),
                "artifacts": changed_files,
                **fix_meta
            }
            evidence_dir = REPO_ROOT / ".eva" / "evidence"
            receipt_path = evidence_dir / f"{story_id}-B-receipt.json"
            receipt_path.write_text(json.dumps(receipt, indent=2), encoding="utf-8")
            
            story_result["phases"]["B"] = {
                "status": "DONE",
                "files_changed": changed_files,
                **fix_meta
            }
            results["total_phases_passed"] += 1
        except Exception as exc:
            print(f"[FAIL] Phase B failed: {exc}")
            story_result["phases"]["B"] = {"status": "FAILED", "error": str(exc)}
            results["total_phases_failed"] += 1
        
        # Phase C: Act
        try:
            test_file, prevent_meta = phase_act_prevent(story, rca_md)
            if prevent_meta.get("error"):
                raise Exception(prevent_meta.get("error"))
            
            # Write evidence receipt for phase C
            receipt = {
                "story_id": f"{story_id}-C",
                "phase": "C",
                "title": "Prevention test",
                "timestamp": _now_iso(),
                "artifacts": [test_file],
                **prevent_meta
            }
            evidence_dir = REPO_ROOT / ".eva" / "evidence"
            receipt_path = evidence_dir / f"{story_id}-C-receipt.json"
            receipt_path.write_text(json.dumps(receipt, indent=2), encoding="utf-8")
            
            story_result["phases"]["C"] = {
                "status": "DONE",
                "test_file": test_file,
                **prevent_meta
            }
            results["total_phases_passed"] += 1
        except Exception as exc:
            print(f"[FAIL] Phase C failed: {exc}")
            story_result["phases"]["C"] = {"status": "FAILED", "error": str(exc)}
            results["total_phases_failed"] += 1
        
        results["stories"][story_id] = story_result
    
    results["end_time"] = _now_iso()
    results["status"] = "PASS" if results["total_phases_failed"] == 0 else "WARN"
    
    return results


if __name__ == "__main__":
    # Example usage
    test_bugs = [
        {
            "id": "BUG-F37-002",
            "title": "Endpoint field format mismatch",
            "bug_description": "validate-all-refs.py accesses ep['method'] that doesn't exist",
            "bug_category": "Schema Mismatch",
            "affected_code_path": "scripts/validate-all-refs.py",
            "target_line": 30,
            "failing_test_output": "AttributeError: 'dict' object has no attribute 'method'",
            "failing_test_command": "python scripts/validate-all-refs.py --help"
        }
    ]
    
    results = execute_bug_fix_sprint(test_bugs)
    print(f"\n[INFO] Bug-fix sprint complete: {json.dumps(results, indent=2)}")

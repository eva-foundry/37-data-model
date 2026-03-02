# Integration: LM Tracing into sprint_agent.py

**File**: `.github/scripts/sprint_agent.py`  
**Existing Code Location**: Lines 820-1020  
**Change Type**: Additive (backward compatible)

---

## Step 1: Import Tracer (Line ~30)

```python
# At top of sprint_agent.py, after existing imports:
from lm_tracer import LMTracer, LMCall, generate_correlation_id, get_model_for_severity, LLM_MODELS
```

---

## Step 2: Generate Correlation ID (Line ~860 in run_sprint)

**Before** (current):
```python
def run_sprint(issue: int, repo: str) -> None:
    print(f"[INFO] Sprint agent starting -- issue #{issue} repo {repo}")
    issue_title, issue_body = _gh_issue_body(issue, repo)
```

**After**:
```python
def run_sprint(issue: int, repo: str) -> None:
    # Generate correlation ID for entire sprint execution
    sprint_manifest = parse_manifest_with_fallback(issue_title, issue_body)
    correlation_id = generate_correlation_id(sprint_manifest.get("sprint_id", "SPRINT"))
    
    print(f"[TRACE:{correlation_id}] [INFO] Sprint agent starting -- issue #{issue} repo {repo}")
    issue_title, issue_body = _gh_issue_body(issue, repo)
```

---

## Step 3: Pass Correlation ID to Child Processes (Line ~920)

**Before** (current):
```python
if story.get("story_type") == "BUG" or "BUG-" in sid:
    print(f"[INFO] BUG story detected - routing to bug-fix-automation")
    from bug_fix_agent import execute_bug_fix_sprint
    bug_results = execute_bug_fix_sprint([story])
```

**After**:
```python
if story.get("story_type") == "BUG" or "BUG-" in sid:
    print(f"[TRACE:{correlation_id}] [INFO] BUG story detected - routing to bug-fix-automation")
    from bug_fix_agent import execute_bug_fix_sprint
    # Pass correlation_id and model routing info
    bug_results = execute_bug_fix_sprint(
        [story],
        correlation_id=correlation_id,
        preferred_model=get_model_for_severity(story.get("severity", "MEDIUM"))
    )
```

---

## Step 4: Update Evidence Writing (Line ~960)

**Before** (current):
```python
evidence_path = write_evidence(
    story, test_status, lint_status,
    duration_ms=duration_ms,
    tokens_used=0,
    test_count_before=0,
    test_count_after=0,
    files_changed=len(written_files)
)
```

**After**:
```python
evidence_path = write_evidence(
    story, test_status, lint_status,
    duration_ms=duration_ms,
    tokens_used=0,
    test_count_before=0,
    test_count_after=0,
    files_changed=len(written_files),
    correlation_id=correlation_id,  # NEW
    epic_id=manifest.get("epic", ""),  # NEW
    trace_file=lm_trace_file if "lm_trace_file" in locals() else None  # NEW
)
```

---

## Step 5: Update write_evidence() Function (Line ~630)

**Before** (current):
```python
def write_evidence(story: dict, test_status: str, lint_status: str,
                   duration_ms: int = 0, tokens_used: int = 0,
                   test_count_before: int = 0, test_count_after: int = 0,
                   files_changed: int = 0) -> Path:
        
    receipt = {
        "story_id": story["id"],
        "title": story.get("title", ""),
        "phase": "A",
        "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
        "artifacts": [],
        "test_result": test_status,
        "lint_result": lint_status,
        "commit_sha": "",
        "duration_ms": duration_ms,
        "tokens_used": tokens_used,
        "test_count_before": test_count_before,
        "test_count_after": test_count_after,
        "files_changed": files_changed
    }
```

**After** (enhanced):
```python
def write_evidence(story: dict, test_status: str, lint_status: str,
                   duration_ms: int = 0, tokens_used: int = 0,
                   test_count_before: int = 0, test_count_after: int = 0,
                   files_changed: int = 0, correlation_id: str = "",
                   epic_id: str = "", trace_file: Optional[Path] = None) -> Path:
    
    # Enhanced receipt with full traceability
    receipt = {
        "correlation_id": correlation_id,  # NEW
        "story_id": story["id"],
        "title": story.get("title", ""),
        "epic_id": epic_id,  # NEW
        "feature_id": "F37-DPDCA-001",  # Could be parameterized
        "phase": "A",
        
        "timeline": {  # NEW - timestamp all state transitions
            "created_at": datetime.now(timezone.utc).isoformat() + "Z",
            "submitted_to_lm_at": None,  # Filled by bug_fix_agent
            "response_received_at": None,
            "fix_applied_at": None,
            "test_passed_at": None,
            "committed_at": None
        },
        
        "lm_interaction": None,  # NEW - from trace_file if available
        
        "status": "DONE",
        "test_result": test_status,
        "lint_result": lint_status,
        "commit_sha": "",
        "duration_ms": duration_ms,
        "files_changed": files_changed
    }
    
    # Load LM trace if available
    if trace_file and trace_file.exists():
        trace_data = json.loads(trace_file.read_text())
        if trace_data.get("lm_calls"):
            receipt["lm_interaction"] = trace_data["lm_calls"][0]  # First call
    
    eva_dir = REPO_ROOT / ".eva" / "evidence"
    eva_dir.mkdir(parents=True, exist_ok=True)
    
    receipt_file = eva_dir / f"{story['id']}-receipt.json"
    receipt_file.write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    
    return receipt_file
```

---

## Step 6: Update Sprint Summary (Line ~1050)

**Before** (current):
```python
summary = textwrap.dedent(f"""
## Sprint Summary -- {sprint.get('sprint_id', 'SPRINT')} COMPLETE

**Sprint**: {sprint.get('sprint_title', '')}
**Branch**: `{branch}`
**Stories**: {passed}/{total} passed
""").strip()
```

**After**:
```python
# Calculate cost from all trace files
total_cost_usd = 0.0
trace_dir = REPO_ROOT / ".eva" / "traces"
if trace_dir.exists():
    for trace_file in trace_dir.glob("*-*-lm-calls.json"):
        trace_data = json.loads(trace_file.read_text())
        total_cost_usd += trace_data.get("summary", {}).get("total_cost_usd", 0.0)

summary = textwrap.dedent(f"""
## Sprint Summary -- {sprint.get('sprint_id', 'SPRINT')} COMPLETE

**Sprint**: {sprint.get('sprint_title', '')}
**Branch**: `{branch}`
**Correlation ID**: `{correlation_id}`
**Stories**: {passed}/{total} passed
**Total Cost**: ${total_cost_usd:.6f}

### Cost Breakdown
| Model | Count | Cost |
|-------|-------|------|
| gpt-4o-mini | {count_mini} | ${cost_mini:.6f} |
| gpt-4o | {count_4o} | ${cost_4o:.6f} |
| **Total** | | **${total_cost_usd:.6f}** |
""").strip()
```

---

## Model Selection Strategy

Modify `_generate_code()` to respect severity:

```python
def _generate_code(story: dict, context: str, preferred_model: str = "gpt-4o-mini") -> dict[str, str]:
    """Generate code using preferred model or escalate to gpt-4o for critical bugs."""
    
    # Use gpt-4o for critical bugs despite higher cost
    model = get_model_for_severity(story.get("severity", "MEDIUM"), preferred_model)
    print(f"[INFO] Using model: {model} (tier: {LLM_MODELS[model]['tier']})")
    
    # ... rest of function ...
    client = OpenAI(base_url="https://models.inference.ai.azure.com", api_key=github_token)
    response = client.chat.completions.create(
        model=model,
        messages=[...]
    )
    
    # Log the LM call for tracing
    tracer = LMTracer(story["id"], "B", correlation_id)
    tracer.call_lm(
        model=model,
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_text=response.choices[0].message.content,
        tokens_in=response.usage.prompt_tokens,
        tokens_out=response.usage.completion_tokens
    )
    tracer.save()
    
    return _make_stubs(story)
```

---

## Backward Compatibility

- ✅ All new parameters have defaults
- ✅ Existing code paths still work
- ✅ Correlation ID is logged but not required
- ✅ Traces are written to new `.eva/traces/` directory (doesn't interfere with `.eva/evidence/`)

---

## Testing Changes

```bash
# Re-run SPRINT-0.5 with new tracing
gh workflow run sprint-agent.yml --repo eva-foundry/37-data-model -f issue_number=3

# Verify correlation ID in logs
gh run view <run-id> --log | grep TRACE:

# Verify trace files created
ls -la .eva/traces/

# Verify cost calculation
python3 << 'EOF'
import json
from pathlib import Path
traces = Path(".eva/traces").glob("*-lm-calls.json")
for trace_file in traces:
    data = json.loads(trace_file.read_text())
    print(f"{trace_file.name}: ${data['summary']['total_cost_usd']:.6f}")
EOF
```

---

## Expected Output (SPRINT-0.5 with Tracing)

```
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] Sprint agent starting
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] Extracted sprint_id from title: 'SPRINT-0.5'
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] BUG story detected - routing to bug-fix-automation
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] Using model: gpt-4o-mini (tier: free)
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] Trace written: .eva/traces/BUG-F37-001-A-lm-calls.json
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [PASS] Sprint SPRINT-0.5 complete -- 3/3 stories done

Total Cost: $0.00261
```

---

## Next: Data Model Integration

Once basic tracing works, extend the data model:

```bash
PUT /model/traces/{correlation_id} \
  -d '{
    "correlation_id": "SPRINT-0.5-20260301165702-a1b2c3d4",
    "sprint_id": "SPRINT-0.5",
    "lm_calls_total": 9,
    "cost_usd": 0.00261,
    "stories": ["BUG-F37-001", "BUG-F37-002", "BUG-F37-003"]
  }'
```

Query across sprints:
```bash
GET /model/traces/?cost_usd_min=0.01  # High-cost executions
GET /model/traces/?model=gpt-4o       # Using paid tier
```

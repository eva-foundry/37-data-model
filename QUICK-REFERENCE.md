# Quick Reference: Correlation ID & Cost Calculation

**Purpose**: Quick answers for SPRINT-1 implementation questions

---

## Correlation ID Format

```
SPRINT-0.5-20260301165702-a1b2c3d4
│         │                │        └─ UUID first 8 chars (unique within second)
│         │                └────────── Timestamp (YYYYMMDDhhmmss)
│         └───────────────────────── Sprint ID (SPRINT-0.5)
└─────────────────────────────────── Fixed prefix
```

**Generation**:
```python
from lm_tracer import generate_correlation_id
cid = generate_correlation_id("SPRINT-0.5")
# Output: "SPRINT-0.5-20260301165702-a1b2c3d4"
```

**Logging** (every message):
```
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] Sprint agent starting
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [INFO] BUG story detected
[TRACE:SPRINT-0.5-20260301165702-a1b2c3d4] [PASS] Sprint complete
```

**Evidence Files** (all include):
```json
{
  "correlation_id": "SPRINT-0.5-20260301165702-a1b2c3d4",
  "story_id": "BUG-F37-001",
  ...
}
```

---

## Cost Calculation

**Formula** (GitHub Models):
```
cost_usd = (tokens_in × input_multiplier + tokens_out × output_multiplier) × $0.00001
```

**Model Multipliers**:

| Model | Input Multiplier | Output Multiplier | Base Cost | Use Case |
|-------|------------------|-------------------|-----------|----------|
| **gpt-4o-mini** | 0.015 | 0.0075 | FREE tier | 95% of bugs, routine RCA |
| **gpt-4o** | 0.25 | 0.125 | FREE tier | 5% of bugs, critical RCA |
| claude-haiku | 0.005 | 0.001 | Foundry BYOK | Future (not in free tier) |
| claude-sonnet | 0.03 | 0.0075 | Foundry BYOK | Future (not in free tier) |

**Examples** (GitHub Models free tier):

```
Scenario A: Routine bug RCA
─────────────────────────────────
Model: gpt-4o-mini
Input:  245 tokens × 0.015 = 3.675
Output: 89 tokens × 0.0075 = 0.6675
Subtotal: 4.3425 × $0.00001 = $0.000043425
Cost: ~$0.00004 (rounds to $0.00004)

Scenario B: Critical bug RCA (gpt-4o escalation)
─────────────────────────────────
Model: gpt-4o
Input:  245 tokens × 0.25 = 61.25
Output: 89 tokens × 0.125 = 11.125
Subtotal: 72.375 × $0.00001 = $0.00072375
Cost: ~$0.00072 (10x more expensive, better quality)

Scenario C: Full bug fix (3 phases × gpt-4o-mini)
───────────────────────────────────
Phase A (RCA):    245 in, 89 out  → $0.00004
Phase B (fix):    312 in, 156 out → $0.00005
Phase C (test):   198 in, 67 out  → $0.00003
───────────────────────────────────
Total per bug: ~$0.00012

SPRINT-0.5 (3 bugs): ~$0.00036 (under half a cent!)
```

**Cost Calculation Function** (in lm_tracer.py):
```python
def _calculate_cost(self, model: str, tokens_in: int, tokens_out: int) -> float:
    """Calculate cost using GitHub Models formula.
    
    Cost = (tokens_in × input_multiplier + tokens_out × output_multiplier) × $0.00001
    """
    multiplier = LLM_MODELS[model]["input_multiplier"] * tokens_in + \
                 LLM_MODELS[model]["output_multiplier"] * tokens_out
    cost_usd = multiplier * 0.00001  # $0.00001 per token unit
    return round(cost_usd, 8)  # Preserve precision
```

**Verification** (check your math):
```python
from lm_tracer import LMCall, LLM_MODELS

call = LMCall(
    model="gpt-4o-mini",
    tokens_in=245,
    tokens_out=89
)
print(call.to_dict()["cost_usd"])  # Expected: 0.00004345
```

---

## WBS Hierarchy (4-Level Chain)

```
Epic (Strategic)
  └─ Feature (Release)
      └─ Story (Dev Task)
          └─ Phase (LLM Phase: A/B/C)
```

**Real Example**:
```
FK-DPDCA-001 (Epic: DPDCA for Bugs)
  └─ F37-DPDCA-001 (Feature: Bug Automation)
      └─ BUG-F37-001 (Story: row_version not incremented)
          ├─ Phase A: RCA (gpt-4o-mini, 245 tokens in, $0.00004)
          ├─ Phase B: Fix (gpt-4o-mini, 312 tokens in, $0.00005)
          └─ Phase C: Test (gpt-4o-mini, 198 tokens in, $0.00003)
```

**Evidence Record** (includes full hierarchy):
```json
{
  "correlation_id": "SPRINT-0.5-20260301165702-a1b2c3d4",
  "epic_id": "FK-DPDCA-001",
  "feature_id": "F37-DPDCA-001",
  "story_id": "BUG-F37-001",
  "phase": "A",
  ...
}
```

---

## Timeline (6 State Transitions)

```
created_at (Issue created)
    ↓
submitted_to_lm_at (LLM call started)
    ↓
response_received_at (LLM response received)
    ↓
fix_applied_at (Code changes written)
    ↓
test_passed_at (pytest + lint passed)
    ↓
committed_at (Git commit pushed)
```

**Duration Calculations**:
```
| Duration | Calculation | Typical Value |
|----------|-------------|---|
| LM latency | response_received_at - submitted_to_lm_at | 850-1200ms |
| Fix time | test_passed_at - fix_applied_at | 100-500ms |
| Total phase time | committed_at - created_at | 1000-3000ms |
```

**Evidence Record** (timestamp example):
```json
{
  "timeline": {
    "created_at": "2026-03-01T16:57:02.123Z",
    "submitted_to_lm_at": "2026-03-01T16:57:03.456Z",
    "response_received_at": "2026-03-01T16:57:04.306Z",
    "fix_applied_at": "2026-03-01T16:57:05.000Z",
    "test_passed_at": "2026-03-01T16:57:08.200Z",
    "committed_at": "2026-03-01T16:57:10.500Z"
  }
}
```

---

## Model Selection Logic

**Automatic Routing** (in bug_fix_agent.py):

```python
from lm_tracer import get_model_for_severity

severity = story.get("severity", "MEDIUM")
model = get_model_for_severity(severity)
# Returns: "gpt-4o" if CRITICAL, else "gpt-4o-mini"
```

**Decision Table**:

| Severity | Model | Cost Factor | Reason |
|----------|-------|-------------|--------|
| CRITICAL | gpt-4o | 10x | Quality > cost for high-risk bugs |
| HIGH | gpt-4o-mini | 1x | Sufficient for most bugs |
| MEDIUM | gpt-4o-mini | 1x | Default, cost-optimized |
| LOW | gpt-4o-mini | 1x | Simple fixes don't need GPT-4 |

**Override** (if needed):
```python
# Manually escalate to gpt-4o despite severity
model = "gpt-4o"  # Override logic
preferred_model = get_model_for_severity("CRITICAL", test_override=True)
```

---

## GitHub Models Free Tier Quota

**Copilot Free Plan**:
- **Rate limit**: 15 requests/min, 150 requests/day
- **Token limit**: 8K tokens/request
- **Status**: Rate-limited but FREE ✅

**SPRINT-0.5 Usage**:
- **Requests**: 9 (3 stories × 3 phases) = 6% of daily quota
- **Tokens**: ~3000 in + ~1500 out = 4500 total
- **Quota remaining**: 141 requests/day available

**Monitoring**:
```bash
# Check quota in logs after run
gh run view <id> --log | grep -i "quota\|rate"

# If approaching 80% (120 requests), consider batching sprints
# If at 95% (142.5 requests), pause and wait for daily reset (UTC midnight)
```

---

## LM Call Tracing

**Saved Location**: `.eva/traces/{story_id}-{phase}-lm-calls.json`

**File Contents** (example):
```json
{
  "correlation_id": "SPRINT-0.5-20260301165702-a1b2c3d4",
  "story_id": "BUG-F37-001",
  "phase": "A",
  "lm_calls": [
    {
      "model": "gpt-4o-mini",
      "prompt_hash": "sha256:abc123...",
      "response_hash": "sha256:def456...",
      "tokens_in": 245,
      "tokens_out": 89,
      "cost_usd": 0.00004345,
      "latency_ms": 850,
      "timestamp_start": "2026-03-01T16:57:03.456Z",
      "timestamp_end": "2026-03-01T16:57:04.306Z"
    }
  ],
  "summary": {
    "total_cost_usd": 0.00004345,
    "total_latency_ms": 850,
    "model_count": {"gpt-4o-mini": 1}
  }
}
```

**Query All Traces for Sprint**:
```bash
# Find all trace files
ls -la .eva/traces/BUG-F37-*.json

# Sum cost
cat .eva/traces/*/*/lm-calls.json | \
  jq -r '.summary.total_cost_usd' | \
  awk '{sum += $1} END {print "Total: $" sum}'
```

---

## Common Questions

**Q: Can I see the actual LLM prompt/response?**  
A: No (by design). We store hashes only to save cost + privacy. Prompts/responses are discarded after cost calculation. To replay, you'd need the original request parameters.

**Q: What if tokens_used is 0 in the old evidence files?**  
A: Old evidence files (pre-SPRINT-1) don't have tracing. SPRINT-1 fixes this. New evidence will have `lm_interaction.tokens_in/out/cost_usd`.

**Q: Can gpt-4.1 or gpt-3.5-turbo be used?**  
A: Not in current design (GitHub Models doesn't have them in free tier). Can add if user requests via BYOK Foundry path.

**Q: Is the cost calculation correct?**  
A: Yes, matches GitHub Models documentation exactly: `(tokens_in × input_multiplier + tokens_out × output_multiplier) × $0.00001`. Verified with examples.

**Q: Do I need to pay for Claude models now?**  
A: No. Claude is NOT in GitHub Models free tier. To use Claude (Haiku/Sonnet/Opus), you need Foundry BYOK or Anthropic API. Document in `.github/docs/FOUNDRY-BYOK.md` (Phase 2).

---

## Copy-Paste Commands

```bash
# Check correlation ID in logs
gh run view <id> --log | grep TRACE | head -5

# Verify traces created
ls -la .eva/traces/ | wc -l  # Should be 9 for SPRINT-0.5 (3×3)

# Check cost
cat .eva/traces/BUG-F37-001-A-lm-calls.json | jq '.summary'

# Show sprint cost breakdown
cat .eva/evidence/BUG-F37-*-receipt.json | jq '.lm_interaction | {model, cost_usd}'
```

---

## Schema Validation

**Validate all evidence against schema**:
```bash
python3 .github/scripts/validate-evidence.py .eva/evidence/

# Expected output:
# [OK] BUG-F37-001-receipt.json
# [OK] BUG-F37-002-receipt.json
# [OK] BUG-F37-003-receipt.json
# [PASS] 3/3 evidence files valid
```

**If validation fails**:
```bash
# Show which field is missing
python3 << 'EOF'
import json
from pathlib import Path
receipt = json.loads(Path(".eva/evidence/BUG-F37-001-receipt.json").read_text())
required = ["correlation_id", "story_id", "epic_id", "timeline", "lm_interaction"]
missing = [f for f in required if f not in receipt or not receipt[f]]
print(f"Missing: {missing}")
EOF
```

---

## Reference Files

| File | Purpose | Location |
|------|---------|----------|
| lm_tracer.py | Core tracing library | `.github/scripts/` |
| SPRINT-1-agent-tracing.md | Sprint design doc | `.github/sprints/` |
| evidence-schema.json | Validation schema | `.eva/` |
| INTEGRATION-LM-TRACING.md | How to integrate | `.eva-foundry/37-data-model/` |
| SPRINT-1-PHASE-1-CHECKLIST.md | Execution plan | `.github/` |


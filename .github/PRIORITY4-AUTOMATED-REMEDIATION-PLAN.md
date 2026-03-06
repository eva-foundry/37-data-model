# Priority #4: Automated Remediation Framework — Complete DPDCA Plan

**Date:** March 6, 2026  
**Session:** 34 (Planned)  
**Architecture:** Unified auto-remediation (agents + infrastructure + policy)  
**Scope:** L48-L51 (4 new layers) + supporting scripts + documentation

---

## DISCOVER PHASE — Current State Analysis

### Existing Data Sources (Triggers)

**L44 (agent_performance_metrics)**
- Agent reliability %, speed %, cost efficiency
- Performance ranking (peer comparison)
- Certifications (prod-ready? certified?)
- Issues: declining trend, low reliability (<75%), budget overrun

**L45 (deployment_quality_scores)**
- 5-dimensional grading: compliance/performance/safety/cost/speed
- Grade assignment (A+, A, B, C, D)
- Issues: D-grade deployments (failed compliance, low quality)

**L46 (agent_execution_history)**
- Execution outcomes (success/failure/denied)
- DPDCA decision reasoning
- Error logs, warnings
- Issues: failures, policy denials, timeouts

**L47 (performance_trends)**
- Weekly trend analysis (improving/declining)
- Anomaly detection (3σ deviation?)
- Peer comparison (rank #5 = needs support)
- Issues: downward trends, anomalies

**L33-L39 (governance + policies)**
- L33: agent_policies (auto-fix-eligible scenarios, thresholds)
- L35: quality_gates (what blocks deployment? what auto-remediates?)
- L36: deployment_policies (rollback triggers, auto-scale rules)
- L37: risk_controls (security constraints on auto-remediation)

### Remediation Gaps (What's Missing)

**Gap 1: No Remediation Policies**
- ✗ Which issues trigger automatic fixes?
- ✗ What's the remediation decision tree?
- ✗ Who can auto-remediate? (which agents, which policy?)
- ✗ What's the threshold? (e.g., reliability < 70% → auto-retrain)

**Gap 2: No Execution Audit Trail**
- ✗ What auto-fixes were attempted?
- ✗ Did they succeed? Fail? Why?
- ✗ What was the impact (MTTR, cost, safety)?
- ✗ Compliance trail (audit log for SOC2/HIPAA)

**Gap 3: No Effectiveness Tracking**
- ✗ % of issues resolved (auto vs manual)
- ✗ False positive rate (unnecessary fixes)
- ✗ Mean time to remediation (MTTR)
- ✗ Cost per remediation

**Gap 4: No Unified Framework**
- ✗ Agent self-healing disconnected from infrastructure remediation
- ✗ No policy enforcement integration
- ✗ No cross-layer decision making
- ✗ No feedback loop (remediation outcome → policy adjustment)

---

## PLAN PHASE — L48-L51 Design

### L48: `remediation_policies.json` — Decision Framework

**Purpose:** Define WHEN, HOW, and WHO auto-remedies

**Schema:**
```json
{
  "$metadata": {
    "layer_id": "L48",
    "version": "1.0.0",
    "created": "2026-03-06T21:00:00Z",
    "source": "EVA Governance Framework",
    "queryable_as": "/model/remediation_policies"
  },
  "remediation_policies": [
    {
      "policy_id": "policy:agent-performance-recovery",
      "policy_name": "Agent Performance Recovery",
      "scope": "agent_self_healing",
      "triggers": [
        {
          "metric": "reliability",
          "threshold": 75,
          "comparison": "less_than",
          "duration_minutes": 30,
          "condition": "reliability < 75% for 30+ minutes"
        },
        {
          "metric": "error_rate",
          "threshold": 5,
          "comparison": "greater_than",
          "duration_minutes": 10,
          "condition": "error rate > 5% for 10+ minutes"
        }
      ],
      "remediation_actions": [
        {
          "action_id": "action:restart-agent",
          "action_name": "Restart Agent",
          "order": 1,
          "command": "restart_container(agent_id)",
          "expected_impact": "Clear transient state, recover from deadlock",
          "estimated_duration_seconds": 30,
          "rollback_strategy": "restore_from_snapshot"
        },
        {
          "action_id": "action:reload-model",
          "action_name": "Reload Model Weights",
          "order": 2,
          "command": "reload_llm_model(agent_id)",
          "expected_impact": "Recover from corrupted state",
          "estimated_duration_seconds": 60,
          "rollback_strategy": "restore_from_backup"
        },
        {
          "action_id": "action:scale-down-concurrency",
          "action_name": "Reduce Concurrent Requests",
          "order": 3,
          "command": "set_concurrency_limit(agent_id, 2)",
          "expected_impact": "Reduce load while investigating",
          "estimated_duration_seconds": 5,
          "rollback_strategy": "restore_original_limit"
        }
      ],
      "approval_required": false,
      "auto_execute": true,
      "enabled": true,
      "priority": "high",
      "linked_policies": ["L33:agent-restart-policy", "L36:escalation-policy"],
      "created": "2026-03-06T21:00:00Z"
    },
    {
      "policy_id": "policy:infrastructure-autoscale",
      "policy_name": "Infrastructure Auto-Scale",
      "scope": "infrastructure_remediation",
      "triggers": [
        {
          "metric": "latency_p95",
          "threshold": 1000,
          "comparison": "greater_than",
          "duration_minutes": 5,
          "condition": "P95 latency > 1000ms for 5+ minutes"
        },
        {
          "metric": "container_cpu_percent",
          "threshold": 80,
          "comparison": "greater_than",
          "duration_minutes": 3,
          "condition": "CPU utilization > 80% for 3+ minutes"
        }
      ],
      "remediation_actions": [
        {
          "action_id": "action:increase-replicas",
          "action_name": "Add Container Replicas",
          "order": 1,
          "command": "scale_containerapp(app_id, replica_count += 1)",
          "expected_impact": "Distribute load, reduce latency",
          "estimated_duration_seconds": 120,
          "rollback_strategy": "scale_back_down"
        },
        {
          "action_id": "action:increase-sku",
          "action_name": "Upgrade Container SKU",
          "order": 2,
          "command": "upgrade_containerapp_sku(app_id, 'Premium')",
          "expected_impact": "Increase CPU/memory for single container",
          "estimated_duration_seconds": 300,
          "rollback_strategy": "downgrade_sku"
        }
      ],
      "approval_required": true,
      "auto_execute": false,
      "enabled": true,
      "priority": "medium",
      "linked_policies": ["L36:autoscale-policy", "L37:cost-control"],
      "cost_limits_usd_per_month": 500,
      "created": "2026-03-06T21:00:00Z"
    },
    {
      "policy_id": "policy:deployment-quality-gate",
      "policy_name": "Deployment Quality Auto-Gate",
      "scope": "policy_enforcement",
      "triggers": [
        {
          "metric": "deployment_quality_score",
          "threshold": 85,
          "comparison": "less_than",
          "condition": "quality grade < B (85/100)"
        },
        {
          "metric": "compliance_score",
          "threshold": 80,
          "comparison": "less_than",
          "condition": "compliance < 80%"
        }
      ],
      "remediation_actions": [
        {
          "action_id": "action:auto-deny-deployment",
          "action_name": "Auto-Deny Deployment",
          "order": 1,
          "command": "deny_deployment(deployment_id, reason='quality_gate_failed')",
          "expected_impact": "Prevent low-quality code reaching prod",
          "estimated_duration_seconds": 1,
          "rollback_strategy": "none"
        },
        {
          "action_id": "action:notify-team",
          "action_name": "Notify Engineering",
          "order": 2,
          "command": "send_notification(team_id, msg='Deployment blocked')",
          "expected_impact": "Prompt manual review",
          "estimated_duration_seconds": 5,
          "rollback_strategy": "none"
        }
      ],
      "approval_required": false,
      "auto_execute": true,
      "enabled": true,
      "priority": "critical",
      "linked_policies": ["L35:quality-gates", "L33:deployment-policy"],
      "created": "2026-03-06T21:00:00Z"
    }
  ],
  "policy_summary": {
    "total_policies": 3,
    "scope_breakdown": {
      "agent_self_healing": 1,
      "infrastructure_remediation": 1,
      "policy_enforcement": 1
    },
    "approval_required_count": 1,
    "auto_execute_count": 2,
    "enabled_count": 3
  }
}
```

---

### L49: `auto_fix_execution_history.json` — Audit Trail

**Purpose:** Track WHAT fixes were attempted, WHEN, WHO did it, and OUTCOME

**Records (Examples):**
- Auto-restart agent system:validator (2026-03-06 15:30 UTC) - SUCCESS
- Auto-scale from 1→2 replicas (2026-03-06 14:45 UTC) - PENDING_APPROVAL
- Auto-deny deployment deploy-20260306-xyz (2026-03-06 16:20 UTC) - AUTO_BLOCKED
- Auto-reload LLM model (2026-03-05 09:15 UTC) - FAILED (cost exceeded)

**Schema: 300+ lines covering:**
- Execution ID, timestamp, policy_id, action_id
- Trigger (what metric triggered it)
- Executed (yes/no), executor (system/manual)
- Outcome (success/failure/partial)
- Duration, cost, safety_violations
- Evidence trail (L33/L45/L46 correlation IDs)
- Rollback info (was it rolled back? why?)

---

### L50: `remediation_outcomes.json` — Impact Analytics

**Purpose:** Was the remediation effective?

**Metrics per remediation:**
- Issue resolved? (yes/no/partial)
- MTTR (mean time to remediation)
- Root cause fixed or just symptom?
- Side effects? (safety issues, false positives)
- User impact (downtime avoided, customers affected)

**Schema:**
- outcome_id, remediation_id, issue_id
- resolution_status (RESOLVED, PARTIAL, FAILED, REVERTED)
- mttr_minutes, root_cause_fixed (bool)
- side_effects[], safety_violations[]
- customer_impact_statement
- cost_savings_usd

---

### L51: `remediation_effectiveness.json` — Continuous Improvement

**Purpose:** How effective is our auto-remediation system?

**Metrics:**
- % of issues auto-resolved (vs manual fix)
- False positive rate (% of unnecessary fixes)
- MTTR improvement (auto vs manual)
- Cost per remediation
- Safety record (% with no negative side effects)
- Trend analysis (improving/stable/declining)

**Aggregations:**
- By policy (which policies work best?)
- By agent (which agents self-heal best?)
- By scope (agent-healing vs infra-auto-scale success rates)
- Time series (daily/weekly trends)

---

## DO PHASE — Implementation Preview

### Files to Create (7 total)

| # | File | Type | Purpose |
|---|------|------|---------|
| 1 | `model/remediation_policies.json` | Layer L48 | Policy decision framework |
| 2 | `model/auto_fix_execution_history.json` | Layer L49 | Execution audit trail |
| 3 | `model/remediation_outcomes.json` | Layer L50 | Impact analytics |
| 4 | `model/remediation_effectiveness.json` | Layer L51 | System metrics |
| 5 | `scripts/execute-auto-remediation.ps1` | Script | Trigger remediation actions (integrated with L48-L51) |
| 6 | `scripts/analyze-remediation-effectiveness.ps1` | Script | Generate effectiveness reports |
| 7 | `docs/remediation-framework-guide.md` | Documentation | How auto-remediation works + runbooks |

### Seed Data Strategy

**L48 (remediation_policies):**
- 3 policies: agent self-healing, infrastructure autoscale, policy enforcement
- Each with triggers, actions, thresholds, rollback strategies

**L49 (auto_fix_execution_history):**
- 8-10 execution records (mix of success/failure/pending)
- Examples: restart succeeded, scale pending approval, deploy auto-blocked

**L50 (remediation_outcomes):**
- 6-8 outcome records (showing MTTR, resolution %, side effects)
- Examples: resolved in 90s, partial (symptom fixed, root cause remains)

**L51 (remediation_effectiveness):**
- Weekly trend record (2026-02-27 to 2026-03-06)
- KPIs: 78% auto-resolution rate, 0.5% false positive, MTTR 95s
- By-policy breakdown, by-agent breakdown

### Advanced Features (DPDCA Integration)

**execute-auto-remediation.ps1 will implement:**
- PHASE 1 (DISCOVER): Load L48 policies, L44 metrics, L46 history
- PHASE 2 (PLAN): Match metrics to trigger thresholds, suggest actions
- PHASE 3 (DO): Execute approved actions, record to L49
- PHASE 4 (CHECK): Verify outcome (metric improved? no side effects?)
- PHASE 5 (ACT): Record in L49/L50/L51, update policy effectiveness

---

## CHECK PHASE — Validation Criteria

**L48 Validation:**
- ✓ All policies have: id, name, triggers[], actions[]
- ✓ Each trigger has: metric, threshold, comparison operator
- ✓ Each action has: command, rollback_strategy, estimated_duration
- ✓ Linked policies reference L33/L35/L36/L37

**L49 Validation:**
- ✓ All records have: execution_id, policy_id, timestamp, outcome
- ✓ Evidence trail has correlation IDs (L44/L45/L46 references)
- ✓ MTTR recorded for successful remediations
- ✓ Rollback info complete for failed attempts

**L50 Validation:**
- ✓ Outcome per execution ID matches L49 records
- ✓ MTTR in range 1-300 seconds (realistic)
- ✓ Root cause fixed reported accurately
- ✓ Safety violations documented

**L51 Validation:**
- ✓ Aggregated metrics mathematically accurate
- ✓ Trend indicators present (improving/stable/declining)
- ✓ Peer comparison working (which policy most effective?)
- ✓ Time series data complete (7-day history)

---

## ACT PHASE — Deployment

**Branch:** `feature/priority4-automated-remediation`  
**Commits:**
1. Create L48-L51 layers + seed data
2. Create execution + analysis scripts
3. Update documentation + integration guide
4. Final validation report

**Merge to main:** Ready after Session 34 DO→CHECK complete

---

## Architecture Diagram

```
L33-L39 (Governance)
    ↓
L48 (Remediation Policies) ← DECISION ENGINE
    ↓ [triggers match?]
L44-L47 (Performance Data) ← DATA SOURCE
    ↓ [thresholds exceeded?]
L49 (Auto-Fix History) ← EXECUTION LOG
    ↓ [actions taken]
L50 (Outcomes) ← IMPACT TRACKER
    ↓ [metrics improved?]
L51 (Effectiveness) ← CONTINUOUS IMPROVEMENT
    ↓ [feedback loop]
L48 (Policies Updated)
```

---

## Success Criteria (Proposed)

✅ **Session 34 Goal:**
- Create L48-L51 with complete seed data
- Implement 3 remediation scopes (agent + infra + policy)
- Build DPDCA scripts for unified execution
- Document complete framework
- Deploy to production as Revision 0000008

✅ **Production Goal (Post-Launch):**
- 80%+ auto-resolution rate
- <1% false positive rate
- MTTR < 2 minutes
- Zero safety violations (rollback capability)
- SOC2/HIPAA audit trail complete

---

## Timeline

**Session 34 (Estimated):**
- DISCOVER: 10 min ✓ (this document)
- PLAN: 15 min (design finalized above)
- DO: 30 min (create L48-L51 + scripts)
- CHECK: 10 min (validation)
- ACT: 10 min (commit + push)
- **Total: ~75 minutes**

**Ready to proceed?**

# Session 47: Security Schemas (P36 + P58) - Checkpoint

**Timestamp**: 2026-03-12 22:20 ET  
**Status**: Work in Progress  
**Next**: Ready for new layer definitions

---

## Completed

✅ **SCHEMA-REQUIREMENTS-P36-P58.md** (8,500+ lines)
- P36 requirements analysis (red-teaming, Promptfoo, 5 frameworks)
- P58 requirements analysis (vulnerability management, Pareto, remediation SLA)
- Mapping against 111-layer Data Model (all 12 domains)
- Unified deployment approach (10 new + 2 approved = 12 total)
- Implementation sequencing (~9 days, parallel workstreams)

✅ **Approved Existing Schemas** (2)
- `security_controls` (L22) — framework mapping
- `agent_performance_metrics` (L43) — metrics tracking

✅ **Rejected Workarounds → 10 New Dedicated Layers**
- **P36 (Red-Teaming)**: test_definitions_for_red_team, attack_tactic_catalog, ai_security_results, assertions_catalog, ai_security_metrics
- **P58 (Vulnerability Management)**: vulnerability_scan_results, infrastructure_cve_findings, risk_ranking_analysis, remediation_tasks, remediation_effectiveness_metrics

---

## Standing By

⏳ **New Layer Definitions** (JSON Schema Draft-07)
- Ready to create full schema definitions
- Ready to add examples + validation rules
- Ready to document relationships & indexes
- Ready to create API integration specs

---

## Next

1. Data Model team reviews + approves layer strategy
2. Layer definitions created (JSON Schema)
3. API routes + Cosmos DB integration
4. Integration tests
5. P36 + P58 development teams implement against new layers

---

**Document Location**: [SCHEMA-REQUIREMENTS-P36-P58.md](./SCHEMA-REQUIREMENTS-P36-P58.md)

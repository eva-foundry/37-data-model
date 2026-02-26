# EVA-STORY: F37-08-002
# Growth Path 2 -- Sprint-Close Audit (every sprint)
#
# EVIDENCE: scripts/validate-model.ps1  +  scripts/assemble-model.ps1
# At sprint close, the agent runs the write cycle:
#   POST /model/admin/commit  (export + assemble + validate in one call)
# which internally calls:
#   scripts/assemble-model.ps1  -- re-flatten all 27 layers to model/*.json
#   scripts/validate-model.ps1  -- cross-reference rules, exit 1 on FAIL
# The commit endpoint returns { status: "PASS", violation_count: 0 } when clean.
# Sprint is NOT closed with violations outstanding.
#
# Implemented: 2026-02-25 (session: validator hardening + T21 fix)

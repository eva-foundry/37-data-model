# EVA-STORY: F37-08-001
# Growth Path 1 -- Same-PR Rule (day-to-day)
#
# EVIDENCE: .github/workflows/validate-model.yml
# Every PR touching model/** or schema/** triggers the CI gate:
#   1. pwsh scripts/assemble-model.ps1  -- rebuild flat JSON from source
#   2. pwsh scripts/validate-model.ps1  -- cross-reference checks (exit 1 on violation)
# The workflow blocks merge if validate-model exits non-zero.
# This enforces the same-PR rule: no endpoint, container, or screen ships without
# a matching model entry and a green validation gate in the same pull request.
#
# Implemented: 2026-02-25 (session: DM-MAINT-WI-1 CI gate)

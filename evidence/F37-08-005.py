# EVA-STORY: F37-08-005
# Validation Gate (all paths)
#
# EVIDENCE: scripts/validate-model.ps1  +  .github/workflows/validate-model.yml
# Every growth path (day-to-day, sprint-close, ecosystem expansion, new layer)
# MUST pass through the validation gate before changes are merged:
#
#   Local:     pwsh scripts/assemble-model.ps1  &&  pwsh scripts/validate-model.ps1
#   API:       POST /model/admin/commit  -> { status: "PASS", violation_count: 0 }
#   CI:        .github/workflows/validate-model.yml (blocks PR merge on exit 1)
#
# Rules enforced by validate-model.ps1:
#   - Every endpoint cosmos_reads references a known container
#   - Every screen api_calls references a known endpoint id
#   - Optional fields (feature_flag, auth) handled safely under Set-StrictMode
#
# Implemented: 2026-02-25 (session: validator hardening -- Set-StrictMode fix)

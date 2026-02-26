# EVA-STORY: F37-08-007
# Governance
#
# EVIDENCE: .github/copilot-instructions.md  +  USER-GUIDE.md  +  api/dependencies.py
# Governance of the EVA Data Model is enforced at three levels:
#
# 1. AGENT PROTOCOL (copilot-instructions.md + USER-GUIDE.md)
#    - Agents MUST use the HTTP API; direct JSON file reads are FORBIDDEN
#    - Write cycle: PUT -> GET verify row_version -> POST /model/admin/commit
#    - Strip audit columns before PUT; use -Depth 10 for nested schemas
#    - X-Actor header required for audit trail (e.g. "agent:copilot")
#
# 2. ACCESS CONTROL (api/dependencies.py)
#    - require_admin: token-gated -- all mutation endpoints require Authorization header
#    - ADMIN_TOKEN must be non-default in production (DEV_MODE=false enforces this)
#    - Row versioning: every PUT increments row_version, enabling optimistic locking
#
# 3. CI GATE (.github/workflows/validate-model.yml)
#    - No PR merges with validation violations
#    - Human approval required for merge (branch protection)
#
# Implemented: 2026-02-25 (session: PROD-WI-6 admin token + dev_mode gate)

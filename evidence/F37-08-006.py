# EVA-STORY: F37-08-006
# Drift Signals -- How to Know the Model Is Stale
#
# EVIDENCE: api/routers/model.py  +  GET /model/impact/  +  GET /model/graph/
# Drift is detectable through the following signals:
#
#   1. Validation violations -- POST /model/admin/validate returns gap list
#      (e.g. endpoint references container that no longer exists)
#   2. Impact analysis -- GET /model/impact/?container=X returns all downstream
#      dependents; any item with no callers may indicate dead code
#   3. Graph traversal -- GET /model/graph/?node_id=X&depth=2 shows orphan nodes
#   4. CI gate failures -- validate-model.yml catches drift on every PR touching
#      source code (endpoints, screens, containers)
#   5. row_version skew -- objects not updated in multiple sprints signal stale data
#
# Implemented: 2026-02-25 (session: impact + graph endpoints confirmed in API)

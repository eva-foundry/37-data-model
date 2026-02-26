# EVA-STORY: F37-08-003
# Growth Path 3 -- Ecosystem Expansion (new service or repository)
#
# EVIDENCE: api/routers/admin.py  +  api/store/memory.py  +  scripts/seed-cosmos.py
# When a new service, agent, or repository joins the ecosystem:
#   1. Add a new entry to the appropriate layer JSON (e.g. model/services.json)
#   2. The MemoryStore auto-seeds from disk JSON on startup -- no migration needed
#   3. For Cosmos cold-deploy: scripts/seed-cosmos.py --layer <name> bootstraps
#      the new container from the disk JSON source of truth
#   4. CI gate validates the new entry satisfies schema and cross-references
#
# Implemented: 2026-02-25 (session: COS-4 seed-cosmos.py)

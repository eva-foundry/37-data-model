# EVA-STORY: F37-08-004
# Growth Path 4 -- New Model Layer (extending the schema)
#
# EVIDENCE: schema/*.schema.json  +  api/routers/admin.py (_LAYER_FILES registry)
# To add a new model layer:
#   1. Define schema/newlayer.schema.json (JSON Schema draft-07)
#   2. Create model/newlayer.json with initial entries
#   3. Register in api/routers/admin.py _LAYER_FILES dict
#   4. Add cross-reference rules to scripts/validate-model.ps1 if needed
#   5. Run POST /model/admin/commit to export + assemble + validate
# The API auto-discovers the new layer from _LAYER_FILES at startup.
# No DB migration required -- MemoryStore seeds from disk on every restart.
#
# Implemented: 2026-02-25 (session: foundation layer architecture)

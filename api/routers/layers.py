"""
Layer-specific routers — one file per layer, all backed by the generic factory.
The /model/endpoints router is special (see filter_endpoints.py).
"""
from api.routers.base_layer import make_layer_router

services_router       = make_layer_router("services",       "/model/services",       ["services"])
personas_router       = make_layer_router("personas",       "/model/personas",       ["personas"])
feature_flags_router  = make_layer_router("feature_flags",  "/model/feature_flags",  ["feature_flags"])
containers_router     = make_layer_router("containers",     "/model/containers",     ["containers"])
schemas_router        = make_layer_router("schemas",        "/model/schemas",        ["schemas"])
screens_router        = make_layer_router("screens",        "/model/screens",        ["screens"])
literals_router       = make_layer_router("literals",       "/model/literals",       ["literals"])
agents_router         = make_layer_router("agents",         "/model/agents",         ["agents"])
infra_router          = make_layer_router("infrastructure", "/model/infrastructure", ["infrastructure"])
requirements_router   = make_layer_router("requirements",   "/model/requirements",   ["requirements"])

# ── Control-plane catalog layers (EVA automation operating model) ─────────────
planes_router        = make_layer_router("planes",        "/model/planes",        ["planes"])
connections_router   = make_layer_router("connections",   "/model/connections",   ["connections"])
environments_router  = make_layer_router("environments",  "/model/environments",  ["environments"])
cp_skills_router     = make_layer_router("cp_skills",     "/model/cp_skills",     ["cp_skills"])
cp_agents_router     = make_layer_router("cp_agents",     "/model/cp_agents",     ["cp_agents"])
runbooks_router      = make_layer_router("runbooks",      "/model/runbooks",      ["runbooks"])
cp_workflows_router  = make_layer_router("cp_workflows",  "/model/cp_workflows",  ["cp_workflows"])
cp_policies_router   = make_layer_router("cp_policies",   "/model/cp_policies",   ["cp_policies"])

# ── Catalog extensions (precedence + new layers, DM-CAT) ─────────────────────────────
mc_servers_router      = make_layer_router("mcp_servers",      "/model/mcp_servers",      ["mcp_servers"])
prompts_router         = make_layer_router("prompts",          "/model/prompts",          ["prompts"])
sec_controls_router    = make_layer_router("security_controls", "/model/security_controls", ["security_controls"])
# ── Frontend object layers (E-01/E-02/E-03) ───────────────────────────────────────────
components_router      = make_layer_router("components",       "/model/components",       ["components"])
hooks_router           = make_layer_router("hooks",            "/model/hooks",            ["hooks"])
ts_types_router        = make_layer_router("ts_types",         "/model/ts_types",         ["ts_types"])

# ── Project plane (E-07/E-08) — waterfall WBS + agile scrum + CI/CD linkage ──────────
projects_router        = make_layer_router("projects",         "/model/projects",         ["projects"])
wbs_router             = make_layer_router("wbs",              "/model/wbs",              ["wbs"])
sprints_router         = make_layer_router("sprints",          "/model/sprints",          ["sprints"])
milestones_router      = make_layer_router("milestones",       "/model/milestones",       ["milestones"])
risks_router           = make_layer_router("risks",            "/model/risks",            ["risks"])
decisions_router       = make_layer_router("decisions",        "/model/decisions",        ["decisions"])
traces_router          = make_layer_router("traces",           "/model/traces",           ["traces"])
# ── Observability plane (L11) — captures proof-of-completion + call tracing ──────────
evidence_router        = make_layer_router("evidence",         "/model/evidence",         ["evidence"])
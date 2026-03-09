"""
Layer-specific routers — one file per layer, all backed by the generic factory.
The /model/endpoints router is special (see filter_endpoints.py).
"""
from api.routers.base_layer import make_layer_router

services_router = make_layer_router(
    "services", "/model/services", ["services"])
personas_router = make_layer_router(
    "personas", "/model/personas", ["personas"])
feature_flags_router = make_layer_router(
    "feature_flags", "/model/feature_flags", ["feature_flags"])
containers_router = make_layer_router(
    "containers", "/model/containers", ["containers"])
schemas_router = make_layer_router("schemas", "/model/schemas", ["schemas"])
screens_router = make_layer_router("screens", "/model/screens", ["screens"])
literals_router = make_layer_router(
    "literals", "/model/literals", ["literals"])
agents_router = make_layer_router("agents", "/model/agents", ["agents"])
infra_router = make_layer_router(
    "infrastructure", "/model/infrastructure", ["infrastructure"])
requirements_router = make_layer_router(
    "requirements", "/model/requirements", ["requirements"])

# ── Control-plane catalog layers (EVA automation operating model) ───────
planes_router = make_layer_router("planes", "/model/planes", ["planes"])
connections_router = make_layer_router(
    "connections", "/model/connections", ["connections"])
environments_router = make_layer_router(
    "environments", "/model/environments", ["environments"])
cp_skills_router = make_layer_router(
    "cp_skills", "/model/cp_skills", ["cp_skills"])
cp_agents_router = make_layer_router(
    "cp_agents", "/model/cp_agents", ["cp_agents"])
runbooks_router = make_layer_router(
    "runbooks", "/model/runbooks", ["runbooks"])
cp_workflows_router = make_layer_router(
    "cp_workflows", "/model/cp_workflows", ["cp_workflows"])
cp_policies_router = make_layer_router(
    "cp_policies", "/model/cp_policies", ["cp_policies"])

# ── Catalog extensions (precedence + new layers, DM-CAT) ────────────────
mc_servers_router = make_layer_router(
    "mcp_servers", "/model/mcp_servers", ["mcp_servers"])
prompts_router = make_layer_router("prompts", "/model/prompts", ["prompts"])
sec_controls_router = make_layer_router(
    "security_controls", "/model/security_controls", ["security_controls"])
# ── Frontend object layers (E-01/E-02/E-03) ─────────────────────────────
components_router = make_layer_router(
    "components", "/model/components", ["components"])
hooks_router = make_layer_router("hooks", "/model/hooks", ["hooks"])
ts_types_router = make_layer_router(
    "ts_types", "/model/ts_types", ["ts_types"])

# ── Project plane (E-07/E-08) — waterfall WBS + agile scrum + CI/CD linka
projects_router = make_layer_router(
    "projects", "/model/projects", ["projects"])
wbs_router = make_layer_router("wbs", "/model/wbs", ["wbs"])
sprints_router = make_layer_router("sprints", "/model/sprints", ["sprints"])
milestones_router = make_layer_router(
    "milestones", "/model/milestones", ["milestones"])
risks_router = make_layer_router("risks", "/model/risks", ["risks"])
decisions_router = make_layer_router(
    "decisions", "/model/decisions", ["decisions"])
traces_router = make_layer_router("traces", "/model/traces", ["traces"])
# ── Observability plane (L11) — captures proof-of-completion + call traci
evidence_router = make_layer_router(
    "evidence", "/model/evidence", ["evidence"])
# ── Governance plane (L32-L35) — data-model-first architecture + agent automation safety ────
workspace_config_router = make_layer_router(
    "workspace_config", "/model/workspace_config", ["workspace_config"])
project_work_router = make_layer_router(
    "project_work", "/model/project_work", ["project_work"])
agent_policies_router = make_layer_router(
    "agent_policies", "/model/agent_policies", ["agent_policies"])
quality_gates_router = make_layer_router(
    "quality_gates", "/model/quality_gates", ["quality_gates"])
# ── Deployment & Testing (L36-L38) — deployment policies + testing automation + validation rules ──
github_rules_router = make_layer_router(
    "github_rules", "/model/github_rules", ["github_rules"])
deployment_policies_router = make_layer_router(
    "deployment_policies",
    "/model/deployment_policies",
    ["deployment_policies"])
testing_policies_router = make_layer_router(
    "testing_policies", "/model/testing_policies", ["testing_policies"])
validation_rules_router = make_layer_router(
    "validation_rules", "/model/validation_rules", ["validation_rules"])

# ── Infrastructure Monitoring Plane (L40-L49, Priority #4) ──────────────
agent_execution_history_router = make_layer_router(
    "agent_execution_history",
    "/model/agent_execution_history",
    ["agent_execution_history"])
agent_performance_metrics_router = make_layer_router(
    "agent_performance_metrics",
    "/model/agent_performance_metrics",
    ["agent_performance_metrics"])
azure_infrastructure_router = make_layer_router(
    "azure_infrastructure",
    "/model/azure_infrastructure",
    ["azure_infrastructure"])
compliance_audit_router = make_layer_router(
    "compliance_audit", "/model/compliance_audit", ["compliance_audit"])
deployment_quality_scores_router = make_layer_router(
    "deployment_quality_scores",
    "/model/deployment_quality_scores",
    ["deployment_quality_scores"])
deployment_records_router = make_layer_router(
    "deployment_records", "/model/deployment_records", ["deployment_records"])
eva_model_router = make_layer_router(
    "eva_model", "/model/eva_model", ["eva_model"])
infrastructure_drift_router = make_layer_router(
    "infrastructure_drift",
    "/model/infrastructure_drift",
    ["infrastructure_drift"])
performance_trends_router = make_layer_router(
    "performance_trends", "/model/performance_trends", ["performance_trends"])
resource_costs_router = make_layer_router(
    "resource_costs", "/model/resource_costs", ["resource_costs"])

# Priority #4 automated remediation layers (L48-L51)
remediation_policies_router = make_layer_router(
    "remediation_policies",
    "/model/remediation_policies",
    ["remediation_policies"])
auto_fix_execution_history_router = make_layer_router(
    "auto_fix_execution_history",
    "/model/auto_fix_execution_history",
    ["auto_fix_execution_history"])
remediation_outcomes_router = make_layer_router(
    "remediation_outcomes",
    "/model/remediation_outcomes",
    ["remediation_outcomes"])
remediation_effectiveness_router = make_layer_router(
    "remediation_effectiveness",
    "/model/remediation_effectiveness",
    ["remediation_effectiveness"])

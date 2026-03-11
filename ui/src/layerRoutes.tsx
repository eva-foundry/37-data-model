/**
 * layerRoutes.tsx -- Unified route configuration for EVA Data Model Portal
 * Includes: 111 Data Model CRUD layers + Admin + Portal + Accelerator pages
 * Generated: 2026-03-11 08:31:41 ET (layers) + 2026-03-11 08:45:00 ET (unified)
 * Generator: Nested DPDCA L3 Portal Integration
 */
import React, { Suspense } from 'react';

// Lazy-loaded layer views (code-split per layer)
const AgentExecutionHistoryListView = React.lazy(() => import('./pages/agent_execution_history/AgentExecutionHistoryListView'));
const AgentPerformanceMetricsListView = React.lazy(() => import('./pages/agent_performance_metrics/AgentPerformanceMetricsListView'));
const AgentPoliciesListView = React.lazy(() => import('./pages/agent_policies/AgentPoliciesListView'));
const AgenticWorkflowsListView = React.lazy(() => import('./pages/agentic_workflows/AgenticWorkflowsListView'));
const AgentsListView = React.lazy(() => import('./pages/agents/AgentsListView'));
const ApiContractsListView = React.lazy(() => import('./pages/api_contracts/ApiContractsListView'));
const ArchitectureDecisionsListView = React.lazy(() => import('./pages/architecture_decisions/ArchitectureDecisionsListView'));
const AutoFixExecutionHistoryListView = React.lazy(() => import('./pages/auto_fix_execution_history/AutoFixExecutionHistoryListView'));
const AzureInfrastructureListView = React.lazy(() => import('./pages/azure_infrastructure/AzureInfrastructureListView'));
const CiCdPipelinesListView = React.lazy(() => import('./pages/ci_cd_pipelines/CiCdPipelinesListView'));
const ComplianceAuditListView = React.lazy(() => import('./pages/compliance_audit/ComplianceAuditListView'));
const ComponentsListView = React.lazy(() => import('./pages/components/ComponentsListView'));
const ConfigDefsListView = React.lazy(() => import('./pages/config_defs/ConfigDefsListView'));
const ConnectionsListView = React.lazy(() => import('./pages/connections/ConnectionsListView'));
const ContainersListView = React.lazy(() => import('./pages/containers/ContainersListView'));
const CostAllocationListView = React.lazy(() => import('./pages/cost_allocation/CostAllocationListView'));
const CostTrackingListView = React.lazy(() => import('./pages/cost_tracking/CostTrackingListView'));
const CoverageSummaryListView = React.lazy(() => import('./pages/coverage_summary/CoverageSummaryListView'));
const CpAgentsListView = React.lazy(() => import('./pages/cp_agents/CpAgentsListView'));
const CpPoliciesListView = React.lazy(() => import('./pages/cp_policies/CpPoliciesListView'));
const CpSkillsListView = React.lazy(() => import('./pages/cp_skills/CpSkillsListView'));
const CpWorkflowsListView = React.lazy(() => import('./pages/cp_workflows/CpWorkflowsListView'));
const DecisionProvenanceListView = React.lazy(() => import('./pages/decision_provenance/DecisionProvenanceListView'));
const DecisionsListView = React.lazy(() => import('./pages/decisions/DecisionsListView'));
const DeploymentHistoryListView = React.lazy(() => import('./pages/deployment_history/DeploymentHistoryListView'));
const DeploymentPoliciesListView = React.lazy(() => import('./pages/deployment_policies/DeploymentPoliciesListView'));
const DeploymentQualityScoresListView = React.lazy(() => import('./pages/deployment_quality_scores/DeploymentQualityScoresListView'));
const DeploymentRecordsListView = React.lazy(() => import('./pages/deployment_records/DeploymentRecordsListView'));
const DeploymentTargetsListView = React.lazy(() => import('./pages/deployment_targets/DeploymentTargetsListView'));
const EndpointListView = React.lazy(() => import('./pages/endpoints/EndpointListView'));
const EnvVarsListView = React.lazy(() => import('./pages/env_vars/EnvVarsListView'));
const EnvironmentsListView = React.lazy(() => import('./pages/environments/EnvironmentsListView'));
const ErrorCatalogListView = React.lazy(() => import('./pages/error_catalog/ErrorCatalogListView'));
const EvaModelListView = React.lazy(() => import('./pages/eva_model/EvaModelListView'));
const EvidenceListView = React.lazy(() => import('./pages/evidence/EvidenceListView'));
const EvidenceCorrelationListView = React.lazy(() => import('./pages/evidence_correlation/EvidenceCorrelationListView'));
const FeatureFlagsListView = React.lazy(() => import('./pages/feature_flags/FeatureFlagsListView'));
const GithubRulesListView = React.lazy(() => import('./pages/github_rules/GithubRulesListView'));
const HooksListView = React.lazy(() => import('./pages/hooks/HooksListView'));
const InfrastructureListView = React.lazy(() => import('./pages/infrastructure/InfrastructureListView'));
const InfrastructureDriftListView = React.lazy(() => import('./pages/infrastructure_drift/InfrastructureDriftListView'));
const InfrastructureEventsListView = React.lazy(() => import('./pages/infrastructure_events/InfrastructureEventsListView'));
const InstructionsListView = React.lazy(() => import('./pages/instructions/InstructionsListView'));
const LiteralsListView = React.lazy(() => import('./pages/literals/LiteralsListView'));
const McpServersListView = React.lazy(() => import('./pages/mcp_servers/McpServersListView'));
const MilestonesListView = React.lazy(() => import('./pages/milestones/MilestonesListView'));
const ModelTelemetryListView = React.lazy(() => import('./pages/model_telemetry/ModelTelemetryListView'));
const PerformanceTrendsListView = React.lazy(() => import('./pages/performance_trends/PerformanceTrendsListView'));
const PersonasListView = React.lazy(() => import('./pages/personas/PersonasListView'));
const PlanesListView = React.lazy(() => import('./pages/planes/PlanesListView'));
const ProjectWorkListView = React.lazy(() => import('./pages/project_work/ProjectWorkListView'));
const ProjectListView = React.lazy(() => import('./pages/projects/ProjectListView'));
const PromptsListView = React.lazy(() => import('./pages/prompts/PromptsListView'));
const QualityGatesListView = React.lazy(() => import('./pages/quality_gates/QualityGatesListView'));
const RemediationEffectivenessListView = React.lazy(() => import('./pages/remediation_effectiveness/RemediationEffectivenessListView'));
const RemediationOutcomesListView = React.lazy(() => import('./pages/remediation_outcomes/RemediationOutcomesListView'));
const RemediationPoliciesListView = React.lazy(() => import('./pages/remediation_policies/RemediationPoliciesListView'));
const ReposListView = React.lazy(() => import('./pages/repos/ReposListView'));
const RequestResponseSamplesListView = React.lazy(() => import('./pages/request_response_samples/RequestResponseSamplesListView'));
const RequirementsListView = React.lazy(() => import('./pages/requirements/RequirementsListView'));
const ResourceCostsListView = React.lazy(() => import('./pages/resource_costs/ResourceCostsListView'));
const ResourceInventoryListView = React.lazy(() => import('./pages/resource_inventory/ResourceInventoryListView'));
const RisksListView = React.lazy(() => import('./pages/risks/RisksListView'));
const RunbooksListView = React.lazy(() => import('./pages/runbooks/RunbooksListView'));
const RuntimeConfigListView = React.lazy(() => import('./pages/runtime_config/RuntimeConfigListView'));
const SchemasListView = React.lazy(() => import('./pages/schemas/SchemasListView'));
const ScreensListView = React.lazy(() => import('./pages/screens/ScreensListView'));
const SecretsCatalogListView = React.lazy(() => import('./pages/secrets_catalog/SecretsCatalogListView'));
const SecurityControlsListView = React.lazy(() => import('./pages/security_controls/SecurityControlsListView'));
const ServiceHealthMetricsListView = React.lazy(() => import('./pages/service_health_metrics/ServiceHealthMetricsListView'));
const ServicesListView = React.lazy(() => import('./pages/services/ServicesListView'));
const SessionTranscriptsListView = React.lazy(() => import('./pages/session_transcripts/SessionTranscriptsListView'));
const SprintListView = React.lazy(() => import('./pages/sprints/SprintListView'));
const StoryListView = React.lazy(() => import('./pages/stories/StoryListView'));
const SyntheticTestsListView = React.lazy(() => import('./pages/synthetic_tests/SyntheticTestsListView'));
const TaskListView = React.lazy(() => import('./pages/tasks/TaskListView'));
const TechStackListView = React.lazy(() => import('./pages/tech_stack/TechStackListView'));
const TestCasesListView = React.lazy(() => import('./pages/test_cases/TestCasesListView'));
const TestingPoliciesListView = React.lazy(() => import('./pages/testing_policies/TestingPoliciesListView'));
const TracesListView = React.lazy(() => import('./pages/traces/TracesListView'));
const TsTypesListView = React.lazy(() => import('./pages/ts_types/TsTypesListView'));
const UsageMetricsListView = React.lazy(() => import('./pages/usage_metrics/UsageMetricsListView'));
const ValidationRulesListView = React.lazy(() => import('./pages/validation_rules/ValidationRulesListView'));
const VerificationRecordsListView = React.lazy(() => import('./pages/verification_records/VerificationRecordsListView'));
const WbsItemListView = React.lazy(() => import('./pages/wbs/WbsItemListView'));
const WorkDecisionRecordsListView = React.lazy(() => import('./pages/work_decision_records/WorkDecisionRecordsListView'));
const WorkExecutionUnitsListView = React.lazy(() => import('./pages/work_execution_units/WorkExecutionUnitsListView'));
const WorkFactoryCapabilitiesListView = React.lazy(() => import('./pages/work_factory_capabilities/WorkFactoryCapabilitiesListView'));
const WorkFactoryGovernanceListView = React.lazy(() => import('./pages/work_factory_governance/WorkFactoryGovernanceListView'));
const WorkFactoryInvestmentsListView = React.lazy(() => import('./pages/work_factory_investments/WorkFactoryInvestmentsListView'));
const WorkFactoryMetricsListView = React.lazy(() => import('./pages/work_factory_metrics/WorkFactoryMetricsListView'));
const WorkFactoryPortfolioListView = React.lazy(() => import('./pages/work_factory_portfolio/WorkFactoryPortfolioListView'));
const WorkFactoryRoadmapsListView = React.lazy(() => import('./pages/work_factory_roadmaps/WorkFactoryRoadmapsListView'));
const WorkFactoryServicesListView = React.lazy(() => import('./pages/work_factory_services/WorkFactoryServicesListView'));
const WorkLearningFeedbackListView = React.lazy(() => import('./pages/work_learning_feedback/WorkLearningFeedbackListView'));
const WorkObligationsListView = React.lazy(() => import('./pages/work_obligations/WorkObligationsListView'));
const WorkOutcomesListView = React.lazy(() => import('./pages/work_outcomes/WorkOutcomesListView'));
const WorkPatternApplicationsListView = React.lazy(() => import('./pages/work_pattern_applications/WorkPatternApplicationsListView'));
const WorkPatternPerformanceProfilesListView = React.lazy(() => import('./pages/work_pattern_performance_profiles/WorkPatternPerformanceProfilesListView'));
const WorkReusablePatternsListView = React.lazy(() => import('./pages/work_reusable_patterns/WorkReusablePatternsListView'));
const WorkServiceBreachesListView = React.lazy(() => import('./pages/work_service_breaches/WorkServiceBreachesListView'));
const WorkServiceLevelObjectivesListView = React.lazy(() => import('./pages/work_service_level_objectives/WorkServiceLevelObjectivesListView'));
const WorkServiceLifecycleListView = React.lazy(() => import('./pages/work_service_lifecycle/WorkServiceLifecycleListView'));
const WorkServicePerfProfilesListView = React.lazy(() => import('./pages/work_service_perf_profiles/WorkServicePerfProfilesListView'));
const WorkServiceRemediationPlansListView = React.lazy(() => import('./pages/work_service_remediation_plans/WorkServiceRemediationPlansListView'));
const WorkServiceRequestsListView = React.lazy(() => import('./pages/work_service_requests/WorkServiceRequestsListView'));
const WorkServiceRevalidationResultsListView = React.lazy(() => import('./pages/work_service_revalidation_results/WorkServiceRevalidationResultsListView'));
const WorkServiceRunsListView = React.lazy(() => import('./pages/work_service_runs/WorkServiceRunsListView'));
const WorkStepEventsListView = React.lazy(() => import('./pages/work_step_events/WorkStepEventsListView'));
const WorkflowMetricsListView = React.lazy(() => import('./pages/workflow_metrics/WorkflowMetricsListView'));
const WorkspaceConfigListView = React.lazy(() => import('./pages/workspace_config/WorkspaceConfigListView'));

// Route definitions
export const layerRoutes = [
  { path: '/agent_execution_history', element: <Suspense fallback={<div>Loading...</div>}><AgentExecutionHistoryListView /></Suspense> },
  { path: '/agent_performance_metrics', element: <Suspense fallback={<div>Loading...</div>}><AgentPerformanceMetricsListView /></Suspense> },
  { path: '/agent_policies', element: <Suspense fallback={<div>Loading...</div>}><AgentPoliciesListView /></Suspense> },
  { path: '/agentic_workflows', element: <Suspense fallback={<div>Loading...</div>}><AgenticWorkflowsListView /></Suspense> },
  { path: '/agents', element: <Suspense fallback={<div>Loading...</div>}><AgentsListView /></Suspense> },
  { path: '/api_contracts', element: <Suspense fallback={<div>Loading...</div>}><ApiContractsListView /></Suspense> },
  { path: '/architecture_decisions', element: <Suspense fallback={<div>Loading...</div>}><ArchitectureDecisionsListView /></Suspense> },
  { path: '/auto_fix_execution_history', element: <Suspense fallback={<div>Loading...</div>}><AutoFixExecutionHistoryListView /></Suspense> },
  { path: '/azure_infrastructure', element: <Suspense fallback={<div>Loading...</div>}><AzureInfrastructureListView /></Suspense> },
  { path: '/ci_cd_pipelines', element: <Suspense fallback={<div>Loading...</div>}><CiCdPipelinesListView /></Suspense> },
  { path: '/compliance_audit', element: <Suspense fallback={<div>Loading...</div>}><ComplianceAuditListView /></Suspense> },
  { path: '/components', element: <Suspense fallback={<div>Loading...</div>}><ComponentsListView /></Suspense> },
  { path: '/config_defs', element: <Suspense fallback={<div>Loading...</div>}><ConfigDefsListView /></Suspense> },
  { path: '/connections', element: <Suspense fallback={<div>Loading...</div>}><ConnectionsListView /></Suspense> },
  { path: '/containers', element: <Suspense fallback={<div>Loading...</div>}><ContainersListView /></Suspense> },
  { path: '/cost_allocation', element: <Suspense fallback={<div>Loading...</div>}><CostAllocationListView /></Suspense> },
  { path: '/cost_tracking', element: <Suspense fallback={<div>Loading...</div>}><CostTrackingListView /></Suspense> },
  { path: '/coverage_summary', element: <Suspense fallback={<div>Loading...</div>}><CoverageSummaryListView /></Suspense> },
  { path: '/cp_agents', element: <Suspense fallback={<div>Loading...</div>}><CpAgentsListView /></Suspense> },
  { path: '/cp_policies', element: <Suspense fallback={<div>Loading...</div>}><CpPoliciesListView /></Suspense> },
  { path: '/cp_skills', element: <Suspense fallback={<div>Loading...</div>}><CpSkillsListView /></Suspense> },
  { path: '/cp_workflows', element: <Suspense fallback={<div>Loading...</div>}><CpWorkflowsListView /></Suspense> },
  { path: '/decision_provenance', element: <Suspense fallback={<div>Loading...</div>}><DecisionProvenanceListView /></Suspense> },
  { path: '/decisions', element: <Suspense fallback={<div>Loading...</div>}><DecisionsListView /></Suspense> },
  { path: '/deployment_history', element: <Suspense fallback={<div>Loading...</div>}><DeploymentHistoryListView /></Suspense> },
  { path: '/deployment_policies', element: <Suspense fallback={<div>Loading...</div>}><DeploymentPoliciesListView /></Suspense> },
  { path: '/deployment_quality_scores', element: <Suspense fallback={<div>Loading...</div>}><DeploymentQualityScoresListView /></Suspense> },
  { path: '/deployment_records', element: <Suspense fallback={<div>Loading...</div>}><DeploymentRecordsListView /></Suspense> },
  { path: '/deployment_targets', element: <Suspense fallback={<div>Loading...</div>}><DeploymentTargetsListView /></Suspense> },
  { path: '/endpoints', element: <Suspense fallback={<div>Loading...</div>}><EndpointListView /></Suspense> },
  { path: '/env_vars', element: <Suspense fallback={<div>Loading...</div>}><EnvVarsListView /></Suspense> },
  { path: '/environments', element: <Suspense fallback={<div>Loading...</div>}><EnvironmentsListView /></Suspense> },
  { path: '/error_catalog', element: <Suspense fallback={<div>Loading...</div>}><ErrorCatalogListView /></Suspense> },
  { path: '/eva_model', element: <Suspense fallback={<div>Loading...</div>}><EvaModelListView /></Suspense> },
  { path: '/evidence', element: <Suspense fallback={<div>Loading...</div>}><EvidenceListView /></Suspense> },
  { path: '/evidence_correlation', element: <Suspense fallback={<div>Loading...</div>}><EvidenceCorrelationListView /></Suspense> },
  { path: '/feature_flags', element: <Suspense fallback={<div>Loading...</div>}><FeatureFlagsListView /></Suspense> },
  { path: '/github_rules', element: <Suspense fallback={<div>Loading...</div>}><GithubRulesListView /></Suspense> },
  { path: '/hooks', element: <Suspense fallback={<div>Loading...</div>}><HooksListView /></Suspense> },
  { path: '/infrastructure', element: <Suspense fallback={<div>Loading...</div>}><InfrastructureListView /></Suspense> },
  { path: '/infrastructure_drift', element: <Suspense fallback={<div>Loading...</div>}><InfrastructureDriftListView /></Suspense> },
  { path: '/infrastructure_events', element: <Suspense fallback={<div>Loading...</div>}><InfrastructureEventsListView /></Suspense> },
  { path: '/instructions', element: <Suspense fallback={<div>Loading...</div>}><InstructionsListView /></Suspense> },
  { path: '/literals', element: <Suspense fallback={<div>Loading...</div>}><LiteralsListView /></Suspense> },
  { path: '/mcp_servers', element: <Suspense fallback={<div>Loading...</div>}><McpServersListView /></Suspense> },
  { path: '/milestones', element: <Suspense fallback={<div>Loading...</div>}><MilestonesListView /></Suspense> },
  { path: '/model_telemetry', element: <Suspense fallback={<div>Loading...</div>}><ModelTelemetryListView /></Suspense> },
  { path: '/performance_trends', element: <Suspense fallback={<div>Loading...</div>}><PerformanceTrendsListView /></Suspense> },
  { path: '/personas', element: <Suspense fallback={<div>Loading...</div>}><PersonasListView /></Suspense> },
  { path: '/planes', element: <Suspense fallback={<div>Loading...</div>}><PlanesListView /></Suspense> },
  { path: '/project_work', element: <Suspense fallback={<div>Loading...</div>}><ProjectWorkListView /></Suspense> },
  { path: '/projects', element: <Suspense fallback={<div>Loading...</div>}><ProjectListView /></Suspense> },
  { path: '/prompts', element: <Suspense fallback={<div>Loading...</div>}><PromptsListView /></Suspense> },
  { path: '/quality_gates', element: <Suspense fallback={<div>Loading...</div>}><QualityGatesListView /></Suspense> },
  { path: '/remediation_effectiveness', element: <Suspense fallback={<div>Loading...</div>}><RemediationEffectivenessListView /></Suspense> },
  { path: '/remediation_outcomes', element: <Suspense fallback={<div>Loading...</div>}><RemediationOutcomesListView /></Suspense> },
  { path: '/remediation_policies', element: <Suspense fallback={<div>Loading...</div>}><RemediationPoliciesListView /></Suspense> },
  { path: '/repos', element: <Suspense fallback={<div>Loading...</div>}><ReposListView /></Suspense> },
  { path: '/request_response_samples', element: <Suspense fallback={<div>Loading...</div>}><RequestResponseSamplesListView /></Suspense> },
  { path: '/requirements', element: <Suspense fallback={<div>Loading...</div>}><RequirementsListView /></Suspense> },
  { path: '/resource_costs', element: <Suspense fallback={<div>Loading...</div>}><ResourceCostsListView /></Suspense> },
  { path: '/resource_inventory', element: <Suspense fallback={<div>Loading...</div>}><ResourceInventoryListView /></Suspense> },
  { path: '/risks', element: <Suspense fallback={<div>Loading...</div>}><RisksListView /></Suspense> },
  { path: '/runbooks', element: <Suspense fallback={<div>Loading...</div>}><RunbooksListView /></Suspense> },
  { path: '/runtime_config', element: <Suspense fallback={<div>Loading...</div>}><RuntimeConfigListView /></Suspense> },
  { path: '/schemas', element: <Suspense fallback={<div>Loading...</div>}><SchemasListView /></Suspense> },
  { path: '/screens', element: <Suspense fallback={<div>Loading...</div>}><ScreensListView /></Suspense> },
  { path: '/secrets_catalog', element: <Suspense fallback={<div>Loading...</div>}><SecretsCatalogListView /></Suspense> },
  { path: '/security_controls', element: <Suspense fallback={<div>Loading...</div>}><SecurityControlsListView /></Suspense> },
  { path: '/service_health_metrics', element: <Suspense fallback={<div>Loading...</div>}><ServiceHealthMetricsListView /></Suspense> },
  { path: '/services', element: <Suspense fallback={<div>Loading...</div>}><ServicesListView /></Suspense> },
  { path: '/session_transcripts', element: <Suspense fallback={<div>Loading...</div>}><SessionTranscriptsListView /></Suspense> },
  { path: '/sprints', element: <Suspense fallback={<div>Loading...</div>}><SprintListView /></Suspense> },
  { path: '/stories', element: <Suspense fallback={<div>Loading...</div>}><StoryListView /></Suspense> },
  { path: '/synthetic_tests', element: <Suspense fallback={<div>Loading...</div>}><SyntheticTestsListView /></Suspense> },
  { path: '/tasks', element: <Suspense fallback={<div>Loading...</div>}><TaskListView /></Suspense> },
  { path: '/tech_stack', element: <Suspense fallback={<div>Loading...</div>}><TechStackListView /></Suspense> },
  { path: '/test_cases', element: <Suspense fallback={<div>Loading...</div>}><TestCasesListView /></Suspense> },
  { path: '/testing_policies', element: <Suspense fallback={<div>Loading...</div>}><TestingPoliciesListView /></Suspense> },
  { path: '/traces', element: <Suspense fallback={<div>Loading...</div>}><TracesListView /></Suspense> },
  { path: '/ts_types', element: <Suspense fallback={<div>Loading...</div>}><TsTypesListView /></Suspense> },
  { path: '/usage_metrics', element: <Suspense fallback={<div>Loading...</div>}><UsageMetricsListView /></Suspense> },
  { path: '/validation_rules', element: <Suspense fallback={<div>Loading...</div>}><ValidationRulesListView /></Suspense> },
  { path: '/verification_records', element: <Suspense fallback={<div>Loading...</div>}><VerificationRecordsListView /></Suspense> },
  { path: '/wbs', element: <Suspense fallback={<div>Loading...</div>}><WbsItemListView /></Suspense> },
  { path: '/work_decision_records', element: <Suspense fallback={<div>Loading...</div>}><WorkDecisionRecordsListView /></Suspense> },
  { path: '/work_execution_units', element: <Suspense fallback={<div>Loading...</div>}><WorkExecutionUnitsListView /></Suspense> },
  { path: '/work_factory_capabilities', element: <Suspense fallback={<div>Loading...</div>}><WorkFactoryCapabilitiesListView /></Suspense> },
  { path: '/work_factory_governance', element: <Suspense fallback={<div>Loading...</div>}><WorkFactoryGovernanceListView /></Suspense> },
  { path: '/work_factory_investments', element: <Suspense fallback={<div>Loading...</div>}><WorkFactoryInvestmentsListView /></Suspense> },
  { path: '/work_factory_metrics', element: <Suspense fallback={<div>Loading...</div>}><WorkFactoryMetricsListView /></Suspense> },
  { path: '/work_factory_portfolio', element: <Suspense fallback={<div>Loading...</div>}><WorkFactoryPortfolioListView /></Suspense> },
  { path: '/work_factory_roadmaps', element: <Suspense fallback={<div>Loading...</div>}><WorkFactoryRoadmapsListView /></Suspense> },
  { path: '/work_factory_services', element: <Suspense fallback={<div>Loading...</div>}><WorkFactoryServicesListView /></Suspense> },
  { path: '/work_learning_feedback', element: <Suspense fallback={<div>Loading...</div>}><WorkLearningFeedbackListView /></Suspense> },
  { path: '/work_obligations', element: <Suspense fallback={<div>Loading...</div>}><WorkObligationsListView /></Suspense> },
  { path: '/work_outcomes', element: <Suspense fallback={<div>Loading...</div>}><WorkOutcomesListView /></Suspense> },
  { path: '/work_pattern_applications', element: <Suspense fallback={<div>Loading...</div>}><WorkPatternApplicationsListView /></Suspense> },
  { path: '/work_pattern_performance_profiles', element: <Suspense fallback={<div>Loading...</div>}><WorkPatternPerformanceProfilesListView /></Suspense> },
  { path: '/work_reusable_patterns', element: <Suspense fallback={<div>Loading...</div>}><WorkReusablePatternsListView /></Suspense> },
  { path: '/work_service_breaches', element: <Suspense fallback={<div>Loading...</div>}><WorkServiceBreachesListView /></Suspense> },
  { path: '/work_service_level_objectives', element: <Suspense fallback={<div>Loading...</div>}><WorkServiceLevelObjectivesListView /></Suspense> },
  { path: '/work_service_lifecycle', element: <Suspense fallback={<div>Loading...</div>}><WorkServiceLifecycleListView /></Suspense> },
  { path: '/work_service_perf_profiles', element: <Suspense fallback={<div>Loading...</div>}><WorkServicePerfProfilesListView /></Suspense> },
  { path: '/work_service_remediation_plans', element: <Suspense fallback={<div>Loading...</div>}><WorkServiceRemediationPlansListView /></Suspense> },
  { path: '/work_service_requests', element: <Suspense fallback={<div>Loading...</div>}><WorkServiceRequestsListView /></Suspense> },
  { path: '/work_service_revalidation_results', element: <Suspense fallback={<div>Loading...</div>}><WorkServiceRevalidationResultsListView /></Suspense> },
  { path: '/work_service_runs', element: <Suspense fallback={<div>Loading...</div>}><WorkServiceRunsListView /></Suspense> },
  { path: '/work_step_events', element: <Suspense fallback={<div>Loading...</div>}><WorkStepEventsListView /></Suspense> },
  { path: '/workflow_metrics', element: <Suspense fallback={<div>Loading...</div>}><WorkflowMetricsListView /></Suspense> },
  { path: '/workspace_config', element: <Suspense fallback={<div>Loading...</div>}><WorkspaceConfigListView /></Suspense> },
];

// ============================================================
// ADMIN PAGES (from 31-eva-faces/admin-face -- 10 pages, 188 tests)
// ============================================================
const AppsPage = React.lazy(() => import('./pages/admin/AppsPage'));
const AuditLogsPage = React.lazy(() => import('./pages/admin/AuditLogsPage'));
const FeatureFlagsPage = React.lazy(() => import('./pages/admin/FeatureFlagsPage'));
const IngestionRunsPage = React.lazy(() => import('./pages/admin/IngestionRunsPage'));
const RbacPage = React.lazy(() => import('./pages/admin/RbacPage'));
const RbacRolesPage = React.lazy(() => import('./pages/admin/RbacRolesPage'));
const SearchHealthPage = React.lazy(() => import('./pages/admin/SearchHealthPage'));
const SettingsPage = React.lazy(() => import('./pages/admin/SettingsPage'));
const SupportTicketsPage = React.lazy(() => import('./pages/admin/SupportTicketsPage'));
const TranslationsPage = React.lazy(() => import('./pages/admin/TranslationsPage'));

export const adminRoutes = [
  { path: '/admin/apps', element: <Suspense fallback={<div>Loading...</div>}><AppsPage /></Suspense> },
  { path: '/admin/audit-logs', element: <Suspense fallback={<div>Loading...</div>}><AuditLogsPage /></Suspense> },
  { path: '/admin/feature-flags', element: <Suspense fallback={<div>Loading...</div>}><FeatureFlagsPage /></Suspense> },
  { path: '/admin/ingestion-runs', element: <Suspense fallback={<div>Loading...</div>}><IngestionRunsPage /></Suspense> },
  { path: '/admin/rbac', element: <Suspense fallback={<div>Loading...</div>}><RbacPage /></Suspense> },
  { path: '/admin/rbac/roles', element: <Suspense fallback={<div>Loading...</div>}><RbacRolesPage /></Suspense> },
  { path: '/admin/search-health', element: <Suspense fallback={<div>Loading...</div>}><SearchHealthPage /></Suspense> },
  { path: '/admin/settings', element: <Suspense fallback={<div>Loading...</div>}><SettingsPage /></Suspense> },
  { path: '/admin/support-tickets', element: <Suspense fallback={<div>Loading...</div>}><SupportTicketsPage /></Suspense> },
  { path: '/admin/translations', element: <Suspense fallback={<div>Loading...</div>}><TranslationsPage /></Suspense> },
];

// ============================================================
// PORTAL PAGES (from 31-eva-faces/portal-face -- dashboards, model browser)
// ============================================================
const EVAHomePage = React.lazy(() => import('./pages/portal/EVAHomePage'));
const ModelBrowserPage = React.lazy(() => import('./pages/portal/ModelBrowserPage'));
const ModelGraphPage = React.lazy(() => import('./pages/portal/ModelGraphPage'));
const ModelReportPage = React.lazy(() => import('./pages/portal/ModelReportPage'));
const ProjectPortfolioPage = React.lazy(() => import('./pages/portal/ProjectPortfolioPage'));
const SprintBoardPage = React.lazy(() => import('./pages/portal/SprintBoardPage'));
const WBSTreePage = React.lazy(() => import('./pages/portal/WBSTreePage'));

export const portalRoutes = [
  { path: '/', element: <Suspense fallback={<div>Loading...</div>}><EVAHomePage /></Suspense> },
  { path: '/model-browser', element: <Suspense fallback={<div>Loading...</div>}><ModelBrowserPage /></Suspense> },
  { path: '/model-graph', element: <Suspense fallback={<div>Loading...</div>}><ModelGraphPage /></Suspense> },
  { path: '/model-report', element: <Suspense fallback={<div>Loading...</div>}><ModelReportPage /></Suspense> },
  { path: '/portfolio', element: <Suspense fallback={<div>Loading...</div>}><ProjectPortfolioPage /></Suspense> },
  { path: '/devops/sprint', element: <Suspense fallback={<div>Loading...</div>}><SprintBoardPage /></Suspense> },
  { path: '/wbs', element: <Suspense fallback={<div>Loading...</div>}><WBSTreePage /></Suspense> },
];

// ============================================================
// ACCELERATOR PAGES (from 46-accelerator -- workspace booking + AI assistant)
// ============================================================
const AcceleratorAdminDashboard = React.lazy(() => import('./pages/accelerator/AdminDashboard'));
const AIAssistant = React.lazy(() => import('./pages/accelerator/AIAssistant'));
const BookingDialog = React.lazy(() => import('./pages/accelerator/BookingDialog'));
const MyBookings = React.lazy(() => import('./pages/accelerator/MyBookings'));
const WorkspaceCatalog = React.lazy(() => import('./pages/accelerator/WorkspaceCatalog'));

export const acceleratorRoutes = [
  { path: '/accelerator', element: <Suspense fallback={<div>Loading...</div>}><WorkspaceCatalog /></Suspense> },
  { path: '/accelerator/bookings', element: <Suspense fallback={<div>Loading...</div>}><MyBookings /></Suspense> },
  { path: '/accelerator/admin', element: <Suspense fallback={<div>Loading...</div>}><AcceleratorAdminDashboard /></Suspense> },
  { path: '/accelerator/assistant', element: <Suspense fallback={<div>Loading...</div>}><AIAssistant /></Suspense> },
];

// ============================================================
// ALL ROUTES (unified export)
// ============================================================
export const allRoutes = [
  ...portalRoutes,
  ...layerRoutes,
  ...adminRoutes,
  ...acceleratorRoutes,
];

export default layerRoutes;

/**
 * layerRoutes.tsx -- Auto-generated route definitions
 * Generated: 2026-03-12 09:22:11
 * Session 46 - Fix Bug #1: Properly populate routes to prevent ALL_KEYS[0] = undefined
 * 
 * DO NOT EDIT MANUALLY - Regenerate with: pwsh scripts/generate-layer-routes.ps1
 */

import React from 'react';

// ==========================================
// Portal Routes (7 pages)
// ==========================================
const EVAHomePage = React.lazy(() => import('./pages/portal/EVAHomePage'));
const ModelBrowserPage = React.lazy(() => import('./pages/portal/ModelBrowserPage'));
const ModelGraphPage = React.lazy(() => import('./pages/portal/ModelGraphPage'));
const ModelReportPage = React.lazy(() => import('./pages/portal/ModelReportPage'));
const ProjectPortfolioPage = React.lazy(() => import('./pages/portal/ProjectPortfolioPage'));
const SprintBoardPage = React.lazy(() => import('./pages/portal/SprintBoardPage'));
const WBSTreePage = React.lazy(() => import('./pages/portal/WBSTreePage'));

export const portalRoutes = [
  { path: '/eva-home', element: <EVAHomePage /> },
  { path: '/model-browser', element: <ModelBrowserPage /> },
  { path: '/model-graph', element: <ModelGraphPage /> },
  { path: '/model-report', element: <ModelReportPage /> },
  { path: '/project-portfolio', element: <ProjectPortfolioPage /> },
  { path: '/sprint-board', element: <SprintBoardPage /> },
  { path: '/wbs-tree', element: <WBSTreePage /> }
];

// ==========================================
// Admin Routes (10 pages)
// ==========================================
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
  { path: '/admin/apps', element: <AppsPage /> },
  { path: '/admin/audit-logs', element: <AuditLogsPage /> },
  { path: '/admin/feature-flags', element: <FeatureFlagsPage /> },
  { path: '/admin/ingestion-runs', element: <IngestionRunsPage /> },
  { path: '/admin/rbac', element: <RbacPage /> },
  { path: '/admin/rbac-roles', element: <RbacRolesPage /> },
  { path: '/admin/search-health', element: <SearchHealthPage /> },
  { path: '/admin/settings', element: <SettingsPage /> },
  { path: '/admin/support-tickets', element: <SupportTicketsPage /> },
  { path: '/admin/translations', element: <TranslationsPage /> }
];

// ==========================================
// Layer Routes (111 data model layers)
// ==========================================
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
const EndpointsListView = React.lazy(() => import('./pages/endpoints/EndpointsListView'));
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
const ProjectsListView = React.lazy(() => import('./pages/projects/ProjectsListView'));
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
const SprintsListView = React.lazy(() => import('./pages/sprints/SprintsListView'));
const StoriesListView = React.lazy(() => import('./pages/stories/StoriesListView'));
const SyntheticTestsListView = React.lazy(() => import('./pages/synthetic_tests/SyntheticTestsListView'));
const TasksListView = React.lazy(() => import('./pages/tasks/TasksListView'));
const TechStackListView = React.lazy(() => import('./pages/tech_stack/TechStackListView'));
const TestCasesListView = React.lazy(() => import('./pages/test_cases/TestCasesListView'));
const TestingPoliciesListView = React.lazy(() => import('./pages/testing_policies/TestingPoliciesListView'));
const TracesListView = React.lazy(() => import('./pages/traces/TracesListView'));
const TsTypesListView = React.lazy(() => import('./pages/ts_types/TsTypesListView'));
const UsageMetricsListView = React.lazy(() => import('./pages/usage_metrics/UsageMetricsListView'));
const ValidationRulesListView = React.lazy(() => import('./pages/validation_rules/ValidationRulesListView'));
const VerificationRecordsListView = React.lazy(() => import('./pages/verification_records/VerificationRecordsListView'));
const WbsListView = React.lazy(() => import('./pages/wbs/WbsListView'));
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

export const layerRoutes = [
  { path: '/agent_execution_history', element: <AgentExecutionHistoryListView /> },
  { path: '/agent_performance_metrics', element: <AgentPerformanceMetricsListView /> },
  { path: '/agent_policies', element: <AgentPoliciesListView /> },
  { path: '/agentic_workflows', element: <AgenticWorkflowsListView /> },
  { path: '/agents', element: <AgentsListView /> },
  { path: '/api_contracts', element: <ApiContractsListView /> },
  { path: '/architecture_decisions', element: <ArchitectureDecisionsListView /> },
  { path: '/auto_fix_execution_history', element: <AutoFixExecutionHistoryListView /> },
  { path: '/azure_infrastructure', element: <AzureInfrastructureListView /> },
  { path: '/ci_cd_pipelines', element: <CiCdPipelinesListView /> },
  { path: '/compliance_audit', element: <ComplianceAuditListView /> },
  { path: '/components', element: <ComponentsListView /> },
  { path: '/config_defs', element: <ConfigDefsListView /> },
  { path: '/connections', element: <ConnectionsListView /> },
  { path: '/containers', element: <ContainersListView /> },
  { path: '/cost_allocation', element: <CostAllocationListView /> },
  { path: '/cost_tracking', element: <CostTrackingListView /> },
  { path: '/coverage_summary', element: <CoverageSummaryListView /> },
  { path: '/cp_agents', element: <CpAgentsListView /> },
  { path: '/cp_policies', element: <CpPoliciesListView /> },
  { path: '/cp_skills', element: <CpSkillsListView /> },
  { path: '/cp_workflows', element: <CpWorkflowsListView /> },
  { path: '/decision_provenance', element: <DecisionProvenanceListView /> },
  { path: '/decisions', element: <DecisionsListView /> },
  { path: '/deployment_history', element: <DeploymentHistoryListView /> },
  { path: '/deployment_policies', element: <DeploymentPoliciesListView /> },
  { path: '/deployment_quality_scores', element: <DeploymentQualityScoresListView /> },
  { path: '/deployment_records', element: <DeploymentRecordsListView /> },
  { path: '/deployment_targets', element: <DeploymentTargetsListView /> },
  { path: '/endpoints', element: <EndpointsListView /> },
  { path: '/env_vars', element: <EnvVarsListView /> },
  { path: '/environments', element: <EnvironmentsListView /> },
  { path: '/error_catalog', element: <ErrorCatalogListView /> },
  { path: '/eva_model', element: <EvaModelListView /> },
  { path: '/evidence', element: <EvidenceListView /> },
  { path: '/evidence_correlation', element: <EvidenceCorrelationListView /> },
  { path: '/feature_flags', element: <FeatureFlagsListView /> },
  { path: '/github_rules', element: <GithubRulesListView /> },
  { path: '/hooks', element: <HooksListView /> },
  { path: '/infrastructure', element: <InfrastructureListView /> },
  { path: '/infrastructure_drift', element: <InfrastructureDriftListView /> },
  { path: '/infrastructure_events', element: <InfrastructureEventsListView /> },
  { path: '/instructions', element: <InstructionsListView /> },
  { path: '/literals', element: <LiteralsListView /> },
  { path: '/mcp_servers', element: <McpServersListView /> },
  { path: '/milestones', element: <MilestonesListView /> },
  { path: '/model_telemetry', element: <ModelTelemetryListView /> },
  { path: '/performance_trends', element: <PerformanceTrendsListView /> },
  { path: '/personas', element: <PersonasListView /> },
  { path: '/planes', element: <PlanesListView /> },
  { path: '/project_work', element: <ProjectWorkListView /> },
  { path: '/projects', element: <ProjectsListView /> },
  { path: '/prompts', element: <PromptsListView /> },
  { path: '/quality_gates', element: <QualityGatesListView /> },
  { path: '/remediation_effectiveness', element: <RemediationEffectivenessListView /> },
  { path: '/remediation_outcomes', element: <RemediationOutcomesListView /> },
  { path: '/remediation_policies', element: <RemediationPoliciesListView /> },
  { path: '/repos', element: <ReposListView /> },
  { path: '/request_response_samples', element: <RequestResponseSamplesListView /> },
  { path: '/requirements', element: <RequirementsListView /> },
  { path: '/resource_costs', element: <ResourceCostsListView /> },
  { path: '/resource_inventory', element: <ResourceInventoryListView /> },
  { path: '/risks', element: <RisksListView /> },
  { path: '/runbooks', element: <RunbooksListView /> },
  { path: '/runtime_config', element: <RuntimeConfigListView /> },
  { path: '/schemas', element: <SchemasListView /> },
  { path: '/screens', element: <ScreensListView /> },
  { path: '/secrets_catalog', element: <SecretsCatalogListView /> },
  { path: '/security_controls', element: <SecurityControlsListView /> },
  { path: '/service_health_metrics', element: <ServiceHealthMetricsListView /> },
  { path: '/services', element: <ServicesListView /> },
  { path: '/session_transcripts', element: <SessionTranscriptsListView /> },
  { path: '/sprints', element: <SprintsListView /> },
  { path: '/stories', element: <StoriesListView /> },
  { path: '/synthetic_tests', element: <SyntheticTestsListView /> },
  { path: '/tasks', element: <TasksListView /> },
  { path: '/tech_stack', element: <TechStackListView /> },
  { path: '/test_cases', element: <TestCasesListView /> },
  { path: '/testing_policies', element: <TestingPoliciesListView /> },
  { path: '/traces', element: <TracesListView /> },
  { path: '/ts_types', element: <TsTypesListView /> },
  { path: '/usage_metrics', element: <UsageMetricsListView /> },
  { path: '/validation_rules', element: <ValidationRulesListView /> },
  { path: '/verification_records', element: <VerificationRecordsListView /> },
  { path: '/wbs', element: <WbsListView /> },
  { path: '/work_decision_records', element: <WorkDecisionRecordsListView /> },
  { path: '/work_execution_units', element: <WorkExecutionUnitsListView /> },
  { path: '/work_factory_capabilities', element: <WorkFactoryCapabilitiesListView /> },
  { path: '/work_factory_governance', element: <WorkFactoryGovernanceListView /> },
  { path: '/work_factory_investments', element: <WorkFactoryInvestmentsListView /> },
  { path: '/work_factory_metrics', element: <WorkFactoryMetricsListView /> },
  { path: '/work_factory_portfolio', element: <WorkFactoryPortfolioListView /> },
  { path: '/work_factory_roadmaps', element: <WorkFactoryRoadmapsListView /> },
  { path: '/work_factory_services', element: <WorkFactoryServicesListView /> },
  { path: '/work_learning_feedback', element: <WorkLearningFeedbackListView /> },
  { path: '/work_obligations', element: <WorkObligationsListView /> },
  { path: '/work_outcomes', element: <WorkOutcomesListView /> },
  { path: '/work_pattern_applications', element: <WorkPatternApplicationsListView /> },
  { path: '/work_pattern_performance_profiles', element: <WorkPatternPerformanceProfilesListView /> },
  { path: '/work_reusable_patterns', element: <WorkReusablePatternsListView /> },
  { path: '/work_service_breaches', element: <WorkServiceBreachesListView /> },
  { path: '/work_service_level_objectives', element: <WorkServiceLevelObjectivesListView /> },
  { path: '/work_service_lifecycle', element: <WorkServiceLifecycleListView /> },
  { path: '/work_service_perf_profiles', element: <WorkServicePerfProfilesListView /> },
  { path: '/work_service_remediation_plans', element: <WorkServiceRemediationPlansListView /> },
  { path: '/work_service_requests', element: <WorkServiceRequestsListView /> },
  { path: '/work_service_revalidation_results', element: <WorkServiceRevalidationResultsListView /> },
  { path: '/work_service_runs', element: <WorkServiceRunsListView /> },
  { path: '/work_step_events', element: <WorkStepEventsListView /> },
  { path: '/workflow_metrics', element: <WorkflowMetricsListView /> },
  { path: '/workspace_config', element: <WorkspaceConfigListView /> }
];

// ==========================================
// Accelerator Routes (future expansion)
// ==========================================

export const acceleratorRoutes = [];

// ==========================================
// Route Summary
// ==========================================
// Portal: 7 routes
// Admin: 10 routes
// Layers: 111 routes
// Accelerator: 0 routes
// TOTAL: 128 routes

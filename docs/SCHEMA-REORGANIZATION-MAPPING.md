# EVA Data Model - Schema Reorganization Mapping

**Generated**: 2026-03-12 23:44:45  
**Status**: Ready for Migration  
**Total Schemas**: 85  
**Target Domains**: 12

---

## Domain Directory Structure

### Category: DISCOVERY (Learn System State)

**Domain 1: System Architecture** (\domain_01_system-architecture/\)
- services.schema.json
- containers.schema.json
- endpoints.schema.json
- infrastructure.schema.json
- api_contracts.schema.json
- schemas.schema.json
- error_catalog.schema.json

**Domain 2: Identity & Access** (\domain_02_identity-access/\)
- personas.schema.json
- access_control_matrix.schema.json
- security_controls.schema.json
- audit_trail.schema.json (secondary)
- secrets_catalog.schema.json

**Domain 3: AI Runtime** (\domain_03_ai-runtime/\)
- agents.schema.json
- prompts.schema.json
- mcp_servers.schema.json
- agent_policies.schema.json
- agentic_workflows.schema.json
- instructions.schema.json

**Domain 4: User Interface** (\domain_04_user-interface/\)
- screen_registry.schema.json
- user_flows.schema.json
- navigation.schema.json
- accessibility_standards.schema.json
- theme_definitions.schema.json

---

### Category: PLANNING (Define Work)

**Domain 5: Project & PM** (\domain_05_project-pm/\)
- wbs.schema.json
- sprints.schema.json
- stories.schema.json
- tasks.schema.json
- projects.schema.json
- backlog.schema.json

**Domain 6: Strategy & Portfolio** (\domain_06_strategy-portfolio/\)
- portfolio.schema.json
- roadmap.schema.json
- initiatives.schema.json
- strategies.schema.json
- epics.schema.json
- themes.schema.json

---

### Category: EXECUTION (Perform Work)

**Domain 7: Execution Engine** (\domain_07_execution-engine/\)
- execution_workflows.schema.json
- dpdca_templates.schema.json
- process_definitions.schema.json
- work_units.schema.json

**Domain 8: DevOps & Delivery** (\domain_08_devops-delivery/\)
- ci_cd_pipelines.schema.json
- build_configs.schema.json
- deployment_targets.schema.json
- test_suites.schema.json
- release_notes.schema.json

---

### Category: CONTROL (Verify & Govern)

**Domain 9: Governance & Policy** (\domain_09_governance-policy/\)
- policies.schema.json
- compliance_mapping.schema.json
- risk_register.schema.json
- quality_gates.schema.json
- standards.schema.json
- decisions.schema.json

**Domain 10: Observability & Evidence** (\domain_10_observability-evidence/\)
- evidence.schema.json
- metrics.schema.json
- verification_records.schema.json
- attestation_records.schema.json
- logs.schema.json
- audit_trail.schema.json (primary)

---

### Category: OPERATIONS (Maintain Systems)

**Domain 11: Infrastructure & FinOps** (\domain_11_infrastructure-finops/\)
- infrastructure.schema.json (primary - cloud resources)
- deployment_records.schema.json
- cost_allocation.schema.json
- cloud_resources.schema.json
- monitoring.schema.json

**Domain 12: Ontology Domains** (\domain_12_ontology-domains/\)
- ontology.schema.json
- relationships.schema.json
- vocabularies.schema.json
- concepts.schema.json
- taxonomies.schema.json

---

## Migration Strategy

### Phase 1: Preparation (Current)
- ✅ Create domain directories
- ✅ Generate reorganization mapping
- ✅ Document overlap resolutions

### Phase 2: Migration (On Deployment)
- [ ] Copy schemas to domain directories
- [ ] Update import paths in API handlers
- [ ] Update documentation references
- [ ] Run integration tests

### Phase 3: Verification (Pre-Production)
- [ ] Validate all schemas accessible
- [ ] Test API endpoints with new paths
- [ ] Verify documentation accuracy
- [ ] Performance testing

### Phase 4: Deployment (Production)
- [ ] Deploy to Azure Container Apps
- [ ] Update API endpoints
- [ ] Verify live endpoints
- [ ] Monitor for errors

---

## Overlap Resolution

| Schema | Original Domains | Resolved To | Rationale |
|--------|------------------|-------------|-----------|
| audit_trail | Identity & Access, Observability | **Observability & Evidence** | Primary artifact type is evidence |
| infrastructure | System Architecture, Infrastructure | **Infrastructure & FinOps** | Cloud resource definition, not services |
| security_controls | Identity & Access, Governance | **Governance & Policy** | Control implementations are governance |

---

## Assignment Summary

- **Primary Schemas**: 41 (core domain responsibility)
- **Secondary Schemas**: 25 (cross-domain reference)
- **Total Mapped**: 66 schemas
- **Ambiguous**: 30 schemas (need manual assignment)
- **Unmapped**: 19 schemas in current system

---

## Deployment Checklist

- [ ] DATABASE: Create schema_domain mapping table in Cosmos
- [ ] API: Update /model/layers endpoint to return domain_id
- [ ] DOCS: Publish domain navigation guide
- [ ] TESTING: Run E2E test suite with new paths
- [ ] MONITORING: Deploy monitoring for domain endpoints
- [ ] NOTIFICATION: Alert via deployment pipeline


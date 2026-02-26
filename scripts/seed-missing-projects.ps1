# seed-missing-projects.ps1
# Adds the 26 numbered projects present on disk but absent from the data model.
# Run from:  C:\AICOE\eva-foundation\37-data-model
# Requires:  API running on http://localhost:8010

$API   = "http://localhost:8010"
$ACTOR = "agent:copilot-seed-2026-02-23"
$HDR   = @{ "X-Actor" = $ACTOR; "Content-Type" = "application/json" }

$projects = @(
  @{
    id="01-documentation-generator"; label="Doc Generator"; label_fr="Generateur de Docs"
    folder="01-documentation-generator"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/01-documentation-generator"; category="Developer"
    maturity="active"; phase="Phase 2 — Production Runs"
    goal="AI-powered documentation generation system using Azure OpenAI to produce validated, traceable docs from EVA source code."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=5; pbi_done=4
    services=@(); sprint_context=$null; wbs_id="WBS-001"; notes=""
  }
  @{
    id="02-poc-agent-skills"; label="Agent Skills Framework"; label_fr="Cadre de Competences Agents"
    folder="02-poc-agent-skills"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/02-poc-agent-skills"; category="Developer"
    maturity="poc"; phase="Phase 1 — POC Complete"
    goal="POC generalizing the EVA documentation generator into a reusable, composable agent skills framework for diverse AI automation tasks."
    status="active"; depends_on=@("01-documentation-generator"); blocked_by=@(); pbi_total=3; pbi_done=2
    services=@(); sprint_context=$null; wbs_id="WBS-002"; notes="Feeds into 29-foundry skills library."
  }
  @{
    id="03-poc-enhanced-docs"; label="Enhanced Docs POC"; label_fr="POC Docs Ameliorees"
    folder="03-poc-enhanced-docs"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/03-poc-enhanced-docs"; category="Developer"
    maturity="poc"; phase="Phase 1 — POC Complete"
    goal="POC transforming AI-generated markdown into a professional interactive MkDocs HTML site with 40+ Mermaid diagrams and ESDC branding."
    status="active"; depends_on=@("01-documentation-generator"); blocked_by=@(); pbi_total=3; pbi_done=2
    services=@(); sprint_context=$null; wbs_id="WBS-003"; notes="Static site output; see 10-mkdocs-poc for hosting."
  }
  @{
    id="04-os-vnext"; label="OS-vNext Workflows"; label_fr="Workflows OS-vNext"
    folder="04-os-vnext"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/04-os-vnext"; category="Developer"
    maturity="poc"; phase="Phase 1"
    goal="Consolidates predefined Copilot and Azure AI Foundry workflows for documentation and implementation with built-in validation."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=2; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-004"; notes=""
  }
  @{
    id="05-extract-cases"; label="Extract Cases Pipeline"; label_fr="Pipeline Extraction Cas"
    folder="05-extract-cases"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/05-extract-cases"; category="AI Intelligence"
    maturity="active"; phase="Phase 1 — Dataset Pipeline Complete"
    goal="Phase-1 no-agent pipeline converting a Jurisprudence SQLite inventory into an EVA Domain Assistant v1 XML dataset."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=4; pbi_done=3
    services=@(); sprint_context=$null; wbs_id="WBS-005"; notes="Upstream data source for 06-jp-auto-extraction and 44-eva-jp-spark corpus."
  }
  @{
    id="06-jp-auto-extraction"; label="JP Auto-Extraction"; label_fr="Auto-Extraction JP"
    folder="06-jp-auto-extraction"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/06-jp-auto-extraction"; category="AI Intelligence"
    maturity="poc"; phase="Phase 1 — Playwright Automation POC"
    goal="Browser-automation tool (Playwright) that extracts jurisprudence answers and citations from the JP UI using predefined legal questions."
    status="active"; depends_on=@("05-extract-cases"); blocked_by=@(); pbi_total=3; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-006"; notes=""
  }
  @{
    id="07-foundation-layer"; label="Foundation Layer"; label_fr="Couche Fondation"
    folder="07-foundation-layer"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/07-foundation-layer"; category="Platform"
    maturity="active"; phase="Phase 3 — v3 Templates Active"
    goal="Comprehensive pattern library and standards baseline providing GitHub Copilot instructions and dev standards across the entire EVA ecosystem."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=6; pbi_done=4
    services=@(); sprint_context=$null; wbs_id="WBS-007"; notes="Template source for all project copilot-instructions. Apply-Project07-Artifacts.ps1 deploys to all numbered folders."
  }
  @{
    id="08-cds-rag"; label="CDS RAG Analysis"; label_fr="Analyse RAG CDS"
    folder="08-cds-rag"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/08-cds-rag"; category="AI Intelligence"
    maturity="empty"; phase="Backlog"
    goal="AI-Answers and analysis artifacts for a CDS-scoped RAG experiment."
    status="planned"; depends_on=@(); blocked_by=@(); pbi_total=0; pbi_done=0
    services=@(); sprint_context=$null; wbs_id="WBS-008"; notes="No governance docs or active implementation. Backlog candidate."
  }
  @{
    id="09-eva-repo-documentation"; label="EVA Repo Documentation"; label_fr="Documentation Depot EVA"
    folder="09-eva-repo-documentation"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/09-eva-repo-documentation"; category="Developer"
    maturity="active"; phase="Phase 2 — Architecture Reference"
    goal="Evidence-based code inspection and architectural documentation of the EVA Domain Assistant JP 1.2 as a RAG reference implementation."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=4; pbi_done=3
    services=@(); sprint_context=$null; wbs_id="WBS-009"; notes=""
  }
  @{
    id="10-mkdocs-poc"; label="MkDocs POC"; label_fr="POC MkDocs"
    folder="10-mkdocs-poc"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/10-mkdocs-poc"; category="Developer"
    maturity="poc"; phase="Phase 1 — Hosting Validated"
    goal="Validates MkDocs as a static site generator by testing SharePoint Online and Azure Static Website hosting for EVA documentation."
    status="active"; depends_on=@("03-poc-enhanced-docs"); blocked_by=@(); pbi_total=3; pbi_done=2
    services=@(); sprint_context=$null; wbs_id="WBS-010"; notes=""
  }
  @{
    id="11-ms-infojp"; label="MS InfoJP Reference"; label_fr="Reference MS InfoJP"
    folder="11-ms-infojp"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/11-ms-infojp"; category="AI Intelligence"
    maturity="active"; phase="Phase 2 — Reference MVP"
    goal="Reference MVP of a Jurisprudence AI assistant built on Microsoft PubSec-Info-Assistant with Azure OpenAI hybrid search and inline citations."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=5; pbi_done=3
    services=@("infojp-api"); sprint_context=$null; wbs_id="WBS-011"; notes="Informs 44-eva-jp-spark RAG architecture decisions. PubSec-Info-Assistant fork."
  }
  @{
    id="12-work-spc-reorg"; label="Workspace Reorg"; label_fr="Reorganisation Espace Travail"
    folder="12-work-spc-reorg"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/12-work-spc-reorg"; category="Developer"
    maturity="poc"; phase="Phase 1 — Planning"
    goal="Planning project to restructure the VS Code workspace for shorter paths, clearer project separation, and cross-platform script compatibility."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=2; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-012"; notes=""
  }
  @{
    id="13-vscode-tools"; label="VS Code Tools Mastery"; label_fr="Maitrise Outils VS Code"
    folder="13-vscode-tools"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/13-vscode-tools"; category="Developer"
    maturity="poc"; phase="Phase 1 — Discovery"
    goal="Strategic discovery and mastery plan for VS Code's 156 tools to maximize developer productivity across EVA projects."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=2; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-013"; notes=""
  }
  @{
    id="21-habit-tracker"; label="Habit Tracker"; label_fr="Suivi Habitudes"
    folder="21-habit-tracker"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/21-habit-tracker"; category="User Products"
    maturity="poc"; phase="Phase 1 — Workshop Clone"
    goal="Local-first personal habit tracking web app (workshop clone) with a FastAPI backend and React frontend."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=2; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-021"; notes="Workshop/learning project. Not production EVA platform."
  }
  @{
    id="22-rg-sandbox"; label="RG Sandbox"; label_fr="RG Bac a Sable"
    folder="22-rg-sandbox"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/22-rg-sandbox"; category="Platform"
    maturity="active"; phase="Phase 2 — 18 Resources Active"
    goal="Active Azure sandbox resource group managing 18 deployed resources at ~$182/month with FinOps patterns for EsDAICoE."
    status="active"; depends_on=@("14-az-finops"); blocked_by=@(); pbi_total=4; pbi_done=2
    services=@("sandbox-rg"); sprint_context=$null; wbs_id="WBS-022"
    notes="Personal subscription sandbox. 18 resources: OpenAI, Search, Cosmos, Container Apps, ACR, APIM, etc."
  }
  @{
    id="23-ei-dsst-rewrite"; label="EI-DSST Rewrite"; label_fr="Refonte EI-DSST"
    folder="23-ei-dsst-rewrite"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/23-ei-dsst-rewrite"; category="User Products"
    maturity="poc"; phase="Phase 1 — Discovery"
    goal="Discovery-phase analysis and modernization plan for the ADMS-EI-SST legacy Oracle Forms GC government application."
    status="planned"; depends_on=@(); blocked_by=@(); pbi_total=3; pbi_done=0
    services=@(); sprint_context=$null; wbs_id="WBS-023"; notes=""
  }
  @{
    id="25-eva-suite"; label="EVA Suite Hub"; label_fr="Hub EVA Suite"
    folder="25-eva-suite"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/25-eva-suite"; category="Developer"
    maturity="poc"; phase="Phase 1 — Housekeeping Scripts"
    goal="Developer command center and ecosystem housekeeping workspace with daily login workflow scripts and GitHub/cloud cleanup tools."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=2; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-025"; notes=""
  }
  @{
    id="26-eva-gh"; label="EVA GitHub Ecosystem"; label_fr="Ecosysteme GitHub EVA"
    folder="26-eva-gh"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/26-eva-gh"; category="Developer"
    maturity="poc"; phase="Phase 1 — Sub-repo Clones"
    goal="GitHub ecosystem hub hosting cloned EVA sub-repos (rag, registry, safety, UI variants, sovereign) with cloud housekeeping scripts."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=2; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-026"; notes=""
  }
  @{
    id="27-devbench"; label="DevBench"; label_fr="Banc Developpement"
    folder="27-devbench"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/27-devbench"; category="Developer"
    maturity="poc"; phase="Phase 1 — Architecture"
    goal="AI-assisted software engineering platform for government teams modernizing COBOL/legacy applications with auditable work packages."
    status="planned"; depends_on=@("29-foundry"); blocked_by=@(); pbi_total=3; pbi_done=0
    services=@(); sprint_context=$null; wbs_id="WBS-027"; notes=""
  }
  @{
    id="28-rbac"; label="RBAC Reference"; label_fr="Reference RBAC"
    folder="28-rbac"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/28-rbac"; category="Platform"
    maturity="active"; phase="Phase 2 — Production Reference"
    goal="Production-ready Role-Based Access Control reference for EVA-JP-v1.2 with full admin guide, user guide, and troubleshooting docs."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=4; pbi_done=3
    services=@(); sprint_context=$null; wbs_id="WBS-028"
    notes="Reference RBAC implementation feeding 33-eva-brain-v2 roles-api and 31-eva-faces auth."
  }
  @{
    id="40-eva-control-plane"; label="EVA Control Plane"; label_fr="Plan de Controle EVA"
    folder="40-eva-control-plane"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/40-eva-control-plane"; category="Platform"
    maturity="active"; phase="Phase 1 — Evidence Spine"
    goal="Runtime layer that records runs, step executions, and evidence packs — the audit spine sitting on top of the 37-data-model catalog."
    status="active"; depends_on=@("37-data-model"); blocked_by=@(); pbi_total=4; pbi_done=1
    services=@("control-plane-api"); sprint_context=$null; wbs_id="WBS-040"
    notes="Port 8020. Stores run records, evidence packs, deployment audit trail. Dependency: 37-data-model."
  }
  @{
    id="41-eva-cli"; label="EVA CLI"; label_fr="EVA CLI"
    folder="41-eva-cli"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/41-eva-cli"; category="Developer"
    maturity="poc"; phase="Phase 1 — Scaffolded"
    goal="`eva` CLI: governed evidence-first command-line tool for promoting PRs, capturing telemetry, and updating ADO work items with evidence IDs."
    status="planned"; depends_on=@("37-data-model","40-eva-control-plane"); blocked_by=@(); pbi_total=3; pbi_done=0
    services=@(); sprint_context=$null; wbs_id="WBS-041"; notes=""
  }
  @{
    id="42-learn-foundry"; label="Learn Foundry"; label_fr="Apprentissage Foundry"
    folder="42-learn-foundry"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/42-learn-foundry"; category="Developer"
    maturity="poc"; phase="Phase 1 — Learning Sandbox"
    goal="Learning sandbox holding 9 cloned Microsoft reference repos, tutorial Jupyter notebooks, and exploratory spikes feeding the 29-foundry library."
    status="active"; depends_on=@("29-foundry"); blocked_by=@(); pbi_total=2; pbi_done=1
    services=@(); sprint_context=$null; wbs_id="WBS-042"; notes="Feeds learnings back into 29-foundry skills."
  }
  @{
    id="43-spark"; label="EVA Spark Springboard"; label_fr="Tremplin EVA Spark"
    folder="43-spark"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/43-spark"; category="Developer"
    maturity="active"; phase="Phase 2 — Active Design System"
    goal="Shared prompt engineering workspace and design system for all EVA UI/UX projects scaffolded via GitHub Spark."
    status="active"; depends_on=@(); blocked_by=@(); pbi_total=3; pbi_done=2
    services=@(); sprint_context=$null; wbs_id="WBS-043"
    notes="Design system parent. 44-eva-jp-spark and 45-aicoe-page derived from this."
  }
  @{
    id="45-aicoe-page"; label="AICOE Public Page"; label_fr="Page Publique AICOE"
    folder="45-aicoe-page"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/45-aicoe-page"; category="User Products"
    maturity="poc"; phase="Phase 1 — Scaffolded"
    goal="React 19 + Fluent UI public-facing AICOE page built from a GitHub Spark template."
    status="planned"; depends_on=@("43-spark"); blocked_by=@(); pbi_total=2; pbi_done=0
    services=@(); sprint_context=$null; wbs_id="WBS-045"; notes=""
  }
  @{
    id="46-accelerator"; label="EVA Accelerator"; label_fr="Accelerateur EVA"
    folder="46-accelerator"; ado_epic_id=$null; ado_project="eva-poc"
    github_repo="eva-foundry/46-accelerator"; category="User Products"
    maturity="poc"; phase="Phase 1 — Scaffolded"
    goal="React + Fluent UI workspace booking portal — AI workspace administration and booking UI."
    status="planned"; depends_on=@("29-foundry"); blocked_by=@(); pbi_total=2; pbi_done=0
    services=@(); sprint_context=$null; wbs_id="WBS-046"; notes=""
  }
)

$ok = 0; $fail = 0; $errors = @()
foreach ($p in $projects) {
    $body = $p | ConvertTo-Json -Depth 5
    try {
        $url = "$API/model/projects/$($p.id)"
        Invoke-RestMethod $url -Method PUT -Body $body -Headers $HDR | Out-Null
        Write-Host "[PASS] $($p.id)"
        $ok++
    } catch {
        $msg = $_.Exception.Message
        Write-Host "[FAIL] $($p.id) — $msg"
        $errors += "$($p.id): $msg"
        $fail++
    }
}

Write-Host ""
Write-Host "--- RESULT: $ok passed / $fail failed ---"
if ($errors.Count -gt 0) {
    Write-Host "Failures:"
    $errors | ForEach-Object { Write-Host "  $_" }
}

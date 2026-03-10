# Category Runbook Examples

**Version**: 1.0.0 (Session 43)  
**Last Updated**: 2026-03-10 08:45 ET  
**Purpose**: Real-world examples for each of the 6 category runbooks from `/model/user-guide`

---

## Overview

The Data Model API provides 6 category runbooks via `/model/user-guide`, each with deterministic query sequences, ID format patterns, and anti-trash rules. This document provides **real-world examples** for each category.

**API Reference**: `GET https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io/model/user-guide`

---

## Category 1: Session Tracking

**Layer**: `project_work`  
**Purpose**: Track work sessions per project with timestamps, goals, and deliverables  
**ID Pattern**: `{project_id}-{YYYY-MM-DD}` (max one session per project per day)

### Example 1: Start New Session (Project 37)

```powershell
# DISCOVER: Check if today's session exists
$projectId = "37-data-model"
$sessionId = "$projectId-$(Get-Date -Format 'yyyy-MM-dd')"  # e.g., "37-data-model-2026-03-10"
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

$existing = Invoke-RestMethod "$base/model/project_work/$sessionId" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Session exists: $($existing.goal)"
} else {
    Write-Host "No session for today - will create"
}

# PLAN: Define session metadata
$session = @{
    id = $sessionId
    project_id = $projectId
    layer = "project_work"
    session_date = (Get-Date -Format "yyyy-MM-dd")
    goal = "Fix priming system bugs and prime 7 missing projects"
    planned_deliverables = @("Fixed Invoke-PrimeWorkspace.ps1", "7 projects primed")
    status = "in_progress"
}

# DO: Create session
Invoke-RestMethod "$base/model/project_work/$sessionId" -Method PUT -Body ($session | ConvertTo-Json) -ContentType "application/json"

# CHECK: Verify write
$verified = Invoke-RestMethod "$base/model/project_work/$sessionId"
Write-Host "Session created: row_version = $($verified.row_version)"

# ACT: Update at end of session with results
$update = @{
    id = $sessionId
    project_id = $projectId
    layer = "project_work"
    session_date = (Get-Date -Format "yyyy-MM-dd")
    goal = "Fix priming system bugs and prime 7 missing projects"
    planned_deliverables = @("Fixed Invoke-PrimeWorkspace.ps1", "7 projects primed")
    actual_deliverables = @("Fixed 5 bugs in priming script", "Primed 7/7 projects successfully")
    status = "completed"
    completion_date = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
}
Invoke-RestMethod "$base/model/project_work/$sessionId" -Method PUT -Body ($update | ConvertTo-Json) -ContentType "application/json"
```

### Example 2: Anti-Trash Pattern (No Generic IDs)

```powershell
# ❌ BAD: Generic session ID without date
$badId = "37-data-model-session"  # Violates ID format pattern

# ❌ BAD: Multiple sessions per day
$badId2 = "37-data-model-2026-03-10-morning"  # Violates "max one per day" rule

# ✅ GOOD: Proper ID format
$goodId = "37-data-model-2026-03-10"  # Follows {project_id}-{YYYY-MM-DD} pattern
```

---

## Category 2: Sprint Tracking

**Layer**: `sprints`  
**Purpose**: Manage sprint cycles with goals, deliverables, and retrospectives  
**ID Pattern**: `sprint-{project_id}-{N}` (sequential numbering)

### Example 1: Close Sprint with Retrospective

```powershell
# DISCOVER: Get current sprint
$projectId = "48-eva-veritas"
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

$currentSprint = Invoke-RestMethod "$base/model/sprints?layer=sprints&project_id=$projectId&status=active"
$sprintId = $currentSprint[0].id  # e.g., "sprint-48-eva-veritas-5"

# PLAN: Define retrospective
$closeData = @{
    id = $sprintId
    project_id = $projectId
    layer = "sprints"
    sprint_number = 5
    status = "completed"
    end_date = (Get-Date -Format "yyyy-MM-dd")
    planned_deliverables = @("MTI formula docs", "Workspace promotion")
    actual_deliverables = @("MTI docs complete", "9 MCP tools promoted", "5 workspace skills created")
    retrospective = @{
        what_went_well = @("Fractal DPDCA applied successfully", "All tests passing")
        what_needs_improvement = @("API sync had redirection issues", "Apply script needed bypass")
        action_items = @("Fix data model API HTTPS redirection", "Update Apply-Project07-Artifacts.ps1 for v4.3.0 templates")
    }
    velocity = 23  # Story points completed
}

# DO: Update sprint
Invoke-RestMethod "$base/model/sprints/$sprintId" -Method PUT -Body ($closeData | ConvertTo-Json -Depth 5) -ContentType "application/json"

# CHECK: Verify closure
$verified = Invoke-RestMethod "$base/model/sprints/$sprintId"
Write-Host "Sprint closed: status = $($verified.status), velocity = $($verified.velocity)"

# ACT: Create next sprint
$nextSprintId = "sprint-48-eva-veritas-6"
$nextSprint = @{
    id = $nextSprintId
    project_id = $projectId
    layer = "sprints"
    sprint_number = 6
    status = "active"
    start_date = (Get-Date -Format "yyyy-MM-dd")
    goal = "Deploy L34 quality gates to production"
    planned_deliverables = @("L34 integration complete", "CI/CD pipeline updated")
}
Invoke-RestMethod "$base/model/sprints/$nextSprintId" -Method PUT -Body ($nextSprint | ConvertTo-Json) -ContentType "application/json"
```

---

## Category 3: Evidence Tracking

**Layer**: `evidence`  
**Purpose**: Immutable audit trail of decisions, test results, and quality gates  
**ID Pattern**: `{type}-{project_id}-{timestamp}` (immutable, append-only)

### Example 1: Record Quality Gate Evaluation

```powershell
# DISCOVER: Current MTI score
$projectId = "51-ACA"
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

$project = Invoke-RestMethod "$base/model/projects/$projectId"
$currentMti = $project.mti_score

# PLAN: Define evidence record
$evidenceId = "quality_gate-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"  # e.g., "quality_gate-51-ACA-20260310084500"
$evidence = @{
    id = $evidenceId
    project_id = $projectId
    layer = "evidence"
    evidence_type = "quality_gate"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    gate_name = "Sprint Advance"
    mti_score = $currentMti
    threshold = 0.70
    passed = ($currentMti -ge 0.70)
    metrics = @{
        coverage = 0.85
        evidence = 0.72
        consistency = 0.78
        complexity = 0.65
        field_population = 0.90
    }
    notes = "MTI formula: coverage*0.35 + evidence*0.20 + consistency*0.25 + complexity*0.10 + field_population*0.10"
}

# DO: Write evidence (immutable)
Invoke-RestMethod "$base/model/evidence/$evidenceId" -Method PUT -Body ($evidence | ConvertTo-Json -Depth 5) -ContentType "application/json"

# CHECK: Verify write (row_version should be 1 for new records)
$verified = Invoke-RestMethod "$base/model/evidence/$evidenceId"
Write-Host "Evidence recorded: row_version = $($verified.row_version) (should be 1)"

# ACT: Cannot modify evidence (immutable), only append new records
# To update, create NEW evidence record with updated timestamp
```

### Example 2: Anti-Trash Pattern (Immutability)

```powershell
# ❌ BAD: Trying to update existing evidence
$existingId = "quality_gate-51-ACA-20260310084500"
$update = @{ mti_score = 0.80 }  # WRONG: Evidence is immutable
Invoke-RestMethod "$base/model/evidence/$existingId" -Method PUT -Body ($update | ConvertTo-Json) -ContentType "application/json"
# This will fail or create duplicate - evidence layer is append-only

# ✅ GOOD: Create new evidence record
$newId = "quality_gate-51-ACA-$(Get-Date -Format 'yyyyMMddHHmmss')"
$newEvidence = @{
    id = $newId
    project_id = "51-ACA"
    layer = "evidence"
    evidence_type = "quality_gate"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    mti_score = 0.80
}
Invoke-RestMethod "$base/model/evidence/$newId" -Method PUT -Body ($newEvidence | ConvertTo-Json) -ContentType "application/json"
```

---

## Category 4: Governance Events

**Layers**: `verification_records`, `quality_gates`, `decisions`, `risks`  
**Purpose**: Multi-layer governance tracking with relationships  
**ID Pattern**: Layer-specific patterns with cross-references

### Example 1: Decision → Quality Gate → Verification Record Flow

```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$projectId = "48-eva-veritas"

# Step 1: Record Decision
$decisionId = "decision-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
$decision = @{
    id = $decisionId
    project_id = $projectId
    layer = "decisions"
    decision_type = "architecture"
    title = "Bypass Apply-Project07-Artifacts.ps1 for v4.3.0 templates"
    rationale = "Apply script incompatible with new template format (expects v2.x structure)"
    alternatives_considered = @("Fix Apply script regex", "Downgrade templates to v2.x")
    decision_maker = "agent:copilot"
    decision_date = (Get-Date -Format "yyyy-MM-dd")
}
Invoke-RestMethod "$base/model/decisions/$decisionId" -Method PUT -Body ($decision | ConvertTo-Json -Depth 5) -ContentType "application/json"

# Step 2: Create Quality Gate referencing decision
$gateId = "gate-$projectId-priming-$(Get-Date -Format 'yyyyMMdd')"
$gate = @{
    id = $gateId
    project_id = $projectId
    layer = "quality_gates"
    gate_name = "Priming System Validation"
    decision_id = $decisionId  # FK reference
    pass_criteria = @{
        test_coverage = 0.80
        all_projects_primed = $true
    }
    status = "pending"
}
Invoke-RestMethod "$base/model/quality_gates/$gateId" -Method PUT -Body ($gate | ConvertTo-Json -Depth 5) -ContentType "application/json"

# Step 3: Record Verification result
$verificationId = "verification-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
$verification = @{
    id = $verificationId
    project_id = $projectId
    layer = "verification_records"
    quality_gate_id = $gateId  # FK reference
    verification_date = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    result = "passed"
    metrics = @{
        projects_primed = "7/7"
        coverage = "60/60 (100%)"
        exit_code = 0
    }
}
Invoke-RestMethod "$base/model/verification_records/$verificationId" -Method PUT -Body ($verification | ConvertTo-Json -Depth 5) -ContentType "application/json"

# Step 4: Update gate status based on verification
$gateUpdate = $gate
$gateUpdate.status = "passed"
$gateUpdate.verification_id = $verificationId
Invoke-RestMethod "$base/model/quality_gates/$gateId" -Method PUT -Body ($gateUpdate | ConvertTo-Json -Depth 5) -ContentType "application/json"
```

---

## Category 5: Infrastructure Observability

**Layers**: `infrastructure_events`, `agent_execution_history`, `deployment_records`  
**Purpose**: Track deployments, agent runs, and infrastructure changes  
**ID Pattern**: `{type}-{YYYYMMDD}-{sequence}` or `{workflow}-{run_id}`

### Example 1: Record Deployment with Agent Execution

```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$projectId = "37-data-model"

# Step 1: Log Infrastructure Event (deployment start)
$eventId = "deploy-$(Get-Date -Format 'yyyyMMdd')-001"
$event = @{
    id = $eventId
    layer = "infrastructure_events"
    project_id = $projectId
    event_type = "deployment_start"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    environment = "production"
    revision = "0000028"
    region = "canadacentral"
}
Invoke-RestMethod "$base/model/infrastructure_events/$eventId" -Method PUT -Body ($event | ConvertTo-Json) -ContentType "application/json"

# Step 2: Record Agent Execution (deployment workflow)
$executionId = "priming-workflow-$(New-Guid)"
$execution = @{
    id = $executionId
    layer = "agent_execution_history"
    project_id = $projectId
    agent_name = "Invoke-PrimeWorkspace.ps1"
    start_time = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    end_time = (Get-Date).AddMinutes(5).ToString("yyyy-MM-ddTHH:mm:sszzz")
    status = "completed"
    exit_code = 0
    input_parameters = @{
        TargetPath = "C:\eva-foundry\20-assistme"
    }
    output_summary = @{
        projects_processed = 1
        files_created = 1
        exit_code = 0
    }
    related_event_id = $eventId  # FK reference
}
Invoke-RestMethod "$base/model/agent_execution_history/$executionId" -Method PUT -Body ($execution | ConvertTo-Json -Depth 5) -ContentType "application/json"

# Step 3: Record Deployment Completion
$deploymentId = "deployment-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
$deployment = @{
    id = $deploymentId
    layer = "deployment_records"
    project_id = $projectId
    deployment_date = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    environment = "production"
    revision = "0000028"
    status = "success"
    agent_execution_id = $executionId  # FK reference
    infrastructure_event_id = $eventId  # FK reference
}
Invoke-RestMethod "$base/model/deployment_records/$deploymentId" -Method PUT -Body ($deployment | ConvertTo-Json -Depth 5) -ContentType "application/json"
```

---

## Category 6: Ontology Domains

**Purpose**: Navigate 12 conceptual domains (projects, technical, governance, execution, strategy, observability, agent, integration, workflow, infra, optimization, telemetry)  
**Start Here Layers**: Each domain has a designated starting point for DISCOVER phase

### Example 1: Navigate Projects Domain

```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# DISCOVER: Start with projects layer (domain entry point)
$allProjects = Invoke-RestMethod "$base/model/projects"
Write-Host "Total projects: $($allProjects.records.Count)"

# Find active projects
$activeProjects = $allProjects.records | Where-Object { $_.maturity -eq "active" }
Write-Host "Active projects: $($activeProjects.Count)"

# PLAN: Select project and traverse to related entities
$selectedProject = $activeProjects[0]
$projectId = $selectedProject.id

# DO: Query related layers
$workSessions = Invoke-RestMethod "$base/model/project_work?project_id=$projectId"
$evidence = Invoke-RestMethod "$base/model/evidence?project_id=$projectId"
$decisions = Invoke-RestMethod "$base/model/decisions?project_id=$projectId"

# CHECK: Verify relationships
Write-Host "Project: $projectId"
Write-Host "  Sessions: $($workSessions.records.Count)"
Write-Host "  Evidence: $($evidence.records.Count)"
Write-Host "  Decisions: $($decisions.records.Count)"

# ACT: Document navigation path for future sessions
```

### Example 2: Navigate Governance Domain

```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$projectId = "48-eva-veritas"

# DISCOVER: Start with quality_gates (governance domain entry point)
$gates = Invoke-RestMethod "$base/model/quality_gates?project_id=$projectId"
Write-Host "Quality gates: $($gates.records.Count)"

# Traverse to verification records
foreach ($gate in $gates.records) {
    if ($gate.verification_id) {
        $verification = Invoke-RestMethod "$base/model/verification_records/$($gate.verification_id)"
        Write-Host "Gate: $($gate.gate_name) → Result: $($verification.result)"
    }
}

# Traverse to decisions
$decisions = Invoke-RestMethod "$base/model/decisions?project_id=$projectId"
foreach ($decision in $decisions.records) {
    Write-Host "Decision: $($decision.title) → Date: $($decision.decision_date)"
}
```

---

## Query Safety Patterns

**From `/model/agent-guide`** - Critical limits to prevent timeout and terminal scramble:

### Safe Batch Sizes

```powershell
# ✅ GOOD: Query with limit
$limited = Invoke-RestMethod "$base/model/evidence?project_id=37-data-model&limit=50"

# ❌ BAD: No limit on large layer
$unlimited = Invoke-RestMethod "$base/model/evidence"  # May return 1000+ records

# ✅ GOOD: Paginate for large datasets
$page1 = Invoke-RestMethod "$base/model/evidence?limit=50&offset=0"
$page2 = Invoke-RestMethod "$base/model/evidence?limit=50&offset=50"
```

### Filter Early

```powershell
# ✅ GOOD: Filter at API level
$filtered = Invoke-RestMethod "$base/model/project_work?project_id=37-data-model&status=completed"

# ❌ BAD: Fetch all then filter locally
$all = Invoke-RestMethod "$base/model/project_work"
$filtered = $all.records | Where-Object { $_.status -eq "completed" }  # Wastes bandwidth
```

---

## Common Mistakes (from `/model/user-guide`)

### 1. Generic IDs Without Context

```powershell
# ❌ BAD: Generic ID
$badId = "session-1"  # No project context, no date

# ✅ GOOD: Contextual ID
$goodId = "37-data-model-2026-03-10"  # Clear project + date
```

### 2. Modifying Immutable Evidence

```powershell
# ❌ BAD: Trying to update evidence
PUT /model/evidence/quality_gate-51-ACA-20260310084500
{ "mti_score": 0.85 }  # Evidence is immutable

# ✅ GOOD: Create new evidence record
PUT /model/evidence/quality_gate-51-ACA-20260310090000
{ "mti_score": 0.85 }
```

### 3. Orphan Records (No Foreign Keys)

```powershell
# ❌ BAD: Verification without gate reference
$verification = @{
    id = "verification-123"
    result = "passed"
    # Missing: quality_gate_id FK
}

# ✅ GOOD: Complete relationships
$verification = @{
    id = "verification-123"
    quality_gate_id = "gate-48-eva-veritas-priming-20260310"  # FK reference
    result = "passed"
}
```

### 4. Bulk Operations Without Visibility

```powershell
# ❌ BAD: Bulk write with no feedback
foreach ($record in $records) {
    Invoke-RestMethod "$base/model/evidence/$($record.id)" -Method PUT -Body ($record | ConvertTo-Json)
}
# Silent failures, no per-record verification

# ✅ GOOD: Fractal DPDCA per record
foreach ($record in $records) {
    # DO
    Invoke-RestMethod "$base/model/evidence/$($record.id)" -Method PUT -Body ($record | ConvertTo-Json)
    # CHECK
    $verified = Invoke-RestMethod "$base/model/evidence/$($record.id)"
    Write-Host "✅ $($record.id): row_version = $($verified.row_version)"
}
```

---

## Next Steps

1. **Read API Guide**: `GET /model/agent-guide` for query patterns and write cycle rules
2. **Read User Guide**: `GET /model/user-guide` for all 6 category runbooks with full details
3. **Follow Examples**: Use these patterns as templates for your own operations
4. **Apply Fractal DPDCA**: DISCOVER → PLAN → DO → CHECK → ACT at every operation level

**Remember**: The API is your single source of truth. Always bootstrap from `/model/agent-guide` and `/model/user-guide` before starting work.

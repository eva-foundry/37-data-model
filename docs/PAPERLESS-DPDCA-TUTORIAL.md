# Paperless DPDCA Tutorial

**Version**: 1.0.0 (Session 43)  
**Last Updated**: 2026-03-10 09:00 ET  
**Purpose**: Step-by-step guide to API-first, paperless governance using the Data Model

---

## What is Paperless DPDCA?

**Traditional Governance** (File-Based):
```
Project/
├── PLAN.md          # Sprint goals, deliverables
├── STATUS.md        # Progress updates, blockers
├── ACCEPTANCE.md    # Completion criteria
└── evidence/        # Test results, quality gates
    └── sprint-5-results.json
```

**Paperless Governance** (API-First):
```
Project/
├── README.md        # Only file needed (user-facing docs)
└── .eva/            # Evidence cache (local only)
    └── prime-evidence.json
```

All governance truth lives in the **Data Model API** (Project 37):
- `GET /model/projects/{project_id}` → Project metadata
- `GET /model/project_work?project_id={id}` → Work sessions
- `GET /model/sprints?project_id={id}` → Sprint tracking
- `GET /model/evidence?project_id={id}` → Audit trail
- `GET /model/quality_gates?project_id={id}` → Quality gates

**Benefits**:
- ✅ Single source of truth (no file sync issues)
- ✅ Immutable audit trail (evidence layer is append-only)
- ✅ Cross-project queries (portfolio-level reporting)
- ✅ API-driven automation (CI/CD integration)
- ✅ Version controlled via `row_version` (optimistic concurrency)

---

## Step 1: Bootstrap Your Session

**EVERY agent session must start here** before any work.

### 1.1: Fetch Agent Guide (Query Patterns)

```powershell
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

# Get comprehensive guidance
$session = @{
    base = $base
    guide = (Invoke-RestMethod "$base/model/agent-guide")
    userGuide = (Invoke-RestMethod "$base/model/user-guide")
}

# Now you have access to:
# - $session.guide.query_patterns (safe batch sizes, filter strategies)
# - $session.guide.write_cycle (PUT workflow, row_version handling)
# - $session.guide.common_mistakes (what NOT to do)
# - $session.guide.layers_available (all 91 operational layers)
# - $session.userGuide.category_instructions (6 deterministic runbooks)
```

**Why This Matters**:
- `query_patterns` prevents timeout/terminal scramble (sets safe limits)
- `write_cycle` prevents data corruption (explains row_version)
- `common_mistakes` prevents trash data (no generic IDs, no orphans)
- `category_instructions` provides deterministic workflows (ID patterns, query sequences)

### 1.2: Create Baseline Snapshot

```powershell
# Get current state of your project
$projectId = "37-data-model"  # or your project
$baseline = Invoke-RestMethod "$base/model/agent-summary?project_id=$projectId"

# Snapshot contains:
# - project_metadata: name, maturity, mti_score
# - recent_sessions: last 5 work sessions
# - active_sprints: current sprint status
# - pending_gates: quality gates awaiting verification
# - recent_evidence: last 10 audit records

Write-Host "Project: $($baseline.project_metadata.name)"
Write-Host "MTI Score: $($baseline.project_metadata.mti_score)"
Write-Host "Active Sprint: $($baseline.active_sprints[0].goal)"
```

---

## Step 2: Plan Your Work (Fractal DPDCA)

### 2.1: Create Session Record

```powershell
# Session ID format: {project_id}-{YYYY-MM-DD} (max one per day)
$sessionId = "$projectId-$(Get-Date -Format 'yyyy-MM-dd')"

# DISCOVER: Check if today's session exists
$existing = Invoke-RestMethod "$base/model/project_work/$sessionId" -ErrorAction SilentlyContinue

if ($existing) {
    Write-Host "Session already exists: $($existing.goal)"
    # Update existing session
    $session = $existing
} else {
    # Create new session
    $session = @{
        id = $sessionId
        project_id = $projectId
        layer = "project_work"
        session_date = (Get-Date -Format "yyyy-MM-dd")
        goal = "Implement L34 quality gates integration"
        planned_deliverables = @(
            "L34 schema deployed",
            "Adaptive MTI formula integrated",
            "CI/CD pipeline updated"
        )
        status = "in_progress"
        started_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    }
    
    # DO: Create session
    Invoke-RestMethod "$base/model/project_work/$sessionId" -Method PUT `
        -Body ($session | ConvertTo-Json -Depth 5) `
        -ContentType "application/json"
    
    # CHECK: Verify creation
    $verified = Invoke-RestMethod "$base/model/project_work/$sessionId"
    Write-Host "✅ Session created: row_version = $($verified.row_version)"
}
```

### 2.2: Break Into Components (Fractal DPDCA)

```powershell
# Don't plan the session as a monolith - break into trackable units
$components = @(
    @{
        name = "L34 Schema Design"
        layer = "schemas"
        deliverable = "quality_gates.schema.json"
        estimated_hours = 2
    },
    @{
        name = "MTI Formula Implementation"
        layer = "infrastructure_components"
        deliverable = "adaptive-mti.js"
        estimated_hours = 4
    },
    @{
        name = "Integration Tests"
        layer = "tests"
        deliverable = "quality-gates.test.js passing"
        estimated_hours = 3
    }
)

# For each component, apply full DPDCA cycle (tracked separately)
```

---

## Step 3: Execute Work (DO Phase)

### 3.1: Work on ONE Component at a Time

```powershell
# Example: Component 1 - L34 Schema Design

# DISCOVER
Write-Host "[DISCOVER] Component: L34 Schema Design"
$existingSchema = Test-Path "C:\eva-foundry\37-data-model\schemas\quality_gates.schema.json"
Write-Host "  Existing schema: $existingSchema"

# PLAN
Write-Host "[PLAN] Create schema with fields:"
Write-Host "  - gate_id, project_id, gate_name, pass_criteria, status, verification_id"

# DO
$schema = @{
    "$schema" = "http://json-schema.org/draft-07/schema#"
    type = "object"
    properties = @{
        gate_id = @{ type = "string"; pattern = "^gate-[a-z0-9-]+-[0-9]{8}$" }
        project_id = @{ type = "string" }
        gate_name = @{ type = "string" }
        pass_criteria = @{ type = "object" }
        status = @{ type = "string"; enum = @("pending", "passed", "failed") }
        verification_id = @{ type = "string" }
    }
    required = @("gate_id", "project_id", "gate_name", "status")
}
$schema | ConvertTo-Json -Depth 10 | Out-File "schemas/quality_gates.schema.json"

# CHECK
$created = Test-Path "schemas/quality_gates.schema.json"
$content = Get-Content "schemas/quality_gates.schema.json" -Raw | ConvertFrom-Json
$valid = ($content.properties.gate_id -ne $null)

Write-Host "[CHECK] Schema created: $created, Valid: $valid"

# ACT: Record evidence
$evidenceId = "schema_created-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
$evidence = @{
    id = $evidenceId
    project_id = $projectId
    layer = "evidence"
    evidence_type = "schema_validation"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    component = "L34 Schema Design"
    result = "success"
    artifacts = @("schemas/quality_gates.schema.json")
}
Invoke-RestMethod "$base/model/evidence/$evidenceId" -Method PUT `
    -Body ($evidence | ConvertTo-Json -Depth 5) `
    -ContentType "application/json"

Write-Host "✅ Component 1 complete, evidence recorded: $evidenceId"
```

### 3.2: Repeat for Each Component

```powershell
foreach ($component in $components) {
    Write-Host "`n=== COMPONENT: $($component.name) ===" -ForegroundColor Cyan
    
    # DISCOVER → PLAN → DO → CHECK → ACT
    # (full DPDCA cycle per component)
    
    # Record evidence after each component
    $evidenceId = "component_complete-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $evidence = @{
        id = $evidenceId
        project_id = $projectId
        layer = "evidence"
        evidence_type = "component_completion"
        timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
        component = $component.name
        deliverable = $component.deliverable
        result = "success"
    }
    Invoke-RestMethod "$base/model/evidence/$evidenceId" -Method PUT `
        -Body ($evidence | ConvertTo-Json -Depth 5) `
        -ContentType "application/json"
}
```

---

## Step 4: Validate Quality (CHECK Phase)

### 4.1: Run Quality Gate Evaluation

```powershell
# After all components complete, evaluate quality gates
$gateId = "gate-$projectId-l34-integration-$(Get-Date -Format 'yyyyMMdd')"

$gate = @{
    id = $gateId
    project_id = $projectId
    layer = "quality_gates"
    gate_name = "L34 Integration Complete"
    pass_criteria = @{
        all_components_complete = $true
        all_tests_passing = $true
        mti_threshold = 0.70
    }
    status = "pending"
    evaluated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
}

# Create gate
Invoke-RestMethod "$base/model/quality_gates/$gateId" -Method PUT `
    -Body ($gate | ConvertTo-Json -Depth 5) `
    -ContentType "application/json"

# Run MTI audit (using Project 48 - EVA Veritas)
Write-Host "`n[RUNNING] MTI Audit..."
# In real workflow, invoke: eva audit_repo or MCP tool
# For tutorial, simulate:
$mtiScore = 0.78  # From audit

# Record verification
$verificationId = "verification-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
$verification = @{
    id = $verificationId
    project_id = $projectId
    layer = "verification_records"
    quality_gate_id = $gateId
    verification_date = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    result = if ($mtiScore -ge 0.70) { "passed" } else { "failed" }
    metrics = @{
        mti_score = $mtiScore
        threshold = 0.70
        components_complete = 3
        tests_passing = $true
    }
}

Invoke-RestMethod "$base/model/verification_records/$verificationId" -Method PUT `
    -Body ($verification | ConvertTo-Json -Depth 5) `
    -ContentType "application/json"

# Update gate with result
$gate.status = $verification.result
$gate.verification_id = $verificationId
Invoke-RestMethod "$base/model/quality_gates/$gateId" -Method PUT `
    -Body ($gate | ConvertTo-Json -Depth 5) `
    -ContentType "application/json"

Write-Host "✅ Quality gate: $($gate.status)"
```

---

## Step 5: Close the Session (ACT Phase)

### 5.1: Update Session with Results

```powershell
# Fetch current session
$session = Invoke-RestMethod "$base/model/project_work/$sessionId"

# Update with actual deliverables
$session.actual_deliverables = @(
    "L34 schema deployed: quality_gates.schema.json",
    "Adaptive MTI formula: adaptive-mti.js (78% confidence)",
    "Integration tests: 15/15 passing",
    "Quality gate: PASSED (MTI 0.78 > 0.70)"
)
$session.status = "completed"
$session.completion_date = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
$session.mti_score_at_completion = 0.78
$session.quality_gate_id = $gateId

# Write back to API
Invoke-RestMethod "$base/model/project_work/$sessionId" -Method PUT `
    -Body ($session | ConvertTo-Json -Depth 5) `
    -ContentType "application/json"

Write-Host "✅ Session completed and recorded"
```

### 5.2: Generate Session Summary

```powershell
# Query all session artifacts
$sessionEvidence = Invoke-RestMethod "$base/model/evidence?project_id=$projectId&session_id=$sessionId"
$sessionGates = Invoke-RestMethod "$base/model/quality_gates?project_id=$projectId&session_date=$(Get-Date -Format 'yyyy-MM-dd')"

# Generate summary
Write-Host "`n=== SESSION SUMMARY ===" -ForegroundColor Green
Write-Host "Session: $sessionId"
Write-Host "Goal: $($session.goal)"
Write-Host "Status: $($session.status)"
Write-Host "Evidence Records: $($sessionEvidence.records.Count)"
Write-Host "Quality Gates: $($sessionGates.records.Count) ($(($sessionGates.records | Where-Object status -eq 'passed').Count) passed)"
Write-Host "MTI Score: $($session.mti_score_at_completion)"
Write-Host ""
```

---

## Step 6: Sprint Integration (Optional)

### 6.1: Update Sprint Status

```powershell
# If this session closes a sprint, update sprint record
$currentSprintQuery = Invoke-RestMethod "$base/model/sprints?project_id=$projectId&status=active"
if ($currentSprintQuery.records.Count -gt 0) {
    $sprint = $currentSprintQuery.records[0]
    $sprintId = $sprint.id
    
    # Add session to sprint deliverables
    $sprint.completed_sessions += $sessionId
    $sprint.mti_score_at_close = $session.mti_score_at_completion
    
    # If sprint goals met, close it
    if ($sprint.completed_sessions.Count -ge $sprint.planned_session_count) {
        $sprint.status = "completed"
        $sprint.end_date = (Get-Date -Format "yyyy-MM-dd")
        $sprint.retrospective = @{
            what_went_well = @("Fractal DPDCA applied to all components", "Quality gates passed")
            what_needs_improvement = @("Need more automated testing")
            action_items = @("Add pre-commit hooks", "Automate MTI audits")
        }
        
        Invoke-RestMethod "$base/model/sprints/$sprintId" -Method PUT `
            -Body ($sprint | ConvertTo-Json -Depth 5) `
            -ContentType "application/json"
        
        Write-Host "✅ Sprint $sprintId closed"
    }
}
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Not Bootstrapping from API

```powershell
# ❌ BAD: Assume you know the schema
$session = @{ id = "session-123"; goal = "Do work" }
PUT /model/project_work/session-123
# Fails: Missing required fields, wrong ID format

# ✅ GOOD: Bootstrap from user-guide first
$userGuide = Invoke-RestMethod "$base/model/user-guide"
$sessionPattern = $userGuide.categories.session_tracking
# Now you know: ID format is {project_id}-{YYYY-MM-DD}, required fields, query sequence
```

### Pitfall 2: Bulk Operations Without Visibility

```powershell
# ❌ BAD: Bulk write with no per-record feedback
foreach ($record in $records) {
    PUT /model/evidence/$($record.id)
}
# Silent failures, no checkpoint validation

# ✅ GOOD: Fractal DPDCA per record
foreach ($record in $records) {
    # DO
    Invoke-RestMethod "$base/model/evidence/$($record.id)" -Method PUT -Body ($record | ConvertTo-Json)
    # CHECK
    $verified = Invoke-RestMethod "$base/model/evidence/$($record.id)"
    if ($verified.row_version -ne 1) { Write-Warning "Unexpected row_version for $($record.id)" }
    # ACT
    Write-Host "✅ $($record.id): row_version = $($verified.row_version)"
}
```

### Pitfall 3: Ignoring row_version (Optimistic Concurrency)

```powershell
# ❌ BAD: Blindly overwrite without checking row_version
$session = GET /model/project_work/37-data-model-2026-03-10
$session.status = "completed"
PUT /model/project_work/37-data-model-2026-03-10 -Body $session
# If another process updated between GET and PUT, you've lost their changes

# ✅ GOOD: Include row_version for conflict detection
$session = GET /model/project_work/37-data-model-2026-03-10
$session.status = "completed"
PUT /model/project_work/37-data-model-2026-03-10 -Body $session -Headers @{"If-Match"=$session.row_version}
# API returns 409 Conflict if row_version doesn't match (another update happened)
```

### Pitfall 4: Generic IDs Without Context

```powershell
# ❌ BAD: Generic ID
$sessionId = "session-1"  # No project, no date

# ✅ GOOD: Contextual ID following pattern
$sessionId = "37-data-model-2026-03-10"  # Clear project + date, follows {project_id}-{YYYY-MM-DD} pattern
```

### Pitfall 5: Orphan Records (Missing Foreign Keys)

```powershell
# ❌ BAD: Verification without gate reference
$verification = @{
    id = "verification-123"
    result = "passed"
    # Missing: quality_gate_id
}
# Creates orphan record - can't trace back to what was verified

# ✅ GOOD: Complete relationships
$verification = @{
    id = "verification-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
    quality_gate_id = $gateId  # FK reference
    project_id = $projectId
    result = "passed"
}
```

---

## Integration with Existing Tools

### With Project 48 (EVA Veritas)

```powershell
# Use Veritas MCP tools for MTI auditing
# Tool: audit_repo
$auditResult = Invoke-MCPTool -Name "audit_repo" -Arguments @{
    repo_path = "C:\eva-foundry\37-data-model"
}

# Record audit result as evidence
$evidenceId = "mti_audit-37-data-model-$(Get-Date -Format 'yyyyMMddHHmmss')"
$evidence = @{
    id = $evidenceId
    project_id = "37-data-model"
    layer = "evidence"
    evidence_type = "mti_audit"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
    mti_score = $auditResult.trust_score
    metrics = $auditResult.metrics
}
Invoke-RestMethod "$base/model/evidence/$evidenceId" -Method PUT `
    -Body ($evidence | ConvertTo-Json -Depth 5) `
    -ContentType "application/json"
```

### With Priming Scripts (Invoke-PrimeWorkspace.ps1)

```powershell
# Priming script already integrates with paperless governance
# Step 7 of Invoke-PrimeWorkspace.ps1:
#   - Queries /model/projects/{project_id} (GET)
#   - Creates/updates project record (PUT)
#   - Writes evidence to .eva/prime-evidence.json (local cache)

# Evidence is automatically synced during priming
& "C:\eva-foundry\07-foundation-layer\scripts\deployment\Invoke-PrimeWorkspace.ps1" `
    -TargetPath "C:\eva-foundry\20-assistme"

# Check evidence in API
$primeEvidence = Invoke-RestMethod "$base/model/evidence?project_id=20-assistme&evidence_type=priming"
Write-Host "Priming evidence records: $($primeEvidence.records.Count)"
```

---

## Complete Example: End-to-End Session

```powershell
# SETUP
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$projectId = "48-eva-veritas"
$sessionId = "$projectId-$(Get-Date -Format 'yyyy-MM-dd')"

# BOOTSTRAP
$guide = Invoke-RestMethod "$base/model/agent-guide"
$userGuide = Invoke-RestMethod "$base/model/user-guide"
$baseline = Invoke-RestMethod "$base/model/agent-summary?project_id=$projectId"

# CREATE SESSION
$session = @{
    id = $sessionId
    project_id = $projectId
    layer = "project_work"
    session_date = (Get-Date -Format "yyyy-MM-dd")
    goal = "Fix priming system bugs"
    planned_deliverables = @("Fixed 5 bugs", "Primed 7 projects")
    status = "in_progress"
}
Invoke-RestMethod "$base/model/project_work/$sessionId" -Method PUT `
    -Body ($session | ConvertTo-Json) -ContentType "application/json"

# DO WORK (Component 1: Bug Fix)
Write-Host "[Component 1] Fixing API sync error handling..."
# ... actual work ...

# RECORD EVIDENCE
$evidenceId = "bugfix-$projectId-$(Get-Date -Format 'yyyyMMddHHmmss')"
$evidence = @{
    id = $evidenceId
    project_id = $projectId
    layer = "evidence"
    evidence_type = "bugfix"
    component = "Component 1: API Sync"
    result = "success"
    timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
}
Invoke-RestMethod "$base/model/evidence/$evidenceId" -Method PUT `
    -Body ($evidence | ConvertTo-Json) -ContentType "application/json"

# QUALITY GATE
$gateId = "gate-$projectId-priming-$(Get-Date -Format 'yyyyMMdd')"
$gate = @{
    id = $gateId
    project_id = $projectId
    layer = "quality_gates"
    gate_name = "Priming System Validation"
    pass_criteria = @{ all_projects_primed = $true; coverage = 1.0 }
    status = "passed"
}
Invoke-RestMethod "$base/model/quality_gates/$gateId" -Method PUT `
    -Body ($gate | ConvertTo-Json) -ContentType "application/json"

# CLOSE SESSION
$session.status = "completed"
$session.actual_deliverables = @("Fixed 5 bugs", "Primed 7/7 projects")
$session.quality_gate_id = $gateId
$session.completion_date = (Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz")
Invoke-RestMethod "$base/model/project_work/$sessionId" -Method PUT `
    -Body ($session | ConvertTo-Json) -ContentType "application/json"

Write-Host "✅ Session complete with full audit trail"
```

---

## Next Steps

1. **Practice with Test Project**: Use `99-test-project` for safe experimentation
2. **Review Examples**: See [CATEGORY-RUNBOOK-EXAMPLES.md](./CATEGORY-RUNBOOK-EXAMPLES.md) for real-world patterns
3. **Integrate with CI/CD**: Add paperless governance checks to GitHub Actions
4. **Explore Veritas**: Use MCP tools from Project 48 for automated auditing
5. **Read API Documentation**: Bootstrap from `/model/agent-guide` before every session

**Remember**: Fractal DPDCA applies at EVERY level:
- Session → Feature → Component → Operation → API Call

**Always**:
- Bootstrap from API first (agent-guide + user-guide)
- Query before write (GET → PUT, never blind PUT)
- Verify after write (CHECK row_version)
- Record evidence (immutable audit trail)
- Use proper ID formats (follow category patterns)

**The API is your single source of truth. Trust it.**

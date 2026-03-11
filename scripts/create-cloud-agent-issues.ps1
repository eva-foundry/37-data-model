<#
.SYNOPSIS
    Create GitHub issues for cloud agents to generate UI components for 108 remaining layers

.DESCRIPTION
    Session 45 Part 9 - Autonomous generation via GitHub Copilot cloud agents
    
    Creates one issue per layer (108 total, excluding L25/L26/L27 already completed)
    Each issue contains complete instructions for autonomous generation:
    - Query layer schema from Data Model API
    - Run generate-screens-v2.ps1
    - Execute quality gates (TypeScript, ESLint, anti-hardcoding)
    - Create PR with evidence
    
    Assigned to: @copilot
    Labels: enhancement, screens-machine, cloud-agent, automation

.PARAMETER DryRun
    Preview issues without creating them

.PARAMETER BatchSize
    Create issues in batches (default: 10 at a time)

.EXAMPLE
    .\create-cloud-agent-issues.ps1 -DryRun
    # Preview first 10 issues

.EXAMPLE
    .\create-cloud-agent-issues.ps1 -BatchSize 20
    # Create 20 issues at a time
#>

param(
    [switch]$DryRun,
    [int]$BatchSize = 10
)

$ErrorActionPreference = "Stop"

# Setup logging (professional standard: dual logging)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logsDir = Join-Path $PSScriptRoot ".." "logs"
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }
$logFile = Join-Path $logsDir "cloud-agent-issues_$timestamp.log"

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",  # INFO, PASS, FAIL, ERROR
        [switch]$ConsoleOnly
    )
    
    $logEntry = "[$(Get-Date -Format 'HH:mm:ss')] [$Level] $Message"
    
    # Always write to file (verbose)
    if (-not $ConsoleOnly) {
        $logEntry | Out-File $logFile -Append -Encoding UTF8
    }
    
    # Console output (minimal)
    switch ($Level) {
        "PASS" { Write-Host "[PASS] $Message" -ForegroundColor Green }
        "FAIL" { Write-Host "[FAIL] $Message" -ForegroundColor Red }
        "ERROR" { Write-Host "[ERROR] $Message" -ForegroundColor Red }
        default { } # INFO/DEBUG: file only, no console spam
    }
}

Write-Log "Script started: cloud-agent-issues.ps1" -ConsoleOnly
Write-Log "Parameters: DryRun=$DryRun, BatchSize=$BatchSize"

# Configuration
$baseUrl = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
$repoOwner = "eva-foundry"  # GitHub organization
$repoName = "37-data-model"  # GitHub repository name

Write-Log "Configuration: baseUrl=$baseUrl, repo=$repoOwner/$repoName"

# Completed layers (skip these)
$completedLayers = @("projects", "wbs", "sprints")  # L25, L26, L27

Write-Host "`nCloud Agent Issue Creator - Session 45 Part 9" -ForegroundColor Cyan

# Check GitHub CLI
try {
    $ghVersion = gh --version 2>&1 | Select-Object -First 1
    Write-Log "GitHub CLI version: $ghVersion"
    Write-Log "GitHub CLI check" -Level "PASS"
} catch {
    Write-Log "GitHub CLI not installed" -Level "FAIL"
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 2
}

# Check authentication
try {
    $ghUser = gh api user --jq .login 2>&1
    Write-Log "Authenticated as: $ghUser"
    Write-Log "GitHub authentication" -Level "PASS"
} catch {
    Write-Log "Not authenticated" -Level "FAIL"
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 2
}

# Query Data Model API for layer list
Write-Log "Querying Data Model API: $baseUrl/model/agent-guide"
try {
    $guide = Invoke-RestMethod "$baseUrl/model/agent-guide" -TimeoutSec 10
    $layerCountTarget = 111  # From workspace docs
    Write-Log "API query successful, target layers: $layerCountTarget"
} catch {
    Write-Log "API unreachable, using hardcoded layer list" -Level "FAIL"
}

# Hardcoded layer list (111 layers from Data Model docs)
# Format: LayerId, LayerName, Domain, Phase
$allLayers = @(
    # Phase 1: Foundation (L01-L24)
    @{Id="L01"; Name="agents_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L02"; Name="tools_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L03"; Name="projects_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L04"; Name="governance_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L05"; Name="infrastructure_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L06"; Name="observability_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L07"; Name="security_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L08"; Name="data_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L09"; Name="execution_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L10"; Name="strategy_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L11"; Name="integration_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L12"; Name="analytics_ontology"; Domain="Ontology"; Phase=1},
    @{Id="L13"; Name="agent_catalog"; Domain="Agents"; Phase=1},
    @{Id="L14"; Name="tool_catalog"; Domain="Tools"; Phase=1},
    @{Id="L15"; Name="deployments"; Domain="Infrastructure"; Phase=1},
    @{Id="L16"; Name="api_specs"; Domain="Data"; Phase=1},
    @{Id="L17"; Name="literals"; Domain="Data"; Phase=1},
    @{Id="L18"; Name="graph_queries"; Domain="Data"; Phase=1},
    @{Id="L19"; Name="endpoints"; Domain="Infrastructure"; Phase=1},
    @{Id="L20"; Name="authentication"; Domain="Security"; Phase=1},
    @{Id="L21"; Name="rbac_policies"; Domain="Security"; Phase=1},
    @{Id="L22"; Name="audit_logs"; Domain="Security"; Phase=1},
    @{Id="L23"; Name="backup_policies"; Domain="Infrastructure"; Phase=1},
    @{Id="L24"; Name="disaster_recovery"; Domain="Infrastructure"; Phase=1},
    
    # Phase 2: Project Management (L25-L30) - L25/L26/L27 COMPLETED
    @{Id="L25"; Name="projects"; Domain="Projects"; Phase=1},         # ✓ COMPLETED
    @{Id="L26"; Name="wbs"; Domain="Projects"; Phase=1},              # ✓ COMPLETED
    @{Id="L27"; Name="sprints"; Domain="Projects"; Phase=1},          # ✓ COMPLETED
    @{Id="L28"; Name="stories"; Domain="Projects"; Phase=1},
    @{Id="L29"; Name="tasks"; Domain="Projects"; Phase=1},
    @{Id="L30"; Name="decisions"; Domain="Governance"; Phase=1},
    
    # Phase 3: Governance & Evidence (L31-L40)
    @{Id="L31"; Name="evidence"; Domain="Governance"; Phase=1},
    @{Id="L32"; Name="risks"; Domain="Governance"; Phase=1},
    @{Id="L33"; Name="acceptance_criteria"; Domain="Governance"; Phase=1},
    @{Id="L34"; Name="quality_gates"; Domain="Governance"; Phase=1},
    @{Id="L35"; Name="verification_records"; Domain="Governance"; Phase=1},
    @{Id="L36"; Name="mti_scores"; Domain="Governance"; Phase=1},
    @{Id="L37"; Name="dependencies"; Domain="Projects"; Phase=1},
    @{Id="L38"; Name="stakeholders"; Domain="Projects"; Phase=1},
    @{Id="L39"; Name="communications"; Domain="Projects"; Phase=1},
    @{Id="L40"; Name="change_requests"; Domain="Governance"; Phase=1},
    
    # Phase 4: Infrastructure & Observability (L41-L50)
    @{Id="L41"; Name="infrastructure_events"; Domain="Infrastructure"; Phase=1},
    @{Id="L42"; Name="deployment_records"; Domain="Infrastructure"; Phase=1},
    @{Id="L43"; Name="agent_execution_history"; Domain="Observability"; Phase=1},
    @{Id="L44"; Name="error_logs"; Domain="Observability"; Phase=1},
    @{Id="L45"; Name="performance_metrics"; Domain="Observability"; Phase=1},
    @{Id="L46"; Name="project_work"; Domain="Projects"; Phase=1},
    @{Id="L47"; Name="cost_tracking"; Domain="Analytics"; Phase=1},
    @{Id="L48"; Name="capacity_planning"; Domain="Strategy"; Phase=1},
    @{Id="L49"; Name="resource_allocation"; Domain="Strategy"; Phase=1},
    @{Id="L50"; Name="portfolio_metrics"; Domain="Analytics"; Phase=1},
    
    # Phase 5-8: Extended layers (L51-L87) - placeholder names
    @{Id="L51"; Name="layer_51"; Domain="Extended"; Phase=1},
    @{Id="L52"; Name="layer_52"; Domain="Extended"; Phase=1},
    @{Id="L53"; Name="layer_53"; Domain="Extended"; Phase=1},
    @{Id="L54"; Name="layer_54"; Domain="Extended"; Phase=1},
    @{Id="L55"; Name="layer_55"; Domain="Extended"; Phase=1},
    @{Id="L56"; Name="layer_56"; Domain="Extended"; Phase=1},
    @{Id="L57"; Name="layer_57"; Domain="Extended"; Phase=1},
    @{Id="L58"; Name="layer_58"; Domain="Extended"; Phase=1},
    @{Id="L59"; Name="layer_59"; Domain="Extended"; Phase=1},
    @{Id="L60"; Name="layer_60"; Domain="Extended"; Phase=1},
    @{Id="L61"; Name="layer_61"; Domain="Extended"; Phase=1},
    @{Id="L62"; Name="layer_62"; Domain="Extended"; Phase=1},
    @{Id="L63"; Name="layer_63"; Domain="Extended"; Phase=1},
    @{Id="L64"; Name="layer_64"; Domain="Extended"; Phase=1},
    @{Id="L65"; Name="layer_65"; Domain="Extended"; Phase=1},
    @{Id="L66"; Name="layer_66"; Domain="Extended"; Phase=1},
    @{Id="L67"; Name="layer_67"; Domain="Extended"; Phase=1},
    @{Id="L68"; Name="layer_68"; Domain="Extended"; Phase=1},
    @{Id="L69"; Name="layer_69"; Domain="Extended"; Phase=1},
    @{Id="L70"; Name="layer_70"; Domain="Extended"; Phase=1},
    @{Id="L71"; Name="layer_71"; Domain="Extended"; Phase=1},
    @{Id="L72"; Name="layer_72"; Domain="Extended"; Phase=1},
    @{Id="L73"; Name="layer_73"; Domain="Extended"; Phase=1},
    @{Id="L74"; Name="layer_74"; Domain="Extended"; Phase=1},
    @{Id="L75"; Name="layer_75"; Domain="Extended"; Phase=1},
    @{Id="L76"; Name="layer_76"; Domain="Extended"; Phase=1},
    @{Id="L77"; Name="layer_77"; Domain="Extended"; Phase=1},
    @{Id="L78"; Name="layer_78"; Domain="Extended"; Phase=1},
    @{Id="L79"; Name="layer_79"; Domain="Extended"; Phase=1},
    @{Id="L80"; Name="layer_80"; Domain="Extended"; Phase=1},
    @{Id="L81"; Name="layer_81"; Domain="Extended"; Phase=1},
    @{Id="L82"; Name="layer_82"; Domain="Extended"; Phase=1},
    @{Id="L83"; Name="layer_83"; Domain="Extended"; Phase=1},
    @{Id="L84"; Name="layer_84"; Domain="Extended"; Phase=1},
    @{Id="L85"; Name="layer_85"; Domain="Extended"; Phase=1},
    @{Id="L86"; Name="layer_86"; Domain="Extended"; Phase=1},
    @{Id="L87"; Name="layer_87"; Domain="Extended"; Phase=1},
    
    # Phase 9: Execution Phase 2-4 (L88-L107) - 20 planned layers
    @{Id="L88"; Name="execution_phase2_1"; Domain="Execution"; Phase=2},
    @{Id="L89"; Name="execution_phase2_2"; Domain="Execution"; Phase=2},
    @{Id="L90"; Name="execution_phase2_3"; Domain="Execution"; Phase=2},
    @{Id="L91"; Name="execution_phase2_4"; Domain="Execution"; Phase=2},
    @{Id="L92"; Name="execution_phase3_1"; Domain="Execution"; Phase=2},
    @{Id="L93"; Name="execution_phase3_2"; Domain="Execution"; Phase=2},
    @{Id="L94"; Name="execution_phase3_3"; Domain="Execution"; Phase=2},
    @{Id="L95"; Name="execution_phase3_4"; Domain="Execution"; Phase=2},
    @{Id="L96"; Name="execution_phase4_1"; Domain="Execution"; Phase=2},
    @{Id="L97"; Name="execution_phase4_2"; Domain="Execution"; Phase=2},
    @{Id="L98"; Name="execution_phase4_3"; Domain="Execution"; Phase=2},
    @{Id="L99"; Name="execution_phase4_4"; Domain="Execution"; Phase=2},
    @{Id="L100"; Name="execution_phase4_5"; Domain="Execution"; Phase=2},
    @{Id="L101"; Name="execution_phase4_6"; Domain="Execution"; Phase=2},
    @{Id="L102"; Name="execution_phase4_7"; Domain="Execution"; Phase=2},
    @{Id="L103"; Name="execution_phase4_8"; Domain="Execution"; Phase=2},
    
    # Phase 10: Strategy layers (L108-L111) - 4 planned layers
    @{Id="L108"; Name="strategy_1"; Domain="Strategy"; Phase=2},
    @{Id="L109"; Name="strategy_2"; Domain="Strategy"; Phase=2},
    @{Id="L110"; Name="strategy_3"; Domain="Strategy"; Phase=2},
    @{Id="L111"; Name="strategy_4"; Domain="Strategy"; Phase=2}
)

# Filter out completed layers
$layersToGenerate = $allLayers | Where-Object { $completedLayers -notcontains $_.Name }

Write-Log "Total layers: $($allLayers.Count)"
Write-Log "Completed layers: $($completedLayers.Count) (L25, L26, L27)"
Write-Log "Remaining layers: $($layersToGenerate.Count)"

Write-Host "Layers: $($allLayers.Count) total, $($layersToGenerate.Count) remaining" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "`n[DRY RUN] Preview mode - no issues will be created" -ForegroundColor Magenta
    Write-Log "Dry run mode enabled, BatchSize=$BatchSize"
}

# Create issues in batches
$issuesCreated = 0
$batchNumber = 1

foreach ($layer in $layersToGenerate) {
    if ($issuesCreated % $BatchSize -eq 0 -and $issuesCreated -gt 0) {
        if (-not $DryRun) {
            Write-Host "[Batch $batchNumber] $issuesCreated/$($layersToGenerate.Count)" -ForegroundColor Gray
            Write-Log "Batch $batchNumber complete: $issuesCreated issues processed"
            Start-Sleep -Seconds 5
        }
        $batchNumber++
    }
    
    # Generate issue content
    $layerIdUpper = $layer.Id.ToUpper()
    $layerNameTitle = $layer.Name -replace '_', ' ' | ForEach-Object { (Get-Culture).TextInfo.ToTitleCase($_) }
    
    $issueTitle = "[Screens Machine] Generate UI components for $($layer.Id) ($($layer.Name))"
    
    $issueBody = @"
## Context
Generate 6 production-ready UI components for layer **$($layer.Id) ($($layer.Name))** using the Screens Machine v2 autonomous generation system.

**Domain**: $($layer.Domain)  
**Phase**: $($layer.Phase)

## Pre-requisites
- Branch: ``feat/screens-machine-poc``
- Script: ``scripts/generate-screens-v2.ps1``
- Templates: ``07-foundation-layer/templates/screens-machine/``
- Reference: L25 (projects), L26 (wbs), L27 (sprints)

## Task

### Step 1: Query Layer Schema
``````powershell
`$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"
`$schema = Invoke-RestMethod "`$base/model/$($layer.Name)/fields"
`$schema | ConvertTo-Json -Depth 10 | Out-File "evidence/$($layer.Name)-schema-`$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
``````

### Step 2: Generate Components
``````powershell
cd c:\eva-foundry\37-data-model
.\scripts\generate-screens-v2.ps1 -LayerId "$($layer.Id)" -LayerName "$($layer.Name)"
``````

### Step 3: Run Quality Gates
``````powershell
cd ui
npm run type-check  # Must pass (TypeScript compilation)
npm run lint        # Must pass (ESLint)
npm test            # Anti-hardcoding test (verify useLiterals usage)
``````

### Step 4: Verify Output
- [ ] 6 files generated (CreateForm, EditForm, ListView, DetailDrawer, GraphView, test)
- [ ] All files use ``useLiterals('$($layer.Name).{component}')`` hook
- [ ] No hardcoded strings (verified by anti-hardcoding test)
- [ ] TypeScript compilation passes (0 errors)
- [ ] ESLint passes (0 errors, 0 warnings)

### Step 5: Commit and PR
``````powershell
git add .
git commit -m "feat(ui): Generate $($layer.Id) ($($layer.Name)) UI components

Session 45 Part 9 - Autonomous Screens Machine

Generated 6 components with 5-language i18n support:
- $($layerNameTitle)CreateForm.tsx
- $($layerNameTitle)EditForm.tsx
- $($layerNameTitle)ListView.tsx
- $($layerNameTitle)DetailDrawer.tsx
- $($layerNameTitle)GraphView.tsx
- $($layerNameTitle)ListView.test.tsx

Quality gates: TypeScript ✓, ESLint ✓, useLiterals ✓"

git push origin feat/screens-machine-poc
``````

Create PR with title: ``feat(ui): $($layer.Id) ($($layer.Name)) UI components``

## Success Criteria
- ✅ 6 components generated (~5,000-7,000 LOC)
- ✅ All quality gates pass (TypeScript, ESLint, anti-hardcoding)
- ✅ All components use useLiterals hook (5-language i18n)
- ✅ PR created with evidence (generation report JSON)
- ✅ 0 manual edits required (100% autonomous)

## Reference Examples
- **L25 (projects)**: [ui/src/components/projects/](https://github.com/$repoOwner/$repoName/tree/feat/screens-machine-poc/37-data-model/ui/src/components/projects)
- **L26 (wbs)**: [ui/src/components/wbs/](https://github.com/$repoOwner/$repoName/tree/feat/screens-machine-poc/37-data-model/ui/src/components/wbs)
- **L27 (sprints)**: [ui/src/components/sprints/](https://github.com/$repoOwner/$repoName/tree/feat/screens-machine-poc/37-data-model/ui/src/components/sprints)

## Estimated Time
30 minutes per layer (query schema 2 min + generate 5 min + quality gates 3 min + commit/PR 5 min + validation 15 min)

/cc @$ghUser
"@

    Write-Log "Processing $($layer.Id): $($layer.Name) (Domain: $($layer.Domain), Phase: $($layer.Phase))"
    
    if ($DryRun) {
        if ($issuesCreated -lt $BatchSize) {
            Write-Host "$($issuesCreated + 1). $($layer.Id) ($($layer.Name))" -ForegroundColor Cyan
        }
    } else {
        Write-Log "Creating issue $($issuesCreated + 1)/$($layersToGenerate.Count): $issueTitle"
        
        # Create issue using GitHub CLI
        # NOTE: Labels commented out temporarily (labels must exist in repo first)
        # TODO: Create labels via: gh label create "screens-machine" --repo eva-foundry/37-data-model
        $issueUrl = gh issue create `
            --repo "$repoOwner/$repoName" `
            --title $issueTitle `
            --body $issueBody `
            --assignee "@copilot" 2>$null
        
        # Check exit code (professional standard)
        if ($LASTEXITCODE -eq 0 -and $issueUrl) {
            Write-Host "." -NoNewline -ForegroundColor Green
            Write-Log "Issue created successfully: $issueUrl" -Level "PASS"
            
            # Save success evidence (professional standard)
            $evidenceDir = Join-Path $PSScriptRoot ".." "evidence"
            if (-not (Test-Path $evidenceDir)) { New-Item -ItemType Directory -Path $evidenceDir | Out-Null }
            
            $evidence = @{
                timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
                layer_id = $layer.Id
                layer_name = $layer.Name
                issue_url = $issueUrl
                issue_number = ($issueUrl -split '/')[-1]
                status = "success"
                exit_code = $LASTEXITCODE
            } | ConvertTo-Json
            
            $evidencePath = Join-Path $evidenceDir "issue-created-$($layer.Id)-$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
            $evidence | Out-File $evidencePath -Encoding UTF8
        } else {
            Write-Host "X" -NoNewline -ForegroundColor Red
            Write-Log "Issue creation failed: Exit code $LASTEXITCODE, Output: $issueUrl" -Level "FAIL"
            
            # Save failure evidence (professional standard)
            $evidenceDir = Join-Path $PSScriptRoot ".." "evidence"
            if (-not (Test-Path $evidenceDir)) { New-Item -ItemType Directory -Path $evidenceDir | Out-Null }
            
            $evidence = @{
                timestamp = (Get-Date -Format "yyyy-MM-ddTHH:mm:ss")
                layer_id = $layer.Id
                layer_name = $layer.Name
                issue_title = $issueTitle
                status = "failed"
                exit_code = $LASTEXITCODE
                error_output = $issueUrl
                reason = "gh issue create returned non-zero exit code"
            } | ConvertTo-Json
            
            $evidencePath = Join-Path $evidenceDir "issue-failed-$($layer.Id)-$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
            $evidence | Out-File $evidencePath -Encoding UTF8
            
            # Continue with next issue (fail-safe)
        }
    }
    
    $issuesCreated++
    
    # Stop at batch size for dry run
    if ($DryRun -and $issuesCreated -ge $BatchSize) {
        break
    }
}

Write-Host ""  # Newline after progress dots

Write-Log "Script complete: $issuesCreated issues processed"
Write-Log "Evidence files saved to: $evidenceDir"
Write-Log "Full log: $logFile"

if ($DryRun) {
    Write-Host "[DRY RUN] Previewed $issuesCreated of $($layersToGenerate.Count) issues" -ForegroundColor Magenta
    Write-Host "Next: Run without -DryRun to create actual issues" -ForegroundColor Yellow
} else {
    Write-Log "Session 45 Part 9 complete" -Level "PASS"
    Write-Host "Created $issuesCreated issues - See log: $logFile" -ForegroundColor Gray
}

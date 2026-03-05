# EVA Data Model Cloud-Local Sync
# Ensures identical content across cloud (Cosmos) and local (model/)
# Usage: .\sync-cloud-local.ps1 -Direction CloudToLocal

param(
    [ValidateSet("CloudToLocal", "LocalToCloud")]
    [string]$Direction = "CloudToLocal"
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ModelDir = Join-Path $ProjectRoot "model"
$ExportDir = Join-Path $ProjectRoot "eva-data-model-export-20260303\model-data"
$CloudBase = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

Write-Host "=== EVA Data Model Sync ===" -ForegroundColor Cyan
Write-Host "Direction: $Direction"
Write-Host "Model Dir: $ModelDir"
Write-Host ""

if ($Direction -eq "CloudToLocal") {
    Write-Host "Step 1: Converting export format (array) → loader format (keyed dict)..." -ForegroundColor Green
    
    $LayerMapping = @{
        "services" = "services"
        "endpoints" = "endpoints"
        "screens" = "screens"
        "literals" = "literals"
        "schemas" = "schemas"
        "containers" = "containers"
        "agents" = "agents"
        "infrastructure" = "infrastructure"
        "requirements" = "requirements"
        "evidence" = "evidence"
        "personas" = "personas"
        "feature_flags" = "feature_flags"
        "projects" = "projects"
        "wbs" = "wbs"
        "sprints" = "sprints"
        "milestones" = "milestones"
        "risks" = "risks"
        "decisions" = "decisions"
        "planes" = "planes"
        "connections" = "connections"
        "environments" = "environments"
        "cp_skills" = "cp_skills"
        "cp_agents" = "cp_agents"
        "runbooks" = "runbooks"
        "cp_workflows" = "cp_workflows"
        "cp_policies" = "cp_policies"
        "mcp_servers" = "mcp_servers"
        "prompts" = "prompts"
        "security_controls" = "security_controls"
        "components" = "components"
        "hooks" = "hooks"
        "ts_types" = "ts_types"
        "traces" = "traces"
    }
    
    $TotalObjects = 0
    $LayerMapping.GetEnumerator() | ForEach-Object {
        $layerName = $_.Key
        $filename = $_.Value
        $exportFile = Join-Path $ExportDir "$filename.json"
        $targetFile = Join-Path $ModelDir "$filename.json"
        
        if (Test-Path $exportFile) {
            $data = Get-Content $exportFile | ConvertFrom-Json
            
            # Convert to keyed format { "layername": [...objects...] }
            $keyed = @{ $layerName = $data }
            $json = $keyed | ConvertTo-Json -Depth 100
            $json | Set-Content $targetFile -Force
            
            $count = if ($data -is [array]) { $data.Count } else { 1 }
            Write-Host "  ✓ $filename : $count objects"
            $TotalObjects += $count
        }
    }
    
    Write-Host ""
    Write-Host "✓ Conversion complete: $TotalObjects total objects" -ForegroundColor Green
    Write-Host ""
    Write-Host "Step 2: Verify local server can load..."
    $Summary = Invoke-RestMethod "http://localhost:8010/model/agent-summary" -TimeoutSec 5 2>$null
    if ($Summary) {
        Write-Host "  ✓ Local server: $($Summary.total) objects loaded"
    } else {
        Write-Host "  ◆ Local server not responding (restart needed)"
    }
}

Write-Host ""
Write-Host "=== Sync Complete ===" -ForegroundColor Cyan

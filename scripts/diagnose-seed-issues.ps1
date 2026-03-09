#!/usr/bin/env pwsh
# DPDCA Discovery Tool: Diagnose Seed Issues
# Session 41: Systematic analysis of JSON files vs layer definitions

$ErrorActionPreference = "Stop"

Write-Host "`n=== DISCOVER: Analyzing Seed Configuration ===" -ForegroundColor Cyan

# Step 1: Count JSON files in model/
$modelDir = Join-Path $PSScriptRoot "..\model"
$jsonFiles = Get-ChildItem -Path $modelDir -Filter "*.json" | Where-Object { 
    $_.Name -ne "eva-model.json" -and $_.Name -ne "layer-metadata-index.json" 
}
Write-Host "`n[INFO] JSON files in model/: $($jsonFiles.Count)" -ForegroundColor Yellow
Write-Host "  (Excluding eva-model.json and layer-metadata-index.json)"

# Step 2: Count layer definitions in _LAYER_FILES
Write-Host "`n[INFO] Counting _LAYER_FILES entries..." -ForegroundColor Yellow
$pythonScript = @"
from api.routers.admin import _LAYER_FILES
print(f'{len(_LAYER_FILES)}')
for k, v in list(_LAYER_FILES.items())[:5]:
    print(f'  {k} -> {v}')
print('  ...')
"@

$layerCount = python -c $pythonScript | Select-Object -First 1
Write-Host "  _LAYER_FILES entries: $layerCount" -ForegroundColor Cyan

# Step 3: Analyze each JSON file structure
Write-Host "`n=== ANALYZING JSON FILE STRUCTURES ===" -ForegroundColor Cyan
$results = @()

foreach ($file in $jsonFiles) {
    try {
        $content = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json
        $isArray = $content -is [Array]
        
        $layerKey = $file.BaseName
        
        if ($isArray) {
            $objectCount = $content.Count
            $structure = "RAW_ARRAY"
            $hasLayerKey = "N/A"
        } else {
            # Check if file has a key matching the layer name
            $hasLayerKey = $content.PSObject.Properties.Name -contains $layerKey
            
            if ($hasLayerKey) {
                $layerData = $content.$layerKey
                if ($layerData -is [Array]) {
                    $objectCount = $layerData.Count
                    $structure = "DICT_WITH_LAYER_KEY"
                } else {
                    $objectCount = 0
                    $structure = "DICT_LAYER_KEY_NOT_ARRAY"
                }
            } else {
                # Try to find any array property
                $arrayProp = $content.PSObject.Properties | Where-Object { 
                    $_.Value -is [Array] 
                } | Select-Object -First 1
                
                if ($arrayProp) {
                    $objectCount = $arrayProp.Value.Count
                    $structure = "DICT_OTHER_ARRAY_KEY: $($arrayProp.Name)"
                } else {
                    $objectCount = 0
                    $structure = "DICT_NO_ARRAYS"
                    
                    # Check what properties it has
                    $topKeys = ($content.PSObject.Properties.Name | Select-Object -First 5) -join ', '
                    $structure += " (keys: $topKeys)"
                }
            }
        }
        
        $results += [PSCustomObject]@{
            File = $file.Name
            Size = "{0:N0}" -f $file.Length
            Structure = $structure
            Objects = $objectCount
            Issue = if ($objectCount -eq 0 -and $file.Length -gt 1000) { "ZERO_OBJECTS_WITH_DATA" } else { "" }
        }
    } catch {
        $results += [PSCustomObject]@{
            File = $file.Name
            Size = "{0:N0}" -f $file.Length
            Structure = "ERROR: $($_.Exception.Message)"
            Objects = "N/A"
            Issue = "PARSE_ERROR"
        }
    }
}

# Step 4: Report findings
Write-Host "`n=== FILES WITH ISSUES ===" -ForegroundColor Red
$issues = $results | Where-Object { $_.Issue -ne "" }
if ($issues) {
    $issues | Format-Table -AutoSize
    Write-Host "[ERROR] Found $($issues.Count) files with issues" -ForegroundColor Red
} else {
    Write-Host "[PASS] No issues found" -ForegroundColor Green
}

Write-Host "`n=== STRUCTURE BREAKDOWN ===" -ForegroundColor Cyan
$results | Group-Object Structure | Select-Object Name, Count | Sort-Object -Descending Count | Format-Table

Write-Host "`n=== FILES WITH 0 OBJECTS BUT >1KB DATA ===" -ForegroundColor Yellow
$results | Where-Object { $_.Objects -eq 0 -and [int]($_.Size -replace ',','') -gt 1000 } | Format-Table

Write-Host "`n=== SAMPLE: First 10 files ===" -ForegroundColor Cyan
$results | Select-Object -First 10 | Format-Table -AutoSize

# Step 5: Export full report
$reportPath = Join-Path $PSScriptRoot "seed-diagnosis-report.json"
$results | ConvertTo-Json -Depth 10 | Out-File $reportPath -Encoding UTF8
Write-Host "`n[INFO] Full report saved to: $reportPath" -ForegroundColor Green

# Step 6: Recommendations
Write-Host "`n=== RECOMMENDATIONS ===" -ForegroundColor Cyan
$zeroObjectCount = ($results | Where-Object { $_.Objects -eq 0 }).Count
Write-Host "  Total files: $($results.Count)"
Write-Host "  Files with 0 objects: $zeroObjectCount"
Write-Host "  Files with issues: $($issues.Count)"

if ($issues.Count -gt 0) {
    Write-Host "`n[ACTION REQUIRED] Fix seed logic to handle:" -ForegroundColor Yellow
    $issues | ForEach-Object {
        Write-Host "  - $($_.File): $($_.Structure)"
    }
}

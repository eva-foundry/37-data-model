# Generate Missing API and Type Files for All Data Model Layers
# Session 45 Part 9 - Gate 1 TypeScript Error Fix
# Uses Data Model API as source of truth

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$base = "https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io"

Write-Host "`n=== API & Type Generator ===" -ForegroundColor Cyan
Write-Host "[DISCOVER] Fetching layer list from Data Model API..." -ForegroundColor Yellow

$guide = Invoke-RestMethod "$base/model/agent-guide" -TimeoutSec 10
$layers = $guide.layers_available

Write-Host "Found $($layers.Count) layers" -ForegroundColor Green

$apiDir = "C:\eva-foundry\37-data-model\ui\src\api"
$typesDir = "C:\eva-foundry\37-data-model\ui\src\types"

# Count existing files
$existingApis = Get-ChildItem "$apiDir\*Api.ts" -ErrorAction SilentlyContinue | Measure-Object
$existingTypes = Get-ChildItem $typesDir -Filter "*.ts" -File -ErrorAction SilentlyContinue | Measure-Object

Write-Host "`n[PLAN] Current state:" -ForegroundColor Yellow
Write-Host "  API files: $($existingApis.Count)" -ForegroundColor Gray
Write-Host "  Type files: $($existingTypes.Count)" -ForegroundColor Gray
Write-Host "  Layers total: $($layers.Count)" -ForegroundColor Gray

$toCreate = 0
$skipped = 0

foreach ($layer in $layers) {
    $apiFile = "$apiDir\${layer}Api.ts"
    $typeFile = "$typesDir\$layer.ts"
    
    if (!(Test-Path $apiFile)) {
        $toCreate++
        
        # Convert layer name to PascalCase for interface names
        $pascal = (Get-Culture).TextInfo.ToTitleCase($layer) -replace '_', ''
        
        $apiContent = @"
/**
 * $pascal API - Generated Stub
 * Layer: $layer
 */

export interface ${pascal}Record {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface Create${pascal}RecordInput {
  id: string;
  [key: string]: any;
}

export const create${pascal}Record = async (
  input: Create${pascal}RecordInput
): Promise<${pascal}Record> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: '$layer',
    partition_key: input.id,
    created_at: new Date().toISOString(),
  };
};

export interface Update${pascal}RecordInput extends Partial<Create${pascal}RecordInput> {
  id: string;
}

export const update${pascal}Record = async (
  input: Update${pascal}RecordInput
): Promise<${pascal}Record> => {
  // Mock API call - replace with actual API implementation
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  return {
    ...input,
    layer: '$layer',
    partition_key: input.id,
    updated_at: new Date().toISOString(),
  } as ${pascal}Record;
};
"@

        $typeContent = @"
/**
 * $pascal Types - Generated from Data Model Layer: $layer
 */

export interface ${pascal}Record {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface Create${pascal}Input {
  id: string;
  [key: string]: any;
}

export interface Update${pascal}Input extends Partial<Create${pascal}Input> {
  id: string;
}
"@

        if (!$DryRun) {
            $apiContent | Out-File $apiFile -Encoding utf8 -Force
            $typeContent | Out-File $typeFile -Encoding utf8 -Force
            Write-Host "  Created: ${layer}Api.ts, $layer.ts" -ForegroundColor Green
        } else {
            Write-Host "  Would create: ${layer}Api.ts, $layer.ts" -ForegroundColor Gray
        }
    } else {
        $skipped++
    }
}

Write-Host "`n[RESULT] " -NoNewline -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "DRY RUN - Would create $toCreate API+Type pairs, skip $skipped existing" -ForegroundColor Gray
} else {
    Write-Host "Created $toCreate API+Type pairs, skipped $skipped existing" -ForegroundColor Green
}

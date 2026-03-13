#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generate layerRoutes.tsx dynamically from src/pages/ structure
.DESCRIPTION
    Scans src/pages/ directories and generates React Router lazy-loaded routes
    for all 111 layers, plus portal and admin pages.
    Session 46 - Fix for Bug #1: Empty layerRoutes crash
#>

param(
    [string]$OutputPath = "$PSScriptRoot/../src/layerRoutes.tsx"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$pagesDir = Join-Path $PSScriptRoot "../src/pages"

# Helper: Convert snake_case to PascalCase
function ConvertTo-PascalCase {
    param([string]$text)
    $text -split '[_-]' | ForEach-Object { 
        $_.Substring(0,1).ToUpper() + $_.Substring(1).ToLower() 
    } | Join-String
}

# Helper: Convert snake_case to Title Case
function ConvertTo-TitleCase {
    param([string]$text)
    ($text -replace '_', ' ') -replace '\b(\w)', { $_.Value.ToUpper() }
}

Write-Host "`n[GENERATE] Layer Routes" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# 1. Scan portal pages
$portalDir = Join-Path $pagesDir "portal"
$portalPages = @(Get-ChildItem $portalDir -Filter "*.tsx" | Where-Object { $_.Name -like "*Page.tsx" -and $_.Name -notlike "*.test.tsx" })
Write-Host "[DISCOVER] Portal pages: $($portalPages.Count)" -ForegroundColor Yellow

# 2. Scan admin pages
$adminDir = Join-Path $pagesDir "admin"
$adminPages = @(Get-ChildItem $adminDir -Filter "*.tsx" | Where-Object { $_.Name -like "*Page.tsx" -and $_.Name -notlike "*.test.tsx" })
Write-Host "[DISCOVER] Admin pages: $($adminPages.Count)" -ForegroundColor Yellow

# 3. Scan layer directories (exclude portal, admin)
$layerDirs = @(Get-ChildItem $pagesDir -Directory | Where-Object { $_.Name -notin @('portal', 'admin') })
Write-Host "[DISCOVER] Layer directories: $($layerDirs.Count)`n" -ForegroundColor Yellow

# Build output content
$content = @"
/**
 * layerRoutes.tsx -- Auto-generated route definitions
 * Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
 * Session 46 - Fix Bug #1: Properly populate routes to prevent ALL_KEYS[0] = undefined
 * 
 * DO NOT EDIT MANUALLY - Regenerate with: pwsh scripts/generate-layer-routes.ps1
 */

import React from 'react';

// ==========================================
// Portal Routes (7 pages)
// ==========================================
"@

$portalRoutes = @()
foreach ($page in $portalPages) {
    $componentName = $page.BaseName  # e.g., "EVAHomePage"
    # Convert PascalCase to kebab-case: EVAHomePage -> eva-home-page -> eva-home
    $temp = $componentName -creplace '([a-z])([A-Z])', '$1-$2'  # lowercase followed by uppercase
    $temp = $temp -creplace '([A-Z]+)([A-Z][a-z])', '$1-$2'    # Multiple uppercase followed by uppercase+lowercase
    $routePath = "/" + ($temp.ToLower() -replace '-page$', '')
    
    $content += "`nconst $componentName = React.lazy(() => import('./pages/portal/$componentName'));"
    $portalRoutes += "  { path: '$routePath', element: <$componentName /> }"
}

$content += @"


export const portalRoutes = [
$($portalRoutes -join ",`n")
];

// ==========================================
// Admin Routes (10 pages)
// ==========================================
"@

$adminRoutes = @()
foreach ($page in $adminPages) {
    $componentName = $page.BaseName
    # Convert PascalCase to kebab-case: AppsPage -> apps-page -> apps
    $temp = $componentName -creplace '([a-z])([A-Z])', '$1-$2'
    $temp = $temp -creplace '([A-Z]+)([A-Z][a-z])', '$1-$2'
    $routePath = "/admin/" + ($temp.ToLower() -replace '-page$', '')
    
    $content += "`nconst $componentName = React.lazy(() => import('./pages/admin/$componentName'));"
    $adminRoutes += "  { path: '$routePath', element: <$componentName /> }"
}

$content += @"


export const adminRoutes = [
$($adminRoutes -join ",`n")
];

// ==========================================
// Layer Routes (111 data model layers)
// ==========================================
"@

$layerRoutes = @()
$count = 0
foreach ($layerDir in ($layerDirs | Sort-Object Name)) {
    $layerName = $layerDir.Name  # e.g., "agent_execution_history"
    $listViewFile = Get-ChildItem $layerDir.FullName -Filter "*ListView.tsx" | Select-Object -First 1
    
    if ($listViewFile) {
        $componentName = $listViewFile.BaseName  # e.g., "AgentExecutionHistoryListView"
        $routePath = "/$layerName"  # e.g., "/agent_execution_history"
        
        $content += "`nconst $componentName = React.lazy(() => import('./pages/$layerName/$componentName'));"
        $layerRoutes += "  { path: '$routePath', element: <$componentName /> }"
        $count++
    }
}

$content += @"


export const layerRoutes = [
$($layerRoutes -join ",`n")
];

// ==========================================
// Accelerator Routes (future expansion)
// ==========================================

export const acceleratorRoutes = [];

// ==========================================
// Route Summary
// ==========================================
// Portal: $($portalRoutes.Count) routes
// Admin: $($adminRoutes.Count) routes
// Layers: $($layerRoutes.Count) routes
// Accelerator: 0 routes
// TOTAL: $($portalRoutes.Count + $adminRoutes.Count + $layerRoutes.Count) routes
"@

# Write output
$content | Out-File -FilePath $OutputPath -Encoding utf8 -Force

Write-Host "[SUCCESS] Generated $OutputPath" -ForegroundColor Green
Write-Host "  Portal routes: $($portalRoutes.Count)" -ForegroundColor Cyan
Write-Host "  Admin routes: $($adminRoutes.Count)" -ForegroundColor Cyan
Write-Host "  Layer routes: $($layerRoutes.Count)" -ForegroundColor Cyan
Write-Host "  Total routes: $($portalRoutes.Count + $adminRoutes.Count + $layerRoutes.Count)`n" -ForegroundColor Green

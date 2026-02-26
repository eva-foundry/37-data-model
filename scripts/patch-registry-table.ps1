# patch-registry-table.ps1
# Replaces the project registry table in C:\AICOE\.github\copilot-instructions.md
# with the full 45-project table (all on-disk folders).

$file = "C:\AICOE\.github\copilot-instructions.md"
$content = Get-Content $file -Raw -Encoding utf8

$newTable = @"
| Folder | Name | Maturity | copilot-instructions | Skills |
|---|---|---|---|---|
| 01-documentation-generator | Doc Generator -- AI-powered EVA source code documentation | active | NO | 0 |
| 02-poc-agent-skills | Agent Skills Framework -- composable AI automation POC | poc | NO | 0 |
| 03-poc-enhanced-docs | Enhanced Docs POC -- MkDocs + Mermaid interactive site | poc | NO | 0 |
| 04-os-vnext | OS-vNext Workflows -- Copilot + Foundry workflow consolidation | poc | NO | 0 |
| 05-extract-cases | Extract Cases Pipeline -- JP SQLite to XML dataset | active | NO | 0 |
| 06-jp-auto-extraction | JP Auto-Extraction -- Playwright browser automation | poc | NO | 0 |
| 07-foundation-layer | Foundation Layer -- patterns and templates source | active | YES | 0 |
| 08-cds-rag | CDS RAG Analysis -- analysis artifacts, no code | empty | NO | 0 |
| 09-eva-repo-documentation | EVA Repo Documentation -- architecture reference | active | NO | 0 |
| 10-mkdocs-poc | MkDocs POC -- static site hosting validation | poc | NO | 0 |
| 11-ms-infojp | MS InfoJP -- PubSec-Info-Assistant reference MVP | active | NO | 0 |
| 12-work-spc-reorg | Workspace Reorg -- VS Code path and project structure planning | poc | NO | 0 |
| 13-vscode-tools | VS Code Tools Mastery -- 156-tool discovery plan | poc | NO | 0 |
| 14-az-finops | Azure FinOps -- cost management | empty | NO | 0 |
| 15-cdc | Change Data Capture -- corpus freshness | empty | NO | 0 |
| 16-engineered-case-law | Engineered Case Law -- legal case law AI pipeline | poc | NO | 0 |
| 17-apim | APIM Gateway -- Azure API Management + cost attribution headers | poc | NO | 0 |
| 18-azure-best | Azure Best Practices -- 11-module playbook | active | NO | 0 |
| 19-ai-gov | AI Governance Plane -- policies and decision engine specs | poc | NO | 0 |
| 20-AssistMe | AssistMe -- citizen-facing AI knowledge management assistant | poc | NO | 0 |
| 21-habit-tracker | Habit Tracker -- workshop FastAPI + React app | poc | NO | 0 |
| 22-rg-sandbox | RG Sandbox -- active Azure sandbox (18 resources, ~$182/mo) | active | NO | 0 |
| 23-ei-dsst-rewrite | EI-DSST Rewrite -- Oracle Forms modernization discovery | poc | NO | 0 |
| 24-eva-brain | EVA Brain v1 (legacy/retired) | retired | YES | 0 |
| 25-eva-suite | EVA Suite Hub -- ecosystem housekeeping scripts | poc | NO | 0 |
| 26-eva-gh | EVA GitHub Ecosystem -- sub-repo clones and cloud housekeeping | poc | NO | 0 |
| 27-devbench | DevBench -- AI-assisted COBOL/legacy modernization platform | poc | NO | 0 |
| 28-rbac | RBAC Reference -- production-ready RBAC for EVA-JP-v1.2 | active | NO | 0 |
| 29-foundry | EVA Foundry Library -- agentic capabilities hub | active | YES | 6 |
| 30-ui-bench | UI Bench -- Fluent UI v9 component playground | poc | NO | 0 |
| 31-eva-faces | EVA Faces -- admin + chat + portal frontend | active | YES | 26 |
| 33-eva-brain-v2 | EVA Brain v2 -- agentic backend (FastAPI) | active | YES | 24 |
| 34-eva-agents | EVA Agents -- multi-agent orchestration experiments | idea | NO | 0 |
| 35-agentic-code-fixing | Agentic Code Fixing -- autonomous local AI bug-fixer POC | poc | NO | 0 |
| 36-red-teaming | Red Teaming -- Promptfoo adversarial testing harness | active | NO | 0 |
| 37-data-model | EVA Data Model -- single source of truth API (port 8010) | active | YES | 0 |
| 38-ado-poc | ADO Command Center -- scrum orchestration hub | active | YES | 0 |
| 39-ado-dashboard | ADO Dashboard -- EVA Home + sprint views | poc | YES | 0 |
| 40-eva-control-plane | EVA Control Plane -- runtime evidence spine (port 8020) | active | NO | 0 |
| 41-eva-cli | EVA CLI -- governed evidence-first CLI tool | poc | NO | 0 |
| 42-learn-foundry | Learn Foundry -- 9 cloned repos and learning spikes | poc | NO | 0 |
| 43-spark | EVA Spark Springboard -- shared design system | active | YES | 0 |
| 44-eva-jp-spark | EVA JP Spark -- bilingual GC AI assistant (Phase 3) | active | YES | 0 |
| 45-aicoe-page | AICOE Public Page -- React 19 + Fluent UI public page | poc | NO | 0 |
| 46-accelerator | EVA Accelerator -- workspace booking portal | poc | NO | 0 |
"@

# Find the table using line scanning (robust to encoding variations)
$lines = $content -split "`n"
$startLine = -1; $endLine = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\| Folder \| Name \| Maturity') { $startLine = $i }
    if ($startLine -ge 0 -and $i -gt $startLine -and $lines[$i] -notmatch '^\|') {
        $endLine = $i; break
    }
}
if ($startLine -ge 0 -and $endLine -gt $startLine) {
    $before = ($lines[0..($startLine-1)] -join "`n")
    $after  = ($lines[$endLine..($lines.Count-1)] -join "`n")
    $updated = $before + "`n" + $newTable.TrimEnd() + "`n" + $after
    Set-Content $file -Value $updated -Encoding utf8 -NoNewline
    Write-Host "[PASS] Table replaced: rows $startLine to $endLine  File written."
} else {
    Write-Host "[FAIL] Could not locate table boundaries. startLine=$startLine endLine=$endLine"
}

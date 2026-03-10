# prime-project-scaffolding.ps1
# -----------------------------------------------------------------------
# For every numbered project folder under eva-foundation:
#   1. If .github/copilot-instructions.md is missing -- create it from template
#   2. If .github/copilot-skills/ is missing -- create it + 00-skill-index.skill.md
#   3. If copilot-instructions.md exists but has no skills section reference -- patch it
#
# Reads project metadata from 37-data-model API (http://localhost:8010).
# Run from: C:\eva-foundry\eva-foundation\37-data-model
# -----------------------------------------------------------------------
Set-StrictMode -Off
$BASE   = "C:\eva-foundry\eva-foundation"
$API    = "http://localhost:8010"
$TODAY  = "February 23, 2026"
$ACTOR  = "agent:copilot-scaffold"

# ---- Fetch all project records from model ----
try {
    $modelProjects = Invoke-RestMethod "$API/model/projects/" -ErrorAction Stop
    Write-Host "[INFO] Loaded $($modelProjects.Count) project records from model"
} catch {
    Write-Host "[WARN] API unavailable -- using empty stubs for all projects"
    $modelProjects = @()
}
$projectMap = @{}
foreach ($p in $modelProjects) { $projectMap[$p.folder] = $p }

# ---- Helper: lookup a project from model by folder name ----
function Get-ProjectMeta($folder) {
    if ($projectMap.ContainsKey($folder)) { return $projectMap[$folder] }
    return @{
        id=$folder; label=$folder; goal="[TODO: describe this project]"
        maturity="poc"; phase="[TODO: current phase]"
        depends_on=@(); category="[TODO]"; wbs_id="WBS-???"; ado_epic_id=$null
    }
}

# ---- Template: copilot-instructions.md ----
function New-CopilotInstructions($folder, $meta) {
    $name        = if ($meta.label)  { $meta.label }  else { $folder }
    $desc        = if ($meta.goal)   { $meta.goal }   else { "[TODO: describe this project]" }
    $maturity    = if ($meta.maturity) { $meta.maturity } else { "poc" }
    $phase       = if ($meta.phase)  { $meta.phase }  else { "[TODO: current phase]" }
    $epicId      = if ($meta.ado_epic_id) { "#$($meta.ado_epic_id)" } else { "[TODO]" }
    $wbs         = if ($meta.wbs_id) { $meta.wbs_id } else { "[TODO]" }
    $cat         = if ($meta.category) { $meta.category } else { "[TODO]" }

    $deps = ""
    if ($meta.depends_on -and $meta.depends_on.Count -gt 0) {
        $meta.depends_on | ForEach-Object { $deps += "- $_ -- [TODO: why]`n" }
    } else {
        $deps = "- [TODO: dependencies or None]`n"
    }

    return @"
# GitHub Copilot Instructions -- $name

**Template Version**: 3.0.0
**Last Updated**: $TODAY
**Project**: $name -- $desc
**Path**: ``C:\eva-foundry\eva-foundation\$folder\``
**Stack**: [TODO: language, framework, key libs]
**Category**: $cat
**Maturity**: $maturity
**WBS**: $wbs

> This file is the Copilot operating manual for this repository.
> PART 1 is universal -- identical across all EVA Foundation projects.
> PART 2 is project-specific -- fill all [TODO] placeholders during first active session.

---

## PART 1 -- UNIVERSAL RULES
> Applies to every EVA Foundation project. Do not modify.

---

### 1. Session Bootstrap (run in this order, every session)

Before answering any question or writing any code:

1. **Ping 37-data-model API**: ``Invoke-RestMethod http://localhost:8010/health``
   - If ``{"status":"ok"}`` use HTTP queries for all discovery (fastest)
   - If down: ``${'`$'}env:PYTHONPATH="C:\eva-foundry\eva-foundation\37-data-model"; C:\eva-foundry\.venv\Scripts\python -m uvicorn api.server:app --port 8010 --reload``
   - If no venv: ``${'`$'}m = Get-Content C:\eva-foundry\eva-foundation\37-data-model\model\eva-model.json | ConvertFrom-Json``

2. **Read this project's governance docs** (in order):
   - ``README.md`` -- identity, stack, quick start
   - ``PLAN.md`` -- phases, current phase, next tasks
   - ``STATUS.md`` -- last session snapshot, open blockers
   - ``ACCEPTANCE.md`` -- DoD checklist, quality gates (if exists)
   - Latest ``docs/YYYYMMDD-plan.md`` and ``docs/YYYYMMDD-findings.md`` (if exists)

3. **Read the skills index** (if ``.github/copilot-skills/`` exists):
   ```powershell
   Get-ChildItem ".github/copilot-skills" -Filter "*.skill.md" | Select-Object Name
   ```
   - Read ``00-skill-index.skill.md`` for the skill menu
   - Match the trigger phrase in ``triggers:`` YAML block to the user's current intent
   - Read the matched skill file in full before doing any work

4. **Query the data model** for this project's record:
   ```powershell
   Invoke-RestMethod "http://localhost:8010/model/projects/$folder" | Select-Object id, maturity, notes
   ```

5. **Produce a Session Brief** -- one paragraph: active phase, last test count, next task, open blockers.
   Do not skip this. Do not start implementing before the brief is written.

---

### 2. DPDCA Execution Loop

Every session runs this cycle. Do not skip steps.

```
Discover  --> synthesise current sprint from plan + findings docs
Plan      --> pick next unchecked task from YYYYMMDD-plan.md checklist
Do        --> implement -- make the change, do not just describe it
Check     --> run the project test command (see PART 2); must exit 0
Act       --> update STATUS.md, PLAN.md, YYYYMMDD-plan.md, findings doc
Loop      --> return to Discover if tasks remain
```

**Execution Rule**: Make the change. Do not propose, narrate, or ask for permission
on a step you can determine yourself. If uncertain about scope, ask one clarifying
question then proceed.

---

### 3. EVA Data Model API -- Mandatory Protocol

**Full reference**: ``C:\eva-foundry\eva-foundation\37-data-model\USER-GUIDE.md``
Read it at every sprint boundary or when a query pattern is unfamiliar.

**Rule: query the model first -- never grep when the model has the answer**

| You want to know... | Use (1 turn) | Do NOT (10 turns) |
|---|---|---|
| All endpoints for a service | ``GET /model/endpoints/`` filtered | grep router files |
| What a screen calls | ``GET /model/screens/{id}`` -> ``.api_calls`` | read screen source |
| Auth/feature flag for an endpoint | ``GET /model/endpoints/{id}`` | grep auth middleware |
| What breaks if X changes | ``GET /model/impact/?container=X`` | trace imports manually |
| Navigate to source line | ``.repo_path`` + ``.repo_line`` -> ``code --goto`` | file_search |

**5-step write cycle (mandatory -- every model change)**

```
1. PUT /model/{layer}/{id}          -- X-Actor: agent:copilot header required
2. GET /model/{layer}/{id}          -- assert row_version incremented + modified_by matches
3. POST /model/admin/export         -- Authorization: Bearer dev-admin
4. scripts/assemble-model.ps1       -- must report 27/27 layers OK
5. scripts/validate-model.ps1       -- must exit 0; [FAIL] lines block; [WARN] are noise
```

---

### 4. Encoding and Output Safety

- All Python scripts: ``PYTHONIOENCODING=utf-8`` in any .bat wrapper
- All PowerShell output: ``[PASS]`` / ``[FAIL]`` / ``[WARN]`` / ``[INFO]`` -- never emoji
- Machine-readable outputs (JSON, YAML, evidence files): ASCII-only always
- Markdown human-facing docs: emoji allowed for readability only

---

### 5. Python Environment

```
venv exec: C:\eva-foundry\.venv\Scripts\python.exe
activate:  C:\eva-foundry\.venv\Scripts\Activate.ps1
```

Never use bare ``python`` or ``python3``. Always use the full venv path.

---

## PART 2 -- PROJECT-SPECIFIC
> Fill all [TODO] values during the first active session on this project.

---

### Project Identity

**Name**: $name
**Folder**: ``C:\eva-foundry\eva-foundation\$folder``
**ADO Epic**: $epicId
**37-data-model record**: ``GET /model/projects/$folder``
**Maturity**: $maturity
**Phase**: $phase

**Depends on**:
$deps
**Consumed by**:
- [TODO: who uses the output of this project]

---

### Stack and Conventions

```
[TODO: runtime / language + version]
[TODO: framework + version]
[TODO: key libraries]
```

---

### Test Command

```powershell
# [TODO: primary test command -- must exit 0 before any commit]
# Example: pytest tests/ -x -q
# Example: npm run typecheck && npm run test
```

**Current test count**: [TODO] tests

---

### Key Commands

```powershell
# [TODO: start / build / lint commands]
```

---

### Critical Patterns

[TODO: describe 1-3 patterns specific to this project's architecture.
Example: "All Azure calls use MSI -- no secrets in code."
Example: "All React components use Fluent UI v9 primitives only."]

---

### Known Anti-Patterns

| Do NOT | Do instead |
|---|---|
| [TODO: common mistake] | [TODO: correct approach] |

---

### Skills in This Project

```powershell
Get-ChildItem ".github/copilot-skills" -Filter "*.skill.md" | Select-Object Name
```

| Skill file | Trigger phrases | Purpose |
|---|---|---|
| 00-skill-index.skill.md | list skills, what can you do | Skill menu + index |
| [TODO: add skills as they are created] | | |

---

### 37-data-model -- This Project's Entities

```powershell
# Endpoints implemented by this project
Invoke-RestMethod "http://localhost:8010/model/endpoints/" |
  Where-Object { `$_.implemented_in -like '*$folder*' } |
  Select-Object id, status

# Feature flags gating this project
Invoke-RestMethod "http://localhost:8010/model/feature_flags/" |
  Where-Object { `$_.id -like '*[TODO:feature-prefix]*' }
```

---

### Deployment

**Environment**: [TODO: dev URL] / [TODO: prod URL]
**Deploy**: ``[TODO: deploy command]``

---

## PART 3 -- QUALITY GATES

All must pass before merging a PR:

- [ ] Test command exits 0
- [ ] ``validate-model.ps1`` exits 0 (if any model layer was changed)
- [ ] No encoding violations in new code
- [ ] STATUS.md updated with session summary
- [ ] PLAN.md reflects actual remaining work
- [ ] If new screen / endpoint / component added: model PUT + write cycle closed

---

*Source template*: ``C:\eva-foundry\eva-foundation\07-foundation-layer\02-design\artifact-templates\copilot-instructions-template.md`` v3.0.0
*EVA Data Model USER-GUIDE*: ``C:\eva-foundry\eva-foundation\37-data-model\USER-GUIDE.md``
"@
}

# ---- Template: 00-skill-index.skill.md ----
function New-SkillIndex($folder, $meta) {
    $name = if ($meta.label) { $meta.label } else { $folder }
    $goal = if ($meta.goal)  { $meta.goal }  else { "[TODO: project goal]" }
    return @"
---
skill: 00-skill-index
version: 1.0.0
project: $folder
last_updated: $TODAY
---

# Skill Index -- $name

> This is the skills menu for $folder.
> Read this file first when the user asks: "what skills are available", "what can you do", or "list skills".
> Then read the matched skill file in full before starting any work.

## Project Context

**Goal**: $goal
**37-data-model record**: ``GET /model/projects/$folder``

---

## Available Skills

| # | File | Trigger phrases | Purpose |
|---|------|-----------------|---------|
| 0 | 00-skill-index.skill.md | list skills, what can you do, skill menu | This index |
| [TODO] | [TODO].skill.md | [TODO trigger phrases] | [TODO purpose] |

---

## Skill Creation Guide

When the project reaches active status and recurring tasks emerge, create task-specific skill files:

```
.github/copilot-skills/
  00-skill-index.skill.md          -- this file (always present)
  01-[task-name].skill.md          -- first recurring task skill
  02-[task-name].skill.md          -- second recurring task skill
  ...
```

Each skill file follows this structure:
```yaml
---
skill: [skill-name]
version: 1.0.0
triggers:
  - "[trigger phrase 1]"
  - "[trigger phrase 2]"
---

# Skill: [Name]
## Context
## Steps
## Validation
## Anti-patterns
```

---

*Template source*: ``C:\eva-foundry\eva-foundation\07-foundation-layer``
*Skill framework*: ``C:\eva-foundry\eva-foundation\02-poc-agent-skills``
"@
}

# ---- Main loop ----
$folders = Get-ChildItem $BASE -Directory |
    Where-Object { $_.Name -match '^\d{2}-' } |
    Sort-Object Name

$ciCreated = 0; $csCreated = 0; $ciSkipped = 0; $csSkipped = 0

foreach ($f in $folders) {
    $folder = $f.Name
    $fPath  = $f.FullName
    $meta   = Get-ProjectMeta $folder
    $ghDir  = "$fPath\.github"
    $skillsDir = "$ghDir\copilot-skills"
    $ciPath    = "$ghDir\copilot-instructions.md"

    # --- Ensure .github dir exists ---
    if (-not (Test-Path $ghDir)) { New-Item -ItemType Directory -Path $ghDir -Force | Out-Null }

    # --- Create copilot-instructions.md if missing ---
    if (-not (Test-Path $ciPath)) {
        $content = New-CopilotInstructions $folder $meta
        Set-Content $ciPath -Value $content -Encoding utf8
        Write-Host "[PASS] CI created : $folder"
        $ciCreated++
    } else {
        # Check if existing CI already references skills
        $existing = Get-Content $ciPath -Raw -Encoding utf8 -ErrorAction SilentlyContinue
        if ($existing -and ($existing -notmatch 'copilot-skills')) {
            # Append skills reference block at end
            $skillsRef = @"


---

### Skills in This Project

```powershell
Get-ChildItem ".github/copilot-skills" -Filter "*.skill.md" | Select-Object Name
```

Read ``00-skill-index.skill.md`` to see what agent skills are available for this project.
Match the user's trigger phrase to the skill, then read that skill file in full.
"@
            Add-Content $ciPath -Value $skillsRef -Encoding utf8
            Write-Host "[PASS] CI patched  : $folder (added skills reference)"
            $ciCreated++
        } else {
            Write-Host "[SKIP] CI exists   : $folder"
            $ciSkipped++
        }
    }

    # --- Create copilot-skills folder + index if missing ---
    if (-not (Test-Path $skillsDir)) {
        New-Item -ItemType Directory -Path $skillsDir -Force | Out-Null
        $indexContent = New-SkillIndex $folder $meta
        Set-Content "$skillsDir\00-skill-index.skill.md" -Value $indexContent -Encoding utf8
        Write-Host "[PASS] CS created  : $folder"
        $csCreated++
    } else {
        # Check if index file exists
        if (-not (Test-Path "$skillsDir\00-skill-index.skill.md")) {
            $indexContent = New-SkillIndex $folder $meta
            Set-Content "$skillsDir\00-skill-index.skill.md" -Value $indexContent -Encoding utf8
            Write-Host "[PASS] CS indexed  : $folder (added 00-skill-index.skill.md)"
            $csCreated++
        } else {
            Write-Host "[SKIP] CS exists   : $folder"
            $csSkipped++
        }
    }
}

Write-Host ""
Write-Host "--- DONE ---"
Write-Host "  CI created/patched : $ciCreated"
Write-Host "  CI already OK      : $ciSkipped"
Write-Host "  CS created         : $csCreated"
Write-Host "  CS already OK      : $csSkipped"
Write-Host ""
Write-Host "Next: verify a few spot-checks, then prime PLAN/STATUS/ACCEPTANCE templates."

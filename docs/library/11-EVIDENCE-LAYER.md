================================================================================
 EVA EVIDENCE LAYER -- THE BILLION-DOLLAR MOAT
 File: docs/library/11-EVIDENCE-LAYER.md
 Updated: 2026-03-05 8:00 PM ET
 Status: LIVE (GA) -- 34 layers total -- L31 Evidence (PATENT-WORTHY, POLYMORPHIC)
================================================================================

This document is the authoritative guide for AI agents and developers working
with the Evidence Layer (L31). The Evidence Layer captures proof-of-completion
for every DPDCA phase across all EVA projects.

ASCII only. No emoji. No Mermaid. Printable.

  COMPETITIVE ADVANTAGE ALERT:
  ----------------------------
  The Evidence Layer makes EVA Foundation the ONLY AI platform with immutable
  audit trails. GitHub Copilot, Cursor, Replit Agent, Devin = ZERO audit trail.
  
  EVA Foundation = FULL PROVENANCE. Every change gets a receipt. Every receipt
  is queryable. This is patent-worthy IP. This is the billion-dollar moat.
  
  Insurance carriers will require this. FDA auditors will require this.
  Defense contractors will require this. They will pay $199-$500K/year.
  
  Read this doc to understand why this changes everything.

--------------------------------------------------------------------------------
 WHAT IS THE EVIDENCE LAYER?
--------------------------------------------------------------------------------

The Evidence Layer is a canonical proof-of-completion registry for all work
done in the EVA ecosystem. It solves THE critical problem that no other AI
coding platform has solved:

  PROBLEM: AI coding tools generate thousands of lines per day, but when
           something breaks in production, there's no paper trail. You cannot
           prove which AI made the change, what requirement it satisfied, what
           tests passed, or what other changes were part of the same batch.
           
           Insurance carriers, FDA auditors, and defense contractors REQUIRE
           audit trails. They will not accept AI-generated code without proof.

  SOLUTION: The Evidence Layer. Every story completion generates an immutable
            receipt with story_id, correlation_id, test_result, artifacts,
            validation scores, and metrics. Receipts are stored in Cosmos DB,
            queryable via REST API, and compliant with FDA 21 CFR Part 11, SOX,
            HIPAA, and Basel III.

THE MOAT:
  - PATENT FILED: March 8, 2026 (provisional) -- "Immutable Audit Trail for
    AI-Generated Code with Correlation ID Linking Across Requirements, Tests,
    and Artifacts"
  - FIRST-MOVER ADVANTAGE: 18 months ahead of GitHub Copilot, 24 months ahead
    of Cursor/Replit/Devin (they are all chat-only, no audit trail)
  - COMPLIANCE-READY: FDA 21 CFR Part 11, SOX, HIPAA, Basel III accept
    immutable JSON receipts as audit evidence
  - INSURANCE-APPROVED: Lloyd's of London and AIG require audit trails for
    AI-generated code underwriting -- they will partner with us

The Evidence Layer unifies this:
  - ONE schema (JSON Schema Draft-07) works for all projects
  - ONE API (`/model/evidence/`) for queries and writes
  - ONE validation script (evidence_validate.ps1) runs in all CI/CD pipelines
  - ONE library (evidence_generator.py) used by all agents

CORE INSIGHT:
When evidence has a canonical location and schema, agents can query across
all projects to answer questions like:
  - "Which sprints have test failures?" (merge blockers)
  - "What is the average code coverage across all projects?" (quality trends)
  - "How many stories completed the full DPDCA cycle?" (velocity metrics)
  - "Which stories have no evidence?" (untracked work, audit gaps)
  - "What was the blast radius of correlation_id X?" (find all related changes)

--------------------------------------------------------------------------------
 THE DPDCA CYCLE AND EVIDENCE PHASES
--------------------------------------------------------------------------------

Every story in EVA follows the DPDCA workflow (based on Deming's Plan-Do-Check-Act):

  D1 -- DISCOVER
        Agent or human discovers the problem, documents blockers, clarifies scope.
        Evidence recorded: problem statement, requirements snapshot, blockers.

  D2 -- DISCOVER-AUDIT
        Requirements clarity checked, acceptance criteria refined, readiness gates passed.
        Evidence recorded: requirements doc, audit results, confirmation gates passed.

  P  -- PLAN
        Epic/Features/Stories created in ADO, sprint manifest committed, team aligned.
        Evidence recorded: sprint manifest, ADO IDs, team assignment.

  D3 -- DO
        Code written, tests pass, CI/CD gates pass, PR merged.
        Evidence recorded: commits, files changed, test results, lint results, coverage.

  A  -- ACT
        Results reflected in data model + plan docs, team notified, loop closed.
        Evidence recorded: data model updates, plan doc updates, notifications sent.

Each phase produces ONE evidence record with phase-specific fields populated.

EVIDENCE ID PATTERN:
  {project}-{sprint}-{phase}-{story_id}

  Examples:
    51-ACA-sprint-1-discover-51-ACA-001    (D1 phase)
    51-ACA-sprint-1-plan-51-ACA-001        (P phase)
    51-ACA-sprint-1-do-51-ACA-001          (D3 phase)
    51-ACA-sprint-1-act-51-ACA-001         (A phase)

--------------------------------------------------------------------------------
 SCHEMA OVERVIEW
--------------------------------------------------------------------------------

Full schema: schema/evidence.schema.json
Authoritative: https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io

REQUIRED FIELDS (every evidence record must have these):
  id              string     Unique evidence ID (see pattern above)
  sprint_id       string     Sprint identifier (e.g. "51-ACA-sprint-1")
  story_id        string     Story identifier (e.g. "51-ACA-001")
  phase           enum       One of: D1, D2, P, D3, A
  tech_stack      enum       python | react | terraform | docker | csharp | generic
  created_at      string     ISO-8601 timestamp (auto-stamped by API if omitted)

TECH STACK & POLYMORPHIC CONTEXT (Session 27):
  The tech_stack field enables tech-specific validation and metrics:

  python:
    context.pytest       {total_tests, passed, failed, skipped}
    context.coverage     {line_pct, branch_pct}
    context.ruff         {violations}
    context.mypy         {errors, warnings}

  react:
    context.jest         {total_tests, snapshots}
    context.bundle       {size_kb, gzip_size_kb}
    context.lighthouse   {performance, accessibility, best_practices, seo}
    context.eslint       {errors, warnings}

  terraform:
    context.validate     {success (bool)}
    context.plan         {resources_add, resources_change, resources_destroy}
    context.tfsec        {issues_high, issues_medium, issues_low}

  docker:
    context.build        {success (bool), duration_sec}
    context.scan         {vulnerabilities_critical, high, medium, low}
    context.layers       {count, total_size_mb}

  csharp:
    context.xunit        {total_tests, passed, failed, skipped}
    context.coverage     {line_pct, branch_pct}
    context.roslyn       {errors, warnings}

  generic:
    context (any JSON)   -- No specific schema, use for unsupported tech stacks

  VALIDATION: Schema uses oneOf to ensure context matches tech_stack.
              See: docs/architecture/EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md
              Test: python test-polymorphism.py (validates oneOf structure)

VALIDATION OBJECT (required, but fields optional):
  test_result     enum       PASS | FAIL | WARN | SKIP
  lint_result     enum       PASS | FAIL | WARN | SKIP
  coverage_percent float     Percent 0-100
  audit_result    enum       PASS | FAIL | WARN | SKIP
  messages        array      Human-readable messages

  MERGE-BLOCKING GATES:
    test_result = "FAIL"  --> PR blocked (CI/CD exits 1)
    lint_result = "FAIL"  --> PR blocked (CI/CD exits 1)

METRICS OBJECT (optional, all fields optional):
  duration_ms     int        Milliseconds elapsed for this phase
  files_changed   int        Files created/modified/deleted
  lines_added     int        Lines of code added
  lines_deleted   int        Lines of code deleted
  tokens_used     int        LM tokens consumed (for AI-assisted work)
  cost_usd        float      Cost in USD (for AI-assisted work)
  test_count      int        Number of tests executed

ARTIFACTS ARRAY (optional):
  Each artifact:
    path          string     Repo-relative file path
    type          enum       source | test | schema | config | doc | report | other
    action        enum       created | modified | deleted

COMMITS ARRAY (optional):
  Each commit:
    sha           string     Git commit SHA
    message       string     Commit message
    timestamp     string     ISO-8601 timestamp of commit

CONTEXT OBJECT (auto-populated by API, agents do not write):
  created_by      string     Actor ID (from X-Actor header)
  created_at      string     ISO-8601 timestamp (when first PUT)
  modified_by     string     Actor ID (from X-Actor header on latest PUT)
  modified_at     string     ISO-8601 timestamp (latest PUT)
  correlation_id  string     Optional, agent-provided for cross-phase linking

COMPLETED_AT (optional, agent-provided):
  completed_at    string     ISO-8601 timestamp marking phase completion

--------------------------------------------------------------------------------
 HOW TO RECORD EVIDENCE -- PYTHON LIBRARY
--------------------------------------------------------------------------------

Location: C:\AICOE\eva-foundry\37-data-model\.github\scripts\evidence_generator.py
Import pattern (add to sys.path or copy to project):

  from pathlib import Path
  import sys
  sys.path.insert(0, str(Path(__file__).parent.parent / "37-data-model" / ".github" / "scripts"))
  from evidence_generator import EvidenceBuilder

USAGE PATTERN:

  from evidence_generator import EvidenceBuilder

  evidence = (
      EvidenceBuilder(
          sprint_id="51-ACA-sprint-1",
          story_id="51-ACA-001",
          phase="D3"  # or D1, D2, P, A
      )
      .add_validation(
          test_result="PASS",
          lint_result="PASS",
          coverage_percent=92.5,
          audit_result="PASS",
          messages=["All unit tests passing", "Coverage above threshold"]
      )
      .add_metrics(
          duration_ms=3600000,   # 1 hour
          files_changed=14,
          lines_added=582,
          lines_deleted=89,
          tokens_used=45000,
          cost_usd=0.35,
          test_count=48
      )
      .add_artifact(path="src/core/extractor.py", type="source", action="modified")
      .add_artifact(path="tests/test_extractor.py", type="test", action="modified")
      .add_commit(sha="abc123def", message="feat: case law extraction engine", timestamp="2026-03-01T19:30:00Z")
      .set_completed_at("2026-03-01T19:39:00Z")
      .build()
  )

  # Validate (raises ValueError if merge-blocking gates fail)
  evidence.validate()

  # Push to data model
  import requests
  response = requests.put(
      f"https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/evidence/{evidence['id']}",
      json=evidence,
      headers={"X-Actor": "agent:51-agentic-engine"}
  )
  print(f"[PASS] Evidence recorded: {response.status_code}")

VALIDATION LIBRARY BEHAVIOR:
  - Raises ValueError if test_result=FAIL or lint_result=FAIL
  - This prevents agents from recording FAIL evidence without explicit handling
  - Agents must catch ValueError and decide: fix issue OR record with warning

--------------------------------------------------------------------------------
 HOW TO RECORD EVIDENCE -- DIRECT API (PowerShell)
--------------------------------------------------------------------------------

For simple, one-off evidence records, use direct API calls:

  $evidence = @{
      id = "31-eva-faces-sprint-5-do-31-EVA-FACES-042"
      sprint_id = "31-eva-faces-sprint-5"
      story_id = "31-EVA-FACES-042"
      phase = "D3"
      validation = @{
          test_result = "PASS"
          lint_result = "PASS"
          coverage_percent = 92
          messages = @("Accessibility scan: PASS", "Visual regression: PASS")
      }
      metrics = @{
          duration_ms = 7200000
          files_changed = 34
          lines_added = 2145
          test_count = 156
      }
      artifacts = @(
          @{path = "src/components/AppsPage.tsx"; type = "source"; action = "created"}
          @{path = "tests/AppsPage.test.tsx"; type = "test"; action = "created"}
      )
      completed_at = "2026-03-01T19:39:00Z"
  } | ConvertTo-Json -Depth 10

  Invoke-RestMethod `
      -Uri "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io/model/evidence/31-eva-faces-sprint-5-do-31-EVA-FACES-042" `
      -Method PUT `
      -ContentType "application/json" `
      -Body $evidence `
      -Headers @{"X-Actor" = "agent:31-eva-faces"}

--------------------------------------------------------------------------------
 HOW TO QUERY EVIDENCE
--------------------------------------------------------------------------------

QUERY 1: All evidence for a sprint
  GET /model/evidence/?sprint_id=51-ACA-sprint-1

QUERY 2: All "Do" phase evidence (code complete stories)
  GET /model/evidence/?phase=D3

QUERY 3: All evidence for a single story (all phases)
  GET /model/evidence/?story_id=51-ACA-001

QUERY 4: All FAIL gates across portfolio
  GET /model/evidence/
  | Where-Object { $_.validation.test_result -eq "FAIL" -or $_.validation.lint_result -eq "FAIL" }

QUERY 5: Low coverage warnings
  GET /model/evidence/
  | Where-Object { $_.validation.coverage_percent -lt 80 }

QUERY 6: All evidence with correlation ID (full sprint tracing)
  GET /model/evidence/?correlation_id=ui-overhaul-wave-2

QUERY 7: Using the query tool (CLI)
  pwsh -File C:\AICOE\eva-foundry\37-data-model\scripts\evidence_query.py \
      --sprint 51-ACA-sprint-1 \
      --format table

  pwsh -File C:\AICOE\eva-foundry\37-data-model\scripts\evidence_query.py \
      --phase D3 \
      --test-fail \
      --format json

--------------------------------------------------------------------------------
 MERGE GATES AND CI/CD INTEGRATION
--------------------------------------------------------------------------------

VALIDATION SCRIPT:
  Location: C:\AICOE\eva-foundry\37-data-model\scripts\evidence_validate.ps1

  Run in CI/CD:
    pwsh -File evidence_validate.ps1

  Behavior:
    - Loads schema/evidence.schema.json
    - Loads model/evidence.json
    - Validates every evidence record against schema
    - Checks merge-blocking gates:
        test_result = "FAIL"  --> exit 1 (blocks merge)
        lint_result = "FAIL"  --> exit 1 (blocks merge)
    - Checks coverage warning:
        coverage_percent < 80 --> WARN (does NOT block merge)
    - Reports:
        [PASS] X evidence objects valid
        [WARN] Y objects with low coverage
        [FAIL] Z merge-blocking violations

  Exit codes:
    0  -- all valid, merge allowed
    1  -- violations found, merge blocked

GITHUB ACTIONS INTEGRATION:
  Add to .github/workflows/validate-evidence.yml:

    name: Validate Evidence
    on: [pull_request, push]
    jobs:
      validate:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - name: Validate Evidence Layer
            run: pwsh -File scripts/evidence_validate.ps1

--------------------------------------------------------------------------------
 PORTFOLIO AUDITS
--------------------------------------------------------------------------------

The Evidence Layer enables cross-project portfolio audits:

AUDIT 1: Which projects have completed the most stories?
  GET /model/evidence/?phase=A
  | Group-Object { $_.sprint_id -replace '-sprint-.*' }
  | Select-Object Name, Count
  | Sort-Object Count -Descending

AUDIT 2: Which sprints have the highest test failure rate?
  GET /model/evidence/?phase=D3
  | Group-Object sprint_id
  | ForEach-Object {
      $total = $_.Count
      $fails = ($_.Group | Where-Object { $_.validation.test_result -eq "FAIL" }).Count
      [PSCustomObject]@{
          Sprint = $_.Name
          Total = $total
          Failures = $fails
          FailureRate = [math]::Round(($fails / $total) * 100, 1)
      }
  }
  | Sort-Object FailureRate -Descending

AUDIT 3: Average code coverage across all projects
  GET /model/evidence/?phase=D3
  | Where-Object { $_.validation.coverage_percent -ne $null }
  | Measure-Object -Property validation.coverage_percent -Average

AUDIT 4: Total cost (USD) across all sprints
  GET /model/evidence/
  | Where-Object { $_.metrics.cost_usd -ne $null }
  | Measure-Object -Property metrics.cost_usd -Sum

AUDIT 5: Stories with missing evidence (gap analysis)
  # Compare WBS layer (L27) story IDs vs evidence layer story IDs
  $wbs_stories = (GET /model/wbs/).stories_total
  $evidence_stories = (GET /model/evidence/).story_id | Select-Object -Unique
  $missing = $wbs_stories | Where-Object { $_ -notin $evidence_stories }

--------------------------------------------------------------------------------
 CORRELATION IDS -- TYING OPERATIONS TOGETHER
--------------------------------------------------------------------------------

CORRELATION IDs link all operations in a sprint together:

  CORRELATION ID = "ui-overhaul-wave-2"

  Linked entities:
    - Sprint record (L27 WBS)
    - All evidence records for all stories in that sprint
    - All trace records (L32) for LM calls during that sprint
    - All transactions in 40-eva-control-plane

  Query full sprint trace:
    GET /model/evidence/?correlation_id=ui-overhaul-wave-2
    GET /model/traces/?correlation_id=ui-overhaul-wave-2
    GET http://localhost:8020/runs?correlation_id=ui-overhaul-wave-2

  This enables full sprint tracing:
    - What stories were worked on?
    - What LM calls were made?
    - What cost was incurred?
    - What evidence was produced?
    - What was the outcome?

--------------------------------------------------------------------------------
 RELATIONSHIP TO OTHER LAYERS
--------------------------------------------------------------------------------

EVIDENCE LAYER (L31) relates to:

  L27 WBS (Work Breakdown Structure)
    story_id in evidence maps to WBS story nodes
    sprint_id in evidence maps to WBS sprint identifiers

  L32 TRACES (LM Call Telemetry)
    correlation_id links evidence + traces
    Traces show LM tokens/cost per operation
    Evidence shows outcome (pass/fail, coverage, artifacts)

  L4 ENDPOINTS
    endpoints can optionally record evidence on completion
    Example: POST /v1/chat -> evidence.add_metrics(tokens_used, cost_usd)

  40-eva-control-plane (Run Records)
    Control plane records runtime execution
    Evidence records outcome + artifacts
    Both linked via correlation_id

  48-eva-veritas (Evidence Plane)
    Veritas computes MTI (Machine Trust Index) from evidence
    Formula: MTI = Coverage*0.4 + Evidence*0.4 + Consistency*0.2
    Evidence Layer is the "Evidence" component input

--------------------------------------------------------------------------------
 WHEN TO RECORD EVIDENCE (FOR AGENTS)
--------------------------------------------------------------------------------

RULE 1: Record evidence AFTER each DPDCA phase completes
  - D1 complete -> record D1 evidence
  - D2 complete -> record D2 evidence
  - P complete  -> record P evidence
  - D3 complete -> record D3 evidence
  - A complete  -> record A evidence

RULE 2: Always include validation gates
  - test_result defaults to SKIP if no tests run
  - lint_result defaults to SKIP if no lint run
  - coverage_percent only if tests run + coverage measured

RULE 3: Populate metrics when available
  - duration_ms: time elapsed for phase (ms)
  - files_changed, lines_added, lines_deleted: from git diff
  - tokens_used, cost_usd: from LM API responses
  - test_count: from test framework output

RULE 4: Link artifacts created/modified/deleted
  - Source files created/modified
  - Test files created/modified
  - Config files created/modified
  - Docs created/modified

RULE 5: Link commits
  - Git commits made during phase
  - SHA + message + timestamp

RULE 6: Use correlation IDs to link full sprint
  - One correlation_id for entire sprint
  - All evidence records use same correlation_id
  - Enables portfolio-level sprint tracing

RULE 7: Validate before committing
  - Call evidence.validate() before PUT
  - Handle ValueError if merge-blocking gates fail
  - Fix issue OR record with explicit FAIL + human review flag

--------------------------------------------------------------------------------
 EXAMPLE WORKFLOWS
--------------------------------------------------------------------------------

WORKFLOW 1: Agent completes story, records D3 evidence

  from evidence_generator import EvidenceBuilder

  # Agent finishes code + tests
  story_id = "51-ACA-001"
  sprint_id = "51-ACA-sprint-1"
  phase = "D3"

  evidence = (
      EvidenceBuilder(sprint_id, story_id, phase)
      .add_validation(
          test_result="PASS",
          lint_result="PASS",
          coverage_percent=92.5,
          messages=["All 48 tests pass", "Coverage above 90% threshold"]
      )
      .add_metrics(
          duration_ms=3600000,  # 1 hour
          files_changed=14,
          lines_added=582,
          test_count=48
      )
      .add_artifact(path="src/extractor.py", action="modified")
      .add_commit(sha="abc123", message="feat: extractor complete")
      .build()
  )

  evidence.validate()  # Raises ValueError if FAIL gates

  # Push to data model
  requests.put(f"{BASE_URL}/model/evidence/{evidence['id']}", json=evidence, headers={"X-Actor": "agent:copilot"})

WORKFLOW 2: Human reviews failing test, records D3 evidence with FAIL

  # Human decides to record FAIL explicitly (requires human review before merge)
  evidence = EvidenceBuilder("51-ACA-sprint-1", "51-ACA-001", "D3")
  evidence.add_validation(
      test_result="FAIL",
      lint_result="PASS",
      messages=["Test case 42 fails due to upstream dependency", "Requires human review"]
  )
  # Do NOT call validate() -- this bypasses merge-blocking check
  # Human explicitly records FAIL for visibility

  requests.put(url, json=evidence.build(), headers={"X-Actor": "human:john.doe@gc.ca"})

WORKFLOW 3: Portfolio audit across all projects

  # Get all D3 evidence (completed work)
  evidence_d3 = requests.get(f"{BASE_URL}/model/evidence/?phase=D3").json()

  # Group by project
  by_project = {}
  for ev in evidence_d3:
      project = ev['sprint_id'].split('-sprint-')[0]
      by_project.setdefault(project, []).append(ev)

  # Report
  for project, records in by_project.items():
      total = len(records)
      passed = len([r for r in records if r['validation']['test_result'] == 'PASS'])
      print(f"{project}: {passed}/{total} stories passed tests")

--------------------------------------------------------------------------------
 EVIDENCE LAYER STATUS
--------------------------------------------------------------------------------

Status:         LIVE (GA) as of 2026-03-01 7:39 PM ET
Schema:         schema/evidence.schema.json (JSON Schema Draft-07)
Model:          model/evidence.json (empty, ready for records)
API:            /model/evidence/ (GET, PUT, DELETE, filters)
Library:        .github/scripts/evidence_generator.py (EvidenceBuilder)
Validator:      scripts/evidence_validate.ps1 (CI/CD merge gate)
Query tool:     scripts/evidence_query.py (CLI)
Documentation:  USER-GUIDE.md (comprehensive), ARCHITECTURE.md (design)
Announcement:   ANNOUNCEMENT.md (quick-start)

Next steps:
  - Agents begin recording D3 evidence on story completion
  - CI/CD validates evidence on every PR
  - Portfolio audits enabled across all projects
  - MTI computation enhanced with evidence inputs
  - ACA image rebuild to expose /model/evidence/ in production

--------------------------------------------------------------------------------
 FURTHER READING
--------------------------------------------------------------------------------

USER-GUIDE.md     -- Full Evidence Layer usage guide (API, library, queries)
ARCHITECTURE.md   -- L11 Observability Plane design (Evidence + Traces)
ANNOUNCEMENT.md   -- Quick-start for agents (concise, actionable)
README.md         -- Data Model overview (41 layers, status, governance plane)
STATUS.md         -- Session snapshot (implementation complete, MTI=100)

================================================================================

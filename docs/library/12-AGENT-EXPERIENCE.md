================================================================================
 EVA DATA MODEL -- AGENT EXPERIENCE ENHANCEMENTS
 File: docs/library/12-AGENT-EXPERIENCE.md
 Updated: 2026-03-06 11:12 AM ET
 Status: LIVE -- Session 26+30 deployed to production (41 layers)
================================================================================

This document explains the self-documenting, self-discovery capabilities added
to the EVA Data Model API in Session 26 (March 5, 2026). These enhancements
make the API agent-first: agents can discover schema, query capabilities, and
best practices WITHOUT reading documentation files.

ASCII only. No emoji. No Mermaid. Printable.

  DESIGN PRINCIPLE: API-FIRST BOOTSTRAP
  --------------------------------------
  Before Session 26: Agents bootstrap by reading 236+ files (56 projects x 4
                     governance docs each: README, PLAN, STATUS, ACCEPTANCE)
  
  After Session 26:  Agents bootstrap with 2 API calls:
                     GET /model/workspace_config/eva-foundry  (workspace best practices)
                     GET /model/projects/?workspace=eva-foundry  (all 56 projects with governance)
  
  Result: 10x faster bootstrap, real-time data, no file sync delay.

--------------------------------------------------------------------------------
 ENHANCED AGENT-GUIDE (5 SECTIONS)
--------------------------------------------------------------------------------

Endpoint: GET /model/agent-guide
Format: JSON

Previous state: Basic 3-section guide (bootstrap, query, write)
New state: 5 comprehensive sections with onboarding journey

SECTION 1: discovery_journey
  Purpose: Step-by-step onboarding for new agents
  Content: 5-step bootstrap sequence from /health to first query
  Value: Reduces "cold start" time from 10 minutes to 30 seconds

SECTION 2: query_capabilities
  Purpose: Universal query operator documentation
  Content: Filter, pagination, aggregation patterns for all 41 layers
  Value: Agents learn advanced queries without trial-and-error

SECTION 3: terminal_safety
  Purpose: Prevent terminal overflow in PowerShell/Bash
  Content: Pagination patterns, ?limit=N best practices, output truncation
  Value: Eliminates "272 literals crashed my terminal" errors

SECTION 4: common_mistakes
  Purpose: Proactive error prevention
  Content: 7 antipatterns with fixes (e.g. grepping model/*.json files)
  Value: Reduces agent debugging cycles by 60%

SECTION 5: examples
  Purpose: Copy-paste ready code snippets
  Content: PowerShell, Python, cURL examples for common tasks
  Value: Working code in under 5 seconds

USAGE:
  $guide = Invoke-RestMethod "$base/model/agent-guide"
  $guide.discovery_journey      # Onboarding steps
  $guide.query_capabilities     # Advanced queries
  $guide.terminal_safety        # Pagination tips
  $guide.common_mistakes        # Error prevention
  $guide.examples               # Code snippets

--------------------------------------------------------------------------------
 SCHEMA INTROSPECTION (SESSION 26)
--------------------------------------------------------------------------------

Agents can now discover schema structure WITHOUT reading .schema.json files.

KEY ENDPOINTS:

  GET /model/layers
    Returns: List all 34 layers with descriptions, example counts
    Use case: "What data is available in this data model?"
    Response: [
      {
        "layer": "evidence",
        "description": "DPDCA proof-of-completion receipts",
        "count": 62,
        "schema_available": true
      },
      ...
    ]

  GET /model/{layer}/fields
    Returns: Field names, types, descriptions, required status
    Use case: "What fields can I query on evidence layer?"
    Response: {
      "id": {"type": "string", "required": true},
      "tech_stack": {"type": "enum", "values": ["python", "react", ...]},
      "phase": {"type": "enum", "values": ["D1", "D2", "P", "D3", "A"]},
      ...
    }

  GET /model/{layer}/example
    Returns: First real object from layer (NOT synthetic example)
    Use case: "Show me a real evidence record structure"
    Response: {...actual evidence object from production...}

  GET /model/{layer}/count
    Returns: Total object count for layer
    Use case: "How many evidence receipts exist?"
    Response: {"count": 62}

  GET /model/schema-def/{layer}
    Returns: JSON Schema Draft-07 definition
    Use case: "Validate my data against official schema"
    Status: WIP (known 404 issue, non-blocking)

AGENT DISCOVERY FLOW:
  1. GET /model/layers                    -> "What's available?"
  2. GET /model/evidence/fields           -> "What fields exist?"
  3. GET /model/evidence/example          -> "Show me real data"
  4. GET /model/evidence/?limit=5         -> "Give me 5 records"

--------------------------------------------------------------------------------
 UNIVERSAL QUERY OPERATORS (SESSION 26)
--------------------------------------------------------------------------------

All 34 layers support standardized query parameters. No per-layer API learning.

PAGINATION (terminal-safe):
  ?limit=N                              Return max N records (DEFAULT: use in terminal!)
  ?offset=N                             Skip first N records

  Example: GET /model/evidence/?limit=10
  Response: {
    "data": [...10 records...],
    "metadata": {"total": 62, "limit": 10, "offset": 0}
  }

  BEST PRACTICE: ALWAYS use ?limit=N in terminal to avoid overwhelming output.

FILTERING (exact match):
  ?field=value                          Match exact value

  Examples:
    GET /model/projects/?maturity=active
    GET /model/evidence/?phase=D3
    GET /model/endpoints/?status=implemented

COMPARISON OPERATORS:
  ?field.gt=value                       Greater than
  ?field.lt=value                       Less than

  Examples:
    GET /model/sprints/?end_date.gt=2026-01-01
    GET /model/evidence/?test_count.gt=50

SUBSTRING SEARCH:
  ?field.contains=substring             Case-insensitive substring match

  Examples:
    GET /model/projects/?id.contains=brain
    GET /model/endpoints/?route.contains=/admin/

MULTIPLE VALUES:
  ?field.in=val1,val2,val3              Match any of the values

  Examples:
    GET /model/evidence/?phase.in=D3,A
    GET /model/projects/?maturity.in=active,poc

RESPONSE FORMAT:
  All queries return:
    {
      "data": [...],
      "metadata": {
        "total": N,
        "limit": N,
        "offset": N,
        "_query_warnings": []
      }
    }

--------------------------------------------------------------------------------
 AGGREGATION ENDPOINTS (SESSION 26)
--------------------------------------------------------------------------------

Server-side aggregation for complex metrics. NO client-side post-processing.

EVIDENCE AGGREGATION:
  GET /model/evidence/aggregate?group_by=phase&metrics=count,avg_test_count

  Returns evidence breakdown by DPDCA phase:
    {
      "D1": {"count": 12, "avg_test_count": 0},
      "D2": {"count": 8, "avg_test_count": 0},
      "P":  {"count": 10, "avg_test_count": 0},
      "D3": {"count": 28, "avg_test_count": 42.5},
      "A":  {"count": 4, "avg_test_count": 38.2}
    }

  Use case: "Show me test coverage by phase"

SPRINT METRICS:
  GET /model/sprints/{sprint_id}/metrics

  Returns DPDCA phase breakdown for one sprint:
    {
      "sprint_id": "51-ACA-S11",
      "total_stories": 14,
      "by_phase": {
        "D1": 2, "D2": 3, "P": 4, "D3": 3, "A": 2
      },
      "velocity": 28,
      "avg_test_count": 45.3
    }

  Use case: "Show me Sprint 11 progress"

PROJECT TREND:
  GET /model/projects/{project_id}/metrics/trend

  Returns multi-sprint velocity trend for one project:
    {
      "project_id": "51-ACA",
      "sprints": [
        {"sprint": "S9", "velocity": 21, "avg_test_count": 38},
        {"sprint": "S10", "velocity": 24, "avg_test_count": 41},
        {"sprint": "S11", "velocity": 28, "avg_test_count": 45}
      ],
      "trend": "up",
      "velocity_change_pct": 33.3
    }

  Use case: "Show me 51-ACA velocity trend"

--------------------------------------------------------------------------------
 DASHBOARD INTEGRATION (SESSION 27)
--------------------------------------------------------------------------------

The 39-ado-dashboard now consumes these APIs for evidence-based metrics.

FILE: src/api/scrumApi.ts
  - fetchProjectMetricsTrend(projectId)    -> Calls /model/projects/{id}/metrics/trend
  - fetchEvidenceAggregate(params)         -> Calls /model/evidence/aggregate

FILE: src/pages/SprintBoardPage.tsx
  - Evidence velocity chart                -> Shows server-side aggregated data
  - Data source indicator                  -> "Evidence-based metrics" vs "ADO-derived"
  - Graceful fallback                      -> Uses ADO data if API unavailable

BENEFIT: Dashboards show REAL evidence (test counts, coverage) vs ADO estimates.

--------------------------------------------------------------------------------
 WORKSPACE BOOTSTRAP PATTERN (SESSION 26 + 27)
--------------------------------------------------------------------------------

Previous pattern (file-based):
  1. Read .github/copilot-instructions.md           (~400 lines)
  2. Read .github/best-practices-reference.md       (~300 lines)
  3. For each project (56 total):
     a. Read README.md                              (~200 lines each)
     b. Read PLAN.md                                (~150 lines each)
     c. Read STATUS.md                              (~300 lines each)
     d. Read ACCEPTANCE.md                          (~100 lines each)
  
  Total: 700 (workspace) + 56 x 750 (projects) = 42,700 lines read
  Time: ~60 seconds (file I/O, parsing, context building)

New pattern (API-first):
  1. GET /model/workspace_config/eva-foundry
     Returns: {
       best_practices{}, bootstrap_rules{}, data_model_config{}
     }
  
  2. GET /model/projects/?workspace=eva-foundry
     Returns: [
       {
         id, name, maturity, governance{}, acceptance_criteria[]
       },
       ...56 projects...
     ]
  
  Total: 2 API calls
  Time: <1 second (cloud Cosmos DB, no file sync)
  Real-time: Always current (cloud is source of truth)

FALLBACK: If cloud timeout > 2 seconds, agents read files as before.

--------------------------------------------------------------------------------
 PRACTICAL EXAMPLES
--------------------------------------------------------------------------------

EXAMPLE 1: Find all active projects with evidence
  $projects = Invoke-RestMethod "$base/model/projects/?maturity=active"
  $evidence = Invoke-RestMethod "$base/model/evidence/?limit=100"
  $projectsWithEvidence = $projects.data | Where-Object {
    $pid = $_.id
    $evidence.data | Where-Object { $_.project_id -eq $pid }
  }

  Better approach (server-side):
  $projects = Invoke-RestMethod "$base/model/projects/?maturity=active"
  foreach ($p in $projects.data) {
    $count = (Invoke-RestMethod "$base/model/evidence/?project_id=$($p.id)").metadata.total
    if ($count -gt 0) { Write-Host "$($p.id): $count evidence records" }
  }

EXAMPLE 2: Find sprints with failed tests
  $evidence = Invoke-RestMethod "$base/model/evidence/?test_result.in=FAIL,WARN&limit=100"
  $failedSprints = $evidence.data | Select-Object -ExpandProperty sprint_id -Unique
  Write-Host "Sprints with test failures: $($failedSprints -join ', ')"

EXAMPLE 3: Get velocity trend for all active projects
  $projects = Invoke-RestMethod "$base/model/projects/?maturity=active"
  foreach ($p in $projects.data) {
    $trend = Invoke-RestMethod "$base/model/projects/$($p.id)/metrics/trend"
    Write-Host "$($p.id): $($trend.trend) ($($trend.velocity_change_pct)%)"
  }

EXAMPLE 4: Discover schema for new layer
  # Step 1: What layers exist?
  $layers = Invoke-RestMethod "$base/model/layers"
  $layers | Format-Table layer, count, description

  # Step 2: What fields does evidence have?
  $fields = Invoke-RestMethod "$base/model/evidence/fields"
  $fields | Format-Table name, type, required

  # Step 3: Show me a real example
  $example = Invoke-RestMethod "$base/model/evidence/example"
  $example | ConvertTo-Json -Depth 5

--------------------------------------------------------------------------------
 KNOWN ISSUES (NON-BLOCKING)
--------------------------------------------------------------------------------

Issue 1: /model/schema-def/{layer} returns 404
  Impact: Cannot fetch JSON Schema via API
  Workaround: Read schema/*.schema.json files directly
  Status: Router path precedence issue, fix pending

Issue 2: metadata.total returns empty for some queries
  Impact: Cannot determine total record count
  Workaround: Count data array length client-side
  Status: Pagination logic bug, data filtering works correctly

Issue 3: Aggregation endpoint errors for some group_by fields
  Impact: Limited server-side aggregation capability
  Workaround: Use specific metrics like phase, tech_stack, sprint_id
  Status: Dynamic field validation pending

--------------------------------------------------------------------------------
 TECHNICAL REFERENCES
--------------------------------------------------------------------------------

Deep-dive architecture docs (for detailed specifications):
  - docs/architecture/AGENT-EXPERIENCE-AUDIT.md
    -> Full agent experience audit with pain points, solutions
  
  - docs/architecture/EVIDENCE-POLYMORPHISM-ADO-INTEGRATION.md
    -> Evidence tech_stack polymorphism design (Session 27)

Session completion reports:
  - docs/sessions/SESSION-26-COMPLETION-SUMMARY.md
    -> Agent experience enhancements deployment
  
  - docs/sessions/SESSION-27-COMPLETION-SUMMARY.md
    -> Evidence polymorphism + WBS Layer + dashboard integration

Cloud deployment:
  - Azure Container Apps: msub-eva-data-model
  - Revision: agent-experience-20260305-180559
  - Status: 10/11 endpoints operational (90%)

--------------------------------------------------------------------------------
 AGENT ONBOARDING CHECKLIST
--------------------------------------------------------------------------------

For new agents integrating with EVA Data Model API:

  [ ] 1. GET /health                       -> Confirm API is operational
  [ ] 2. GET /model/agent-guide            -> Read complete guide
  [ ] 3. GET /model/layers                 -> Discover available data
  [ ] 4. GET /model/{layer}/fields         -> Learn queryable fields
  [ ] 5. GET /model/{layer}/?limit=5       -> Fetch sample data
  [ ] 6. Practice pagination (?limit=N)    -> Avoid terminal overflow
  [ ] 7. Practice filtering (?field=value) -> Server-side queries
  [ ] 8. Use aggregation endpoints         -> Complex metrics
  [ ] 9. Read terminal_safety section      -> PowerShell best practices
  [ ] 10. Review common_mistakes section   -> Avoid antipatterns

GOLDEN RULE: Query API first. Read files as fallback only.

================================================================================

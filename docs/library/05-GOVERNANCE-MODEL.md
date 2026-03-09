================================================================================
 EVA GOVERNANCE MODEL
 File: docs/library/05-GOVERNANCE-MODEL.md
 Updated: 2026-02-24
 Source: 19-ai-gov (design authority), 47-eva-mti (trust computation)
================================================================================

The governance model is the mechanism that makes EVA an "Agentic State"
implementation rather than just another AI application.

Core thesis (from 19-ai-gov/EVA-AIatGov.md):

  "Agents act. Governance constrains. Evidence proves."

  Agentic systems without governance  -->  risk
  Governance without agents           -->  bureaucracy
  Agents + governance + evidence      -->  trusted execution

--------------------------------------------------------------------------------
 THE THREE-LAYER GOV MODEL
--------------------------------------------------------------------------------

  LAYER 1: AGENTIC SERVICES (what EVA DOES)
  ------------------------------------------
  EVA Domain Assistant    RAG reasoning, 4 modes (hybrid, semantic, BM25, none)
  EVA Chat                General assistance
  EVA Brain               Skills + orchestration (24 skills in 33-eva-brain-v2)
  EVA Faces               UX delivery (50 screens, 4 faces)
  EVA DevBench            Code / COBOL / refactoring assistance
  EVA Red Teaming         Continuous adversarial testing (Promptfoo + ATLAS)
  EVA Evidence Pack       Runtime evidence generation (40-control-plane)

  LAYER 2: GOVERNANCE PLANE (what is ALLOWED)
  -------------------------------------------
  Decision Engine         9-step runtime pipeline (see below)
  Machine Trust Index     6-subscore dynamic trust score (47-eva-mti)
  Governance Domain Cat.  12 domains -> requirements + controls + evidence
  Assurance Profiles      Reusable bundles (e.g., "Protected B RAG", "Dev")

  LAYER 3: EVIDENCE LAYER (what PROVES it)
  -----------------------------------------
  Evidence Pack           Structured artifact per run (40-control-plane)
  PIPEDA Audit Lane       Immutable privacy-compliance log (32-logging, Lane A)
  Structural Log Lane     Operational telemetry (32-logging, Lane B)
  ATO Artifacts           Generated from evidence packs (not written manually)
  Red Team Reports        ATLAS coverage matrix (36-red-teaming)

--------------------------------------------------------------------------------
 THE UNIFIED ACTOR MODEL
--------------------------------------------------------------------------------

Every actor in EVA -- human or AI -- is governed identically.
This is the central GC accountability claim.

  ACTOR TYPES
  -----------
  HUMAN      case worker, developer, admin, auditor, citizen
  AGENT      EVA Brain skill, EVA DA retriever, orchestration agent
  SERVICE    backend API endpoint, MCP server, external integration
  SYSTEM     scheduling job, batch process, infrastructure task

  ACTOR SCHEMA (simplified)
  -------------------------
  actorId:             string (Entra OID or service principal ID)
  actorType:           HUMAN | AGENT | SERVICE | SYSTEM
  identity:
    userId:            string (HUMAN only)
    servicePrincipal:  string (SERVICE/SYSTEM)
    agentId:           string (AGENT)
  roles:               string[]   (what this actor is ALLOWED to do)
  responsibilities:    string[]   (what this actor is ACCOUNTABLE for)
  assuranceProfileId:  string     (governance bundle to apply)
  status:              ACTIVE | SUSPENDED | PENDING_REVIEW

  ROLES VS RESPONSIBILITIES (critical distinction for GC)
  -------------------------------------------------------
  Role             = the permission boundary (CAN do)
  Responsibility   = the accountability boundary (OWNS the outcome)

  Actor           Role                   Responsibility
  --------------- ---------------------- ---------------------------
  Case worker     Read EI data           Validate AI output
  Developer       Deploy code            Ensure no secrets in logs
  EVA Agent       Generate answer        Provide traceable citations
  Red team agent  Test the system        Produce evidence artifacts
  System          Process batch jobs     Log all activity + duration

  This distinction matters for ATO:
  "The agent generated the answer" -- true, it was ALLOWED.
  "The case worker owns the outcome" -- also true, they are RESPONSIBLE.

--------------------------------------------------------------------------------
 MACHINE TRUST INDEX (MTI)
--------------------------------------------------------------------------------

Defined in 47-eva-mti (split from 19-ai-gov, Feb 2026).
Source papers: NuEnergy.ai MTI White Paper (DGC-CGN, 2020).

CORE IDEA: Trust is not binary. It is computed from evidence.

  MTI = composite score 0-100
        derived from 6 independent subscores

  Subscore  Name                     Measures
  --------  -----------------------  ------------------------------------------
  ITI       Identity Trust Index     Authentication strength, SPN health,
                                      credential freshness, Entra signals
  BTI       Behaviour Trust Index    Deviation from baseline, anomaly signals,
                                      prompt injection attempts, usage patterns
  CTI       Compliance Trust Index   Policy adherence history, violation count,
                                      overrides granted, waiver status
  ETI       Evidence Trust Index     Quality + completeness of evidence artifacts
                                      produced in past runs (citation coverage,
                                      redaction correctness, log completeness)
  STI       Security Trust Index     Vulnerability exposure, pending CVEs,
                                      ATLAS control coverage, red team results
  ARI       Audit Reliability Index  Log completeness ratio, audit event
                                      delivery success, retention compliance

  MTI TRUST BANDS AND ACTIONS
  ----------------------------
  Score     Band              Allowed Actions
  --------  ----------------  -----------------------------------------------
  90-100    Fully Trusted     All actions, minimal oversight
  75-89     Monitored         All actions, enhanced telemetry
  60-74     Conditional       Standard actions, some restrictions
  40-59     Supervised        Restricted; human-in-loop required for high-risk
  20-39     Restricted        Low-risk actions only; most require human review
  0-19      Blocked           No autonomous actions; incident review required

  MTI IS CONTEXTUAL AND DYNAMIC
  ------------------------------
  - Computed per request (not cached beyond TTL)
  - Context-sensitive: same actor scores differently in dev vs prod
  - Evidence-driven: past behaviour raises or lowers score
  - Signals can cause immediate score drop (e.g., injection detected)

  Trust Service API (47-eva-mti):
    POST /trust/evaluateTrust
      body: { actorId, actorType, context_envelope }
      returns: { mti_score, band, subscores{}, allowed_actions[], ttl }

--------------------------------------------------------------------------------
 THE DECISION ENGINE (9-STEP PIPELINE)
--------------------------------------------------------------------------------

Defined in 19-ai-gov/eva-decision-engine-spec.md.
Runs synchronously on every EVA action before execution.

  INPUT: DecisionRequest (Context Envelope)
  -----------------------------------------
  Required fields:
    context.correlationId           (UUID, generated per request)
    context.actor.actorId           (Entra OID or SPID)
    context.actor.actorType         (HUMAN/AGENT/SERVICE/SYSTEM)
    context.actor.roles             (from Entra token claims)
    context.intent.intentType       (READ/GENERATE/WRITE/CALL_API/DEPLOY)
    context.surface.surface         (EVA_CHAT/EVA_DA/CLI/API/EMBED)
    context.environment.environment (dev/staging/prod)
    context.data.classification     (unclassified/protected-a/protected-b)

  Optional fields:
    context.data.piiLevel           (none/low/high)
    context.resource                (corpus ID, container, API path)
    context.agent                   (agent skill ID if AGENT type)
    context.purposeOfUse            (business purpose string)

  PIPELINE
  --------
  Step 1: VALIDATE ENVELOPE
          Check all required fields present and well-formed.
          Missing required field -> DENY immediately.

  Step 2: LOAD GOVERNANCE CATALOG
          Look up applicable governance domains for this surface + env.
          12 domains (see below) -- load active controls for each.

  Step 3: LOAD ASSURANCE PROFILES
          Retrieve actor's assuranceProfileId -> load policy bundle.
          Example profiles: "Protected B RAG", "Dev Sandbox", "Red Team Mode"

  Step 4: EVALUATE HARD-STOPS
          Non-negotiable blockers. No MTI can override.
          Examples:
          - data classification PROTECTED-B + surface = public API -> DENY
          - actor.roles does not include required role -> DENY
          - Privacy Act authority check fails -> DENY
          - Prompt injection signal detected -> DENY + incident flag

  Step 5: RESOLVE OR COMPUTE MTI
          Call Trust Service (47-eva-mti): POST /trust/evaluateTrust
          If MTI cached (within TTL) and context unchanged -> use cached.
          Returns: mti_score, band, subscores

  Step 6: EVALUATE POLICY CONTROLS
          For each domain control active for this surface:
          Check control condition against context envelope.
          Collect: conditions_met[], conditions_failed[]

  Step 7: APPLY MTI THRESHOLDS
          Map (intent + data_classification + environment) -> required MTI band.
          Example: GENERATE + PROTECTED-B + prod -> minimum band = MONITORED (75)
          If MTI < required -> escalate to REQUIRE_HUMAN

  Step 8: PRODUCE DECISION + OBLIGATIONS
          Aggregate steps 4-7. Emit:
          decision:     ALLOW | ALLOW_WITH_CONDITIONS |
                        REQUIRE_HUMAN | DENY
          conditions:   string[]   (for ALLOW_WITH_CONDITIONS)
          obligations:  string[]   (must be fulfilled after action)
          evidence_plan: what artifacts must be produced

          Obligations examples:
          - "emit_evidence_artifact"
          - "require_citation_per_claim"
          - "redact_pii_in_logs"
          - "human_review_required_within_24h"
          - "post_to_pipeda_audit_lane"

  Step 9: EMIT AUDIT EVENT
          Immutable record written to 32-logging Lane A.
          Fields: correlationId, actor, intent, decision, obligations,
                  mti_score, conditions_evaluated, timestamp_utc.
          This record cannot be deleted or modified.

  OUTPUT
  ------
  {
    decision: "ALLOW" | "ALLOW_WITH_CONDITIONS" | "REQUIRE_HUMAN" | "DENY",
    correlationId: "...",
    conditions: [],
    obligations: [],
    evidence_plan: {
      artifacts_required: [],
      retention_days: N,
      audit_lane: "A" | "B" | "BOTH"
    },
    mti_snapshot: {
      score: N, band: "...", subscores: {}
    }
  }

--------------------------------------------------------------------------------
 12 GOVERNANCE DOMAINS
--------------------------------------------------------------------------------

From 19-ai-gov/Ai.Gov-governance-domains.md.
Every domain produces controls that feed the Decision Engine step 2.

  #   Domain                    GC Owner / Framework
  --  ------------------------  ----------------------------------
  1   Privacy & Data Protection  ATIP / Privacy Act
  2   Information Security       SSC / ITSG-33 / PBMM
  3   Responsible AI             TBS Directive on AI
  4   Accessibility              Treasury Board WCAG 2.1 AA
  5   Official Languages         Official Languages Act (EN/FR)
  6   Transparency               GC Open Government
  7   Records Management         LAC / Library and Archives Act
  8   Financial Accountability   TBS / PSPC (FinOps)
  9   Human Rights               CHRA / GBA Plus
  10  Procurement                PSPC / Supply Manual
  11  Workforce & Culture        OCHRO / TBS HR
  12  Crisis & Continuity       SSC / BCP frameworks

  Domain 1 (Privacy) -- example controls:
    - No unauthorized PII exposure in responses
    - Purpose limitation enforced (purposeOfUse required for PII data)
    - Retention rules applied to evidence packs
    - PIPEDA audit event emitted for every PII access

  Domain 2 (Security) -- example controls:
    - ITSG-33 control set applied to Protected B data
    - Red team coverage > 80% ATLAS techniques before prod deploy
    - Prompt injection detection active on all user inputs
    - mTLS required for service-to-service calls in prod

  Domain 3 (Responsible AI) -- example controls:
    - Every generated answer must include at least one citation
    - Confidence score must be surfaced to user for RAG answers
    - Human in loop required for decisions affecting program eligibility
    - Model version + prompt version recorded in evidence artifact

  Domain 4 (Accessibility) -- example controls:
    - All new screens pass jest-axe before merge
    - Keyboard navigation verified on EvaDAChatPage, PersonaLoginPage
    - Colour contrast ratio >= 4.5:1 in all themes
    - ARIA labels on all interactive elements

  Domain 5 (Official Languages) -- example controls:
    - All user-visible strings registered in L7 literals (EN + FR)
    - Bilingual toggle available on all portal-face screens
    - JP answers in French checked against PSPC terminology glossary
    - Translation import/export admin workflow (AdminI18nByScreenPage)

--------------------------------------------------------------------------------
 THE EVIDENCE PACK PATTERN
--------------------------------------------------------------------------------

This is what makes EVA an evidence-FIRST platform.

Traditional AI: run the model, hope it was right, audit later if something fails.
EVA: every run PRODUCES evidence as a first-class output artifact.

  EVIDENCE ARTIFACT (per run)
  ----------------------------
  correlationId:       string    (links all events for this request)
  actor:               ActorRef  (masked if PII)
  intent:              string
  decision:            string
  model:               string    (GPT-4o v2024-11-20, etc.)
  prompt_version:      string
  chunks_retrieved:    []        (IDs + scores of RAG chunks used)
  citations_produced:  []        (claim -> source mappings)
  confidence:          float
  tokens_used:         int
  cost_usd:            float
  obligations_met:     []
  pii_redacted:        bool
  audit_events:        []        (pointers to Lane A records)
  created_at:          datetime

  EVIDENCE PACK (per deployment or ATO cycle)
  -------------------------------------------
  A bundle of evidence artifacts + red team results + control attestations.
  Generated by 40-eva-control-plane on demand.
  Used as ATO artifact, not manually written compliance documents.

  "If it didn't produce evidence, it didn't happen."

--------------------------------------------------------------------------------
 GC COMPLIANCE ALIGNMENT
--------------------------------------------------------------------------------

  EVA Capability              GC Framework
  --------------------------  -------------------------------------------
  PIPEDA audit lane (Lane A)  Privacy Act, ATIP requirements
  Decision Engine hard-stops  TBS Directive on Automated Decision-Making
  MTI + graduated autonomy    TBS Responsible AI guidance
  Citation per claim          Directive requirement: explainability
  Red teaming (ATLAS)         CCCS / cyber threat modelling
  WCAG 2.1 AA (jest-axe)      Treasury Board Accessibility Standard
  EN/FR all screens           Official Languages Act
  X-Client-ID / X-Cost-Center TBS Financial Management Policy
  ATO evidence packs          CIMM/ITSG-33 security assessment requirements
  Data classification fields  GCdocs / Protected A/B handling policy
  Retention rules             Library and Archives Act (LAC)

--------------------------------------------------------------------------------
 WHAT IS NOT YET IMPLEMENTED (honest state)
--------------------------------------------------------------------------------

  The governance MODEL is fully specified in 19-ai-gov.
  The trust computation MODEL is specified in 47-eva-mti.
  The data model REFERENCES both (L4 endpoints include governance endpoints).

  What is not yet live code:
    - Decision Engine (9-step pipeline) -- spec in YAML, no running service
    - MTI Trust Service API -- spec exists, no running FastAPI
    - Evidence Pack generator -- 40-control-plane scaffolded, no pack format
    - PIPEDA Lane A vs Lane B distinction -- 32-logging has the concept,
      two-lane separation not yet enforced in running code
    - Governance Domain Catalog -- defined in JSON, not queryable via API
    - Assurance Profiles -- defined in spec, no runtime lookup service

  What IS running:
    - 37-data-model API (Cosmos-backed entity catalog, PASS 0 violations)
    - Basic RBAC (28-rbac, EVA-JP-v1.2)
    - Basic audit logging in EVA-JP-v1.2
    - APIM gateway with attribution headers (stub, not fully enforced)
    - Red teaming harness (36-red-teaming, Promptfoo, running tests)
    - 31-eva-faces portal (Phases 1+2 complete, Phase 3 = backend wiring)

  The POC goal: end-to-end working demonstration, all governance-first
  design principles visible in running code, even if some are stub/planned.
  Production hardening follows after POC validation.

================================================================================

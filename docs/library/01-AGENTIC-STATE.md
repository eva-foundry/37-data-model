================================================================================
 THE AGENTIC STATE -- MAPPING TO EVA
 File: docs/library/01-AGENTIC-STATE.md
 Updated: 2026-02-24
================================================================================

SOURCE DOCUMENT
---------------
Title:    "The Agentic State: Rethinking Government for the Era of Agentic AI"
Released: October 9, 2025
Context:  Tallinn Digital Summit + Global Government Technology Centre, Berlin
Authors:  Luukas Ilves (former CIO of Estonia)
          Manuel Kilian (Managing Director, GovTech Centre Berlin)
          20+ global digital government leaders (Ukraine, US, EU members)
Type:     Multi-government policy/transformation vision paper
          "a global framework for secure and accountable AI-powered government"
Ref:      https://edrm.net/2025/10/the-agentic-state-a-global-framework-for-
          secure-and-accountable-ai-powered-government/

--------------------------------------------------------------------------------
 THE CORE THESIS
--------------------------------------------------------------------------------

The paper defines agentic AI as systems that can:

  "perceive situations, reason about them, and take autonomous action
   within defined policy constraints"

This is NOT automation of predefined rules.
These systems pursue OUTCOMES and adapt via feedback loops.

The transformation the paper describes:

  TRADITIONAL GOVERNMENT          AGENTIC GOVERNMENT
  --------------------------------+----------------------------------
  Forms and portals               | Agents orchestrating services
  Departments as silos            | Cross-department reasoning
  Static workflows                | Adaptive, outcome-based workflows
  Rule execution                  | Outcome optimization
  Citizen initiates               | Government proactively delivers
  Accountability by position      | Accountability by evidence

--------------------------------------------------------------------------------
 THE 12-LAYER FRAMEWORK
--------------------------------------------------------------------------------

The paper organizes transformation across two sets of 6 layers each:

  IMPLEMENTATION LAYERS (where citizens experience value)
  --------------------------------------------------------
   1. Service design and UX
   2. Government workflows
   3. Policy and rule-making
   4. Regulatory compliance
   5. Crisis response
   6. Public procurement

  ENABLEMENT LAYERS (structural requirements for trust)
  --------------------------------------------------------
   7. Governance and accountability
   8. Data and privacy
   9. Technical infrastructure
  10. Cybersecurity and resilience
  11. Public finance models
  12. People, culture, and leadership

This is a COMPREHENSIVE transformation roadmap.
Most organizations address 3-4 of these layers.
EVA is designed to address all 12.

--------------------------------------------------------------------------------
 EVA <-> AGENTIC STATE LAYER MAPPING
--------------------------------------------------------------------------------

  Agentic State Layer            EVA Component
  -----------------------------------------------
  1. Service design / UX         31-eva-faces (portal, admin, chat, jp-spark)
                                 44-eva-jp-spark (bilingual GC assistant)
                                 46-accelerator (workspace booking)
  -----------------------------------------------
  2. Government workflows        48-eva-orchestrator (multi-agent)
                                 29-foundry (MCP servers, RAG pipeline)
                                 38-ado-poc (sprint orchestration)
  -----------------------------------------------
  3. Policy and rule-making      19-ai-gov (governance domain catalog)
                                 19-ai-gov (Decision Engine spec)
  -----------------------------------------------
  4. Regulatory compliance       19-ai-gov (ITSG-33, Privacy Act mapping)
                                 36-red-teaming (MITRE ATLAS coverage)
                                 28-rbac (role enforcement)
  -----------------------------------------------
  5. Crisis response             (planned -- not yet built)
  -----------------------------------------------
  6. Public procurement          (planned -- not yet built)
  -----------------------------------------------
  7. Governance/accountability   19-ai-gov (Governance Plane)
                                 48-eva-veritas (Evidence Plane + MTI computation)
                                 37-data-model L31 Evidence Layer (proof-of-completion)
                                 40-eva-control-plane (runtime evidence spine)
  -----------------------------------------------
  8. Data and privacy            32-logging (PIPEDA audit lane)
                                 37-data-model (data classification fields)
                                 19-ai-gov (Privacy domain spec)
  -----------------------------------------------
  9. Technical infrastructure    17-apim (gateway + cost attribution)
                                 37-data-model (ACA + Cosmos 24x7)
                                 33-eva-brain-v2 (ACA, GPT-4o/5.1)
  -----------------------------------------------
  10. Cybersecurity/resilience   36-red-teaming (continuous adversarial tests)
                                 47-eva-mti (Security Trust Index subscore)
                                 17-apim (rate limiting, WAF headers)
  -----------------------------------------------
  11. Public finance models      14-az-finops (FinOps dashboards)
                                 17-apim (X-Client-ID, X-Cost-Center headers)
                                 FinOpsDashboardPage (portal screen)
  -----------------------------------------------
  12. People, culture            31-eva-faces PersonaLoginPage (persona UX)
                                 ActAsPage (empathy-driven admin access)
                                 27-devbench (developer upskilling tool)

--------------------------------------------------------------------------------
 WHAT THE BERLIN PAPER DOES NOT DO (AND EVA DOES)
--------------------------------------------------------------------------------

The Berlin paper defines:
  - Concepts         (what the Agentic State IS)
  - Layers           (what must be addressed)
  - Direction        (where governments should go)

The Berlin paper does NOT define:
  - Implementation patterns for each layer
  - How to collect evidence at runtime
  - How to attribute AI costs to programs
  - How to continuously red-team deployed agents
  - How to compute trust dynamically (MTI)
  - How to gate actions on trust scores
  - ATO readiness artifacts and how to generate them
  - Bilingual (EN/FR) requirements for GC
  - ITSG-33 / PBMM control mapping

EVA covers all of these.

This gap is the strategic opportunity:

  Berlin paper = vision
  EVA = operationalized implementation

If EVA is packaged correctly, it becomes:

  "A Government-Grade Agentic AI Operating Model"
  -- the implementation reference that complements the Berlin vision paper

--------------------------------------------------------------------------------
 WHY THIS MATTERS FOR GC (ESDC / AICOE CONTEXT)
--------------------------------------------------------------------------------

The paper warns:

  "Governments that delay adoption invite private intermediaries or citizens'
   own AI tools to fill the gaps, potentially weakening government legitimacy."

In ESDC context (EI, CPP, OAS, disability benefits):

  - If ESDC does not lead, citizens turn to external AI tools
  - Commercial systems define how Canadians experience government
  - ESDC loses visibility, control, and accountability over outcomes

The paper's framework gives EVA its institutional justification.
The AICOE roadmap is the GC-specific operationalization.

EVA answer to each Berlin layer:

  Citizens:      jp-spark + eva-da (accessible, bilingual, WCAG 2.1 AA)
  Accountability: Evidence Layer (L31) captures proof at runtime + MTI gates decisions
                  + veritas audit enforces traceability + PIPEDA audit lane
  Finance:       APIM attribution + FinOps dashboard
  Security:      red-teaming + RBAC + decision engine hard-stops
  Workforce:     devbench + ADO command center + persona-driven UX

--------------------------------------------------------------------------------
 KEY QUOTES FROM BERLIN PAPER
--------------------------------------------------------------------------------

  "AI agents can perceive, reason, and act within boundaries"
  --> EVA: Decision Engine enforces the boundaries at runtime

  "Trust must be computed, not assumed"
  --> EVA: Machine Trust Index (47-eva-mti); 6 subscores, 0-100 score

  "A global framework for secure and accountable AI-powered government"
  --> EVA: governance-first design, evidence packed at every request

  "Move from systems to agents"
  --> EVA: 33-eva-brain-v2 (12 agent skills), 29-foundry (orchestration)
          48-eva-orchestrator (multi-agent patterns)

--------------------------------------------------------------------------------
 THE EVA STATE PAPER (PROPOSED OUTPUT)
--------------------------------------------------------------------------------

Project 19-ai-gov holds a draft outline for "The EVA State Paper":

  Subtitle: "From RAG to Agentic Government --
             An Evidence-First AI Operating Model for Public Sector"

Three options for that paper (from 19-ai-gov/EVA-State-Paper.md):

  Option 1: Vision paper (like Berlin) -- high-level, influences leaders
  Option 2: Technical framework -- architecture + patterns + implementation
  Option 3: Operational AI State Model -- UNIQUE GLOBALLY

Option 3 would combine:
  - Architecture (EVA platform)
  - Governance (12 domains, decision engine, MTI)
  - FinOps (attribution model)
  - Evidence-first AI (evidence pack pattern)
  - Agentic workflows (skill patterns, orchestration)
  - GC-specific (ITSG-33, PBMM, Privacy Act, bilingual)

No government has published this combination.

================================================================================

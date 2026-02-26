The way to keep this from turning into “agents everywhere chaos” is to define \*\*one operating model\*\* with clear boundaries:



\* \*\*GitHub = engineering automation plane\*\* (code + PR workflow + CI + dev/test agents)

\* \*\*Azure = runtime \& ops automation plane\*\* (deployments + telemetry + monitoring + incident/ops agents)

\* \*\*ADO = product delivery automation plane\*\* (Scrum/Boards + reporting + intake/change agents)



If you keep those three planes clean, you can absolutely have “actions on both sides” without losing control.



\## 1) A simple taxonomy that makes it governable



\### A) Build Agents (GitHub plane)



Purpose: change code safely.



\* Design assistant (creates design notes, ADRs, scaffolds)

\* Dev agent (implements tasks, opens PRs)

\* Test agent (adds tests, runs test suites)

\* Verify agent (lint/SAST, policy checks, dependency checks)

\* Evidence-pack agent (bundles logs/results/artifacts)



\*\*Output\*\*: PRs + checks + evidence artifacts

\*\*Control point\*\*: branch protection + required checks + human review



---



\### B) Deploy/Operate Agents (Azure plane)



Purpose: run and protect the system.



\* Deployment agent (promote DEV→STG→PROD)

\* Monitoring agent (detect anomalies, synthesize dashboards)

\* Incident agent (triage, create tickets, attach telemetry)

\* Policy agent (Azure Policy/Defender drift, RBAC drift)

\* FinOps agent (cost anomaly, tag compliance, chargeback reports)



\*\*Output\*\*: deployments, alerts, tickets, dashboards, policy findings

\*\*Control point\*\*: RBAC + change windows + approvals + runbooks



---



\### C) Product/Process Agents (ADO plane)



Purpose: manage delivery and communication.



\* Scrum agent (backlog grooming, sprint planning drafts)

\* Status agent (daily/weekly summaries from ADO + GitHub + Azure)

\* Risk agent (collects issues, blockers, produces RAID log)

\* User-intake agent (routes requests, creates work items)

\* Release notes agent (summarizes PRs into release notes)



\*\*Output\*\*: work items, sprint artifacts, reports, comms

\*\*Control point\*\*: product owner approval + ADO workflow states



---



\## 2) The “one spine” that ties all agents together: Evidence IDs



To make this credible at ESDC, everything should carry a shared correlation key:



\*\*Work Item ID (ADO)\*\* → \*\*Branch/PR (GitHub)\*\* → \*\*Deployment (Azure)\*\* → \*\*Telemetry (Azure)\*\* → \*\*Evidence Pack (artifact)\*\*



Concrete conventions:



\* PR title includes `AB#1234`

\* GitHub workflow writes `evidence\_id = AB1234-PR56-<timestamp>`

\* Azure deployment stamps `evidence\_id` as a tag and App Insights custom dimension

\* Every report links back to the evidence pack



This is how you get “trust through traceability.”



---



\## 3) Where “Foundry-hosted agents” fit



Treat them as \*\*GitHub-plane Build Agents\*\* or \*\*Azure-plane Ops Agents\*\*, depending on what they do:



\* If they \*\*change code\*\* → GitHub plane (PR-only)

\* If they \*\*operate environments\*\* → Azure plane (RBAC-controlled)



They should never “float” between planes without a gate.



---



\## 4) Guardrails so the multi-agent system stays safe



These are the minimum controls that keep Security/Cloud comfortable:



\* \*\*No direct-to-main changes\*\* from any agent (PR-only)

\* \*\*Least privilege identities\*\* per plane (separate service principals/managed identities)

\* \*\*Policy-as-code\*\* for what agents are allowed to do (e.g., allowed repos, allowed RGs)

\* \*\*Human approval gates\*\* for promotions to STG/PROD

\* \*\*Immutable evidence artifacts\*\* (retain, version, link to Work Item)



---



\## 5) A concrete “first implementation” (MVP) that proves feasibility



Don’t start with 20 agents. Start with 3 that demonstrate the whole model:



1\. \*\*GitHub Dev+Test agent\*\*



&nbsp;  \* Takes `AB#` work item

&nbsp;  \* Implements change + tests

&nbsp;  \* Opens PR



2\. \*\*GitHub Evidence Pack agent\*\*



&nbsp;  \* On PR: runs CI, collects logs/tests, builds `evidence-pack.zip`



3\. \*\*Azure Monitor/Triage agent\*\*



&nbsp;  \* After deploy: pulls App Insights/Logs + produces a short health report

&nbsp;  \* Posts result back to PR + creates/updates ADO work item if failed



That gives you: build → deploy → monitor → evidence → backlog integration.



---



\## 6) Your “agents to interact with users managing the app”



Those belong on the \*\*Azure plane\*\* (ops + admin workflows), but their \*outputs\* should go to \*\*ADO\*\* as tickets/work items and to GitHub as issues only if it’s code work.



Pattern:



\* User action → creates ticket (ADO)

\* Ops agent recommends steps / gathers telemetry

\* If code change is needed: create task that drives a PR



---



Below is a \*\*database-first data model\*\* that can represent your full \*\*ADO + GitHub + Azure + Agents\*\* operating model, and can be \*\*maintained in a UI\*\* (admin portal). It’s designed around your core need: \*\*traceability + control + evidence\*\* across planes.



Below is a \*\*database-first data model\*\* that can represent your full \*\*ADO + GitHub + Azure + Agents\*\* operating model, and can be \*\*maintained in a UI\*\* (admin portal). It’s designed around your core need: \*\*traceability + control + evidence\*\* across planes.



---

Below is a \*\*database-first data model\*\* that can represent your full \*\*ADO + GitHub + Azure + Agents\*\* operating model, and can be \*\*maintained in a UI\*\* (admin portal). It’s designed around your core need: \*\*traceability + control + evidence\*\* across planes.



---



\# 1) Core idea



Everything is an \*\*Automation System\*\* made of:



\* \*\*Planes\*\* (ADO / GitHub / Azure)

\* \*\*Agents\*\* (build, test, verify, deploy, monitor, scrum, user-support)

\* \*\*Triggers\*\* (PR opened, schedule, alert fired, manual run, webhook)

\* \*\*Runs\*\* (each execution instance)

\* \*\*Artifacts/Evidence\*\* (logs, test results, dashboards, reports)

\* \*\*Links\*\* (ADO work items, GitHub PRs, Azure deployments/alerts)

\* \*\*Policies\*\* (what the agent is allowed to do)

\* \*\*RBAC\*\* (who can configure/run/approve)



---



\# 2) Entity model (tables)



\## A) Catalog / Configuration



\### `plane`



\* `plane\_id` (PK)

\* `name` (ADO | GitHub | Azure)

\* `description`



\### `system\_connection`



Represents the configured integration endpoints (per environment/tenant).



\* `connection\_id` (PK)

\* `plane\_id` (FK → plane)

\* `name` (e.g., “IITB-ADO”, “IITB-GHE”, “ESDC-Azure-Sandbox”)

\* `connection\_type` (ado | github | azure)

\* `tenant\_scope` (text)

\* `auth\_mode` (oidc | pat | app | managed\_identity)

\* `status` (active/disabled)

\* `metadata\_json`



\### `environment`



\* `env\_id` (PK)

\* `name` (DEV | STG | PROD | SANDBOX)

\* `classification` (Unclassified | PB)

\* `azure\_subscription\_id` (nullable)

\* `resource\_group` (nullable)

\* `is\_production` (bool)



\### `app`



Represents EVA solution(s) you’re managing.



\* `app\_id` (PK)

\* `name` (e.g., “EVA DA Rebuild”)

\* `description`

\* `owner\_team\_id` (FK)

\* `default\_repo\_id` (FK)

\* `status` (active/retired)



\### `repo`



\* `repo\_id` (PK)

\* `connection\_id` (FK → system\_connection)  \*(GitHub connection)\*

\* `org`

\* `name`

\* `url`

\* `default\_branch`



\### `service`



Azure-deployed component(s) of the app.



\* `service\_id` (PK)

\* `app\_id` (FK)

\* `env\_id` (FK)

\* `service\_type` (app\_service | function | container\_app | apim | storage | search | cosmos)

\* `resource\_id` / `resource\_name`

\* `tags\_json`



---



\## B) Agents + Skills



\### `agent`



\* `agent\_id` (PK)

\* `name` (e.g., “eva-dev-agent”, “eva-monitor-agent”)

\* `plane\_id` (FK) \*(where it lives/executes)\*

\* `agent\_type` (build | test | verify | deploy | ops | scrum | user\_support)

\* `runtime` (github\_actions | azure\_functions | container\_apps\_job | ado\_pipeline | foundry)

\* `status` (active/disabled)

\* `description`



\### `skill`



A reusable capability an agent can perform.



\* `skill\_id` (PK)

\* `name` (e.g., “generate-tests”, “deploy-bicep”, “query-appinsights”, “create-ado-workitem”)

\* `category` (code | qa | security | deployment | telemetry | process)

\* `schema\_json` \*(input/output contract for the skill)\*



\### `agent\_skill`



\* `agent\_id` (FK)

\* `skill\_id` (FK)

\* `is\_enabled` (bool)

\* `params\_json` \*(defaults, constraints)\*



---



\## C) Triggers + Workflows (Automation Definitions)



\### `workflow`



A named automation flow (what the UI edits).



\* `workflow\_id` (PK)

\* `app\_id` (FK)

\* `name` (e.g., “PR → Build/Test → Evidence Pack”)

\* `goal` (text)

\* `owner\_team\_id` (FK)

\* `status` (draft/active/paused)

\* `version` (int)



\### `trigger`



Defines when a workflow starts.



\* `trigger\_id` (PK)

\* `workflow\_id` (FK)

\* `plane\_id` (FK)

\* `trigger\_type` (pr\_opened | pr\_labeled | schedule | webhook | alert | manual)

\* `filter\_json` \*(repo, branch, labels, paths, env, severity, etc.)\*

\* `is\_enabled` (bool)



\### `workflow\_step`



Defines the ordered steps within a workflow.



\* `step\_id` (PK)

\* `workflow\_id` (FK)

\* `step\_order` (int)

\* `agent\_id` (FK)

\* `skill\_id` (FK)

\* `input\_mapping\_json`

\* `output\_mapping\_json`

\* `retry\_policy\_json`

\* `approval\_gate\_id` (nullable FK)



\### `approval\_gate`



Human checkpoint (esp. STG/PROD deploy).



\* `approval\_gate\_id` (PK)

\* `name`

\* `gate\_type` (manual\_approval | change\_window | security\_review)

\* `approver\_role\_id` (FK)

\* `rules\_json`



---



\## D) Evidence + Traceability (Runs)



\### `work\_item\_link`



Cross-links ADO work items, GitHub PRs/issues, etc.



\* `link\_id` (PK)

\* `app\_id` (FK)

\* `plane\_id` (FK)

\* `external\_type` (ado\_work\_item | github\_pr | github\_issue | ado\_pipeline\_run)

\* `external\_id` (string)

\* `external\_url` (string)

\* `title` (string)

\* `state` (string)

\* `metadata\_json`



\### `run`



One execution of a workflow (the “proof” record).



\* `run\_id` (PK)

\* `workflow\_id` (FK)

\* `trigger\_id` (FK)

\* `started\_at`, `ended\_at`

\* `status` (queued/running/succeeded/failed/cancelled)

\* `evidence\_id` (unique string; your correlation key)

\* `env\_id` (nullable FK)

\* `initiator\_type` (user/agent/system)

\* `initiator\_id` (nullable)

\* `context\_json` \*(PR number, AB#, branch, commit SHA, alert id, etc.)\*



\### `step\_run`



\* `step\_run\_id` (PK)

\* `run\_id` (FK)

\* `step\_id` (FK)

\* `status`

\* `started\_at`, `ended\_at`

\* `logs\_url` (nullable)

\* `output\_json` \*(structured outputs)\*



\### `artifact`



Anything produced by a run (evidence pack, test results, SBOM, etc.)



\* `artifact\_id` (PK)

\* `run\_id` (FK)

\* `step\_run\_id` (nullable FK)

\* `artifact\_type` (evidence\_pack | test\_report | deploy\_log | telemetry\_snapshot | sbom | sast\_report)

\* `storage\_uri`

\* `hash` (integrity)

\* `retention\_policy\_id` (FK)



\### `telemetry\_reference`



Pointers to Azure monitoring objects.



\* `telemetry\_id` (PK)

\* `run\_id` (FK)

\* `source` (appinsights | loganalytics | azuremonitor | defender)

\* `query\_or\_rule\_id`

\* `result\_uri` (nullable)

\* `summary\_json`



---



\## E) Policy + RBAC + Governance



\### `team`



\* `team\_id` (PK)

\* `name`

\* `branch` (e.g., IITB/AICOE/CyberEO/Cloud)

\* `owner\_user\_id` (FK)



\### `user`



\* `user\_id` (PK)

\* `upn`

\* `display\_name`



\### `role`



\* `role\_id` (PK)

\* `name` (admin | maintainer | approver | viewer)



\### `permission`



\* `permission\_id` (PK)

\* `name` (manage\_workflows | run\_workflows | approve\_gates | manage\_connections | view\_evidence)



\### `role\_permission`



\* `role\_id` (FK)

\* `permission\_id` (FK)



\### `user\_role\_assignment`



\* `user\_id` (FK)

\* `role\_id` (FK)

\* `scope\_type` (global | app | env | workflow)

\* `scope\_id` (nullable)



\### `policy`



Hard constraints for agents and workflows (safety).



\* `policy\_id` (PK)

\* `name`

\* `policy\_type` (data\_boundary | allowed\_actions | env\_restriction | logging\_requirement)

\* `rules\_json`

\* `status`



\### `workflow\_policy`



\* `workflow\_id` (FK)

\* `policy\_id` (FK)



---



\# 3) What the UI maintains



In your admin UI (“EVA Control Plane”), you’d have 6 screens:



1\. \*\*Connections\*\* (ADO/GitHub/Azure) + status checks

2\. \*\*Apps \& Environments\*\* (DEV/STG/PROD, subscriptions/RGs, classification)

3\. \*\*Agents \& Skills Catalog\*\* (enable/disable, parameters, allowed scopes)

4\. \*\*Workflows\*\* (visual step editor: trigger → steps → approval gates → policies)

5\. \*\*Runs \& Evidence\*\* (search by AB#, PR, env, date; download evidence pack)

6\. \*\*RBAC \& Policies\*\* (who can run/configure/approve; what agents are allowed to do)



---

---



\## 1) JSON data model (single document)



```json

{

&nbsp; "version": "1.0",

&nbsp; "tenant": {

&nbsp;   "name": "IITB / ESDC (Prototype)",

&nbsp;   "notes": "GitHub as source of truth for code + cloud agents; ADO for product/project; Azure for services + triggers + monitoring."

&nbsp; },



&nbsp; "planes": \[

&nbsp;   { "id": "ado", "name": "Azure DevOps", "purpose": "Product \& project management" },

&nbsp;   { "id": "github", "name": "GitHub", "purpose": "Source of truth for code + PR workflows + build agents" },

&nbsp;   { "id": "azure", "name": "Azure", "purpose": "Runtime, orchestration, monitoring, and secure execution" }

&nbsp; ],



&nbsp; "connections": \[

&nbsp;   {

&nbsp;     "id": "conn-ado-personal",

&nbsp;     "planeId": "ado",

&nbsp;     "name": "Personal ADO (Prototype)",

&nbsp;     "authMode": "pat",

&nbsp;     "status": "active",

&nbsp;     "metadata": { "org": "", "project": "" }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "conn-gh-personal",

&nbsp;     "planeId": "github",

&nbsp;     "name": "Personal GitHub + Copilot (Prototype)",

&nbsp;     "authMode": "app\_or\_pat",

&nbsp;     "status": "active",

&nbsp;     "metadata": { "org": "", "repos": \[] }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "conn-azure-esdc-sandbox",

&nbsp;     "planeId": "azure",

&nbsp;     "name": "ESDC Azure Dev Sandbox",

&nbsp;     "authMode": "entra\_id\_or\_oidc",

&nbsp;     "status": "active",

&nbsp;     "metadata": { "subscriptionId": "", "resourceGroups": \[] }

&nbsp;   }

&nbsp; ],



&nbsp; "environments": \[

&nbsp;   {

&nbsp;     "id": "env-sandbox",

&nbsp;     "name": "SANDBOX",

&nbsp;     "classification": "Unclassified",

&nbsp;     "azure": { "connectionId": "conn-azure-esdc-sandbox", "subscriptionId": "", "resourceGroup": "" },

&nbsp;     "isProduction": false

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "env-dev",

&nbsp;     "name": "DEV",

&nbsp;     "classification": "Unclassified",

&nbsp;     "azure": { "connectionId": "conn-azure-esdc-sandbox", "subscriptionId": "", "resourceGroup": "" },

&nbsp;     "isProduction": false

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "env-stg",

&nbsp;     "name": "STG",

&nbsp;     "classification": "Unclassified",

&nbsp;     "azure": { "connectionId": "conn-azure-esdc-sandbox", "subscriptionId": "", "resourceGroup": "" },

&nbsp;     "isProduction": false

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "env-prod",

&nbsp;     "name": "PROD",

&nbsp;     "classification": "ProtectedB",

&nbsp;     "azure": { "connectionId": "conn-azure-esdc-sandbox", "subscriptionId": "", "resourceGroup": "" },

&nbsp;     "isProduction": true

&nbsp;   }

&nbsp; ],



&nbsp; "apps": \[

&nbsp;   {

&nbsp;     "id": "app-eva-da-rebuild",

&nbsp;     "name": "EVA Domain Assistant (Greenfield Rebuild)",

&nbsp;     "description": "Greenfield rebuild (no code reuse) driven by ideas and target architecture.",

&nbsp;     "owners": \[{ "teamId": "team-aicoe", "role": "governance" }],

&nbsp;     "repos": \[{ "repoId": "repo-eva-da", "role": "source\_of\_truth" }],

&nbsp;     "services": \[

&nbsp;       {

&nbsp;         "id": "svc-eva-da-frontend",

&nbsp;         "envId": "env-dev",

&nbsp;         "type": "static\_web\_app",

&nbsp;         "azureResourceId": "",

&nbsp;         "tags": { "app": "eva-da", "env": "dev" }

&nbsp;       },

&nbsp;       {

&nbsp;         "id": "svc-eva-da-backend",

&nbsp;         "envId": "env-dev",

&nbsp;         "type": "app\_service",

&nbsp;         "azureResourceId": "",

&nbsp;         "tags": { "app": "eva-da", "env": "dev" }

&nbsp;       }

&nbsp;     ]

&nbsp;   }

&nbsp; ],



&nbsp; "repos": \[

&nbsp;   {

&nbsp;     "id": "repo-eva-da",

&nbsp;     "connectionId": "conn-gh-personal",

&nbsp;     "org": "",

&nbsp;     "name": "eva-da-rebuild",

&nbsp;     "defaultBranch": "main",

&nbsp;     "branchPolicy": {

&nbsp;       "requirePR": true,

&nbsp;       "requireReviews": 1,

&nbsp;       "requireStatusChecks": \["ci-build", "unit-tests", "evidence-pack"],

&nbsp;       "disallowDirectPushToMain": true

&nbsp;     }

&nbsp;   }

&nbsp; ],



&nbsp; "skills": \[

&nbsp;   {

&nbsp;     "id": "skill-design-adr",

&nbsp;     "name": "Create ADR / Design Note",

&nbsp;     "category": "code",

&nbsp;     "ioSchema": {

&nbsp;       "input": { "workItemId": "string", "scope": "string" },

&nbsp;       "output": { "adrPath": "string" }

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "skill-implement-change",

&nbsp;     "name": "Implement Change and Open PR",

&nbsp;     "category": "code",

&nbsp;     "ioSchema": {

&nbsp;       "input": { "workItemId": "string", "repo": "string", "constraints": "object" },

&nbsp;       "output": { "prUrl": "string", "commitSha": "string" }

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "skill-run-tests",

&nbsp;     "name": "Run Unit/Integration Tests",

&nbsp;     "category": "qa",

&nbsp;     "ioSchema": {

&nbsp;       "input": { "repo": "string", "commitSha": "string" },

&nbsp;       "output": { "testReportUri": "string", "summary": "object" }

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "skill-build-evidence-pack",

&nbsp;     "name": "Build Evidence Pack",

&nbsp;     "category": "qa",

&nbsp;     "ioSchema": {

&nbsp;       "input": { "evidenceId": "string", "runContext": "object" },

&nbsp;       "output": { "artifactUri": "string", "hash": "string" }

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "skill-deploy-azure",

&nbsp;     "name": "Deploy to Azure Environment",

&nbsp;     "category": "deployment",

&nbsp;     "ioSchema": {

&nbsp;       "input": { "envId": "string", "artifact": "string" },

&nbsp;       "output": { "deploymentId": "string", "deployLogUri": "string" }

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "skill-query-telemetry",

&nbsp;     "name": "Query Azure Telemetry",

&nbsp;     "category": "telemetry",

&nbsp;     "ioSchema": {

&nbsp;       "input": { "envId": "string", "evidenceId": "string" },

&nbsp;       "output": { "telemetrySnapshotUri": "string", "summary": "object" }

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "skill-scrum-draft",

&nbsp;     "name": "Draft Sprint Plan / Status Summary",

&nbsp;     "category": "process",

&nbsp;     "ioSchema": {

&nbsp;       "input": { "iterationPath": "string", "areaPath": "string" },

&nbsp;       "output": { "summaryMarkdown": "string" }

&nbsp;     }

&nbsp;   }

&nbsp; ],



&nbsp; "agents": \[

&nbsp;   {

&nbsp;     "id": "agent-gh-dev",

&nbsp;     "name": "GitHub Dev Agent",

&nbsp;     "planeId": "github",

&nbsp;     "runtime": "github\_actions",

&nbsp;     "agentType": "build",

&nbsp;     "enabled": true,

&nbsp;     "skills": \["skill-design-adr", "skill-implement-change"]

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "agent-gh-ci",

&nbsp;     "name": "GitHub CI/Test Agent",

&nbsp;     "planeId": "github",

&nbsp;     "runtime": "github\_actions",

&nbsp;     "agentType": "test",

&nbsp;     "enabled": true,

&nbsp;     "skills": \["skill-run-tests", "skill-build-evidence-pack"]

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "agent-azure-deploy",

&nbsp;     "name": "Azure Deploy Agent",

&nbsp;     "planeId": "azure",

&nbsp;     "runtime": "container\_apps\_job",

&nbsp;     "agentType": "deploy",

&nbsp;     "enabled": true,

&nbsp;     "skills": \["skill-deploy-azure", "skill-query-telemetry"]

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "agent-ado-scrum",

&nbsp;     "name": "ADO Scrum Agent",

&nbsp;     "planeId": "ado",

&nbsp;     "runtime": "ado\_pipeline\_or\_service",

&nbsp;     "agentType": "scrum",

&nbsp;     "enabled": true,

&nbsp;     "skills": \["skill-scrum-draft"]

&nbsp;   }

&nbsp; ],



&nbsp; "policies": \[

&nbsp;   {

&nbsp;     "id": "pol-pr-only",

&nbsp;     "name": "PR-only Changes",

&nbsp;     "type": "allowed\_actions",

&nbsp;     "rules": { "noDirectPushToMain": true, "agentsOpenPRsOnly": true }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "pol-evidence-required",

&nbsp;     "name": "Evidence Required for Merge",

&nbsp;     "type": "logging\_requirement",

&nbsp;     "rules": { "requiredArtifacts": \["evidence\_pack"], "requiredChecks": \["evidence-pack"] }

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "pol-env-approvals",

&nbsp;     "name": "STG/PROD Approval Gates",

&nbsp;     "type": "env\_restriction",

&nbsp;     "rules": { "stgRequiresApproval": true, "prodRequiresApproval": true }

&nbsp;   }

&nbsp; ],



&nbsp; "workflows": \[

&nbsp;   {

&nbsp;     "id": "wf-pr-ci-evidence",

&nbsp;     "appId": "app-eva-da-rebuild",

&nbsp;     "name": "PR → Build/Test → Evidence Pack",

&nbsp;     "status": "active",

&nbsp;     "trigger": {

&nbsp;       "planeId": "github",

&nbsp;       "type": "pull\_request",

&nbsp;       "filters": { "repoId": "repo-eva-da", "branches": \["main"] }

&nbsp;     },

&nbsp;     "steps": \[

&nbsp;       { "order": 10, "agentId": "agent-gh-ci", "skillId": "skill-run-tests" },

&nbsp;       { "order": 20, "agentId": "agent-gh-ci", "skillId": "skill-build-evidence-pack" }

&nbsp;     ],

&nbsp;     "policies": \["pol-pr-only", "pol-evidence-required"]

&nbsp;   },

&nbsp;   {

&nbsp;     "id": "wf-promote-dev",

&nbsp;     "appId": "app-eva-da-rebuild",

&nbsp;     "name": "Promote to DEV (Azure Deploy + Telemetry Snapshot)",

&nbsp;     "status": "active",

&nbsp;     "trigger": {

&nbsp;       "planeId": "github",

&nbsp;       "type": "manual",

&nbsp;       "filters": { "repoId": "repo-eva-da" }

&nbsp;     },

&nbsp;     "steps": \[

&nbsp;       { "order": 10, "agentId": "agent-azure-deploy", "skillId": "skill-deploy-azure", "params": { "envId": "env-dev" } },

&nbsp;       { "order": 20, "agentId": "agent-azure-deploy", "skillId": "skill-query-telemetry", "params": { "envId": "env-dev" } }

&nbsp;     ],

&nbsp;     "policies": \["pol-pr-only"]

&nbsp;   }

&nbsp; ],



&nbsp; "runLedger": {

&nbsp;   "runs": \[

&nbsp;     {

&nbsp;       "runId": "run-0001",

&nbsp;       "workflowId": "wf-pr-ci-evidence",

&nbsp;       "status": "succeeded",

&nbsp;       "evidenceId": "AB1234-PR56-20260221T073000-0500",

&nbsp;       "startedAt": "2026-02-21T07:30:00-05:00",

&nbsp;       "endedAt": "2026-02-21T07:36:12-05:00",

&nbsp;       "context": { "adoWorkItem": "AB#1234", "prUrl": "", "commitSha": "" },

&nbsp;       "artifacts": \[

&nbsp;         { "type": "evidence\_pack", "uri": "", "hash": "" },

&nbsp;         { "type": "test\_report", "uri": "" }

&nbsp;       ]

&nbsp;     }

&nbsp;   ]

&nbsp; },



&nbsp; "ui": {

&nbsp;   "adminScreens": \[

&nbsp;     "Connections",

&nbsp;     "Apps \& Environments",

&nbsp;     "Agents \& Skills",

&nbsp;     "Workflows (Trigger + Steps + Gates)",

&nbsp;     "Runs \& Evidence",

&nbsp;     "Policies \& RBAC"

&nbsp;   ]

&nbsp; }

}

```



---



\## 2) ADO import: Epics / Features / User Stories (CSV)



\*\*Important reality about hierarchy:\*\* ADO CSV import is easiest if you import in \*\*waves\*\*:



1\. Import \*\*Epics\*\* → ADO assigns IDs

2\. Import \*\*Features\*\* with `Parent` = Epic IDs

3\. Import \*\*User Stories\*\* with `Parent` = Feature IDs

&nbsp;  (Optional) 4) Import \*\*Tasks\*\* with `Parent` = User Story IDs



Below are \*\*templates + a starter backlog\*\* aligned to what you described (ADO + GitHub + Azure + cloud agents + monitoring + evidence packs + EVA DA rebuild).



\### 2.1 Epics CSV (import first)



```csv

Work Item Type,Title,Description,Tags,Area Path,Iteration Path

Epic,EVA Dev Platform: ADO + GitHub + Azure Operating Model,"Define and implement the integrated operating model: ADO for product/project, GitHub for code/agents, Azure for deployment/orchestration/monitoring.",eva;platform;ado;github;azure,IITB\\EVA,IITB\\EVA\\P0

Epic,EVA DA Greenfield Rebuild (Fluent UI + GC Design System),"Deliver the greenfield rebuild of EVA Domain Assistant UI and backend with enterprise-grade CI/CD, telemetry, and evidence.",eva;da;greenfield;fluentui;a11y;i18n,IITB\\EVA,IITB\\EVA\\P0

Epic,Evidence-First Automation (Pipelines + Evidence Packs),"Standardize evidence packs, verification gates, and traceability across all workflows and agent runs.",evidence;verification;governance;itil;devsecops,IITB\\EVA,IITB\\EVA\\P0

Epic,Operations \& Monitoring Agents (Azure Plane),"Implement Azure-side automation for deployment, monitoring, incident triage, and reporting tied to evidence IDs.",ops;monitoring;azure;telemetry;incident,IITB\\EVA,IITB\\EVA\\P0

Epic,Product Delivery Agents (ADO Plane),"Implement ADO-side agents for Scrum support (planning drafts, status, RAID) and linkage to GitHub/Azure evidence.",ado;scrum;reporting;status,IITB\\EVA,IITB\\EVA\\P0

```



\### 2.2 Features CSV (import second, after you fill Parent with Epic IDs)



Replace `Parent` values with the \*\*actual Epic IDs\*\* assigned after import.



```csv

Work Item Type,Title,Description,Tags,Parent,Area Path,Iteration Path

Feature,ADO↔GitHub Traceability (Work Item ↔ PR/Commit),"Enforce AB# linking, PR templates, and visibility from ADO work items to GitHub activity.",traceability;ado;github,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Feature,GitHub as Source of Truth (Branch Protection + Checks),"Configure branch policies, required checks, CODEOWNERS, and PR gates for EVA repos.",github;policies;pr,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Feature,Azure Deploy Orchestration (DEV/STG/PROD Promotion),"Implement controlled promotion flow and environment-based approvals for deployments.",azure;deploy;promotion,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Feature,Evidence Pack Standard (Artifacts + Metadata + Hash),"Define and generate evidence-pack.zip for every PR and deployment run.",evidence;artifacts;hash,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Feature,EVA DA Chat Page MVP (Fluent UI + GC Design),"Build the new chat page UI using Fluent UI + GC design library conventions.",eva-da;ui;fluentui,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Feature,EVA DA Backend MVP (API-first BFF + RAG Stub),"Build backend endpoints and a stubbed RAG integration to support UI flows.",eva-da;backend;api,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Feature,Azure Telemetry Baseline (AppInsights + Logs + Correlation),"Standardize correlation IDs and queries; produce run health summaries tied to evidence ID.",telemetry;appinsights;logs,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Feature,ADO Scrum Agent MVP (Sprint Draft + Weekly Status),"Generate sprint planning drafts and weekly status summaries from ADO data.",ado;scrum;status,EPIC\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

```



\### 2.3 User Stories CSV (import third, after you fill Parent with Feature IDs)



Replace `Parent` with the \*\*Feature IDs\*\* assigned after Features import.



```csv

Work Item Type,Title,Description,Tags,Parent,Area Path,Iteration Path

User Story,Add PR template requiring AB# work item link,"PR template includes AB# link, testing notes, evidence section, and rollout notes.",github;traceability,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Enforce branch protection + required checks on main,"Disallow direct pushes; require review(s) and CI checks including evidence-pack.",github;policy,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Create GitHub workflow: CI build + unit tests,"On PR, run build and unit tests; publish test report artifacts.",ci;tests,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Create GitHub workflow: evidence-pack.zip generation,"Bundle logs, test results, metadata.json, and hash into evidence-pack.zip artifact.",evidence;ci,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Implement Azure deploy job for DEV environment,"Deploy to DEV using controlled identity; emit deployment logs and tag evidenceId.",azure;deploy,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Implement telemetry snapshot step post-deploy,"Query App Insights/Logs with evidenceId; store snapshot artifact and summary.",azure;telemetry,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Build EVA DA chat page shell (layout + components),"Create chat page layout, message list, composer, and headers per design system.",eva-da;ui,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Add i18n + accessibility baseline to chat page,"Ensure bilingual scaffolding and WCAG-friendly patterns (keyboard, ARIA, focus).",a11y;i18n,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Create backend endpoint: chat request/response contract,"Define API contract and stub backend handling for chat interactions.",api;backend,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Implement ADO Scrum agent: sprint draft output,"Generate sprint plan draft from backlog; store markdown summary as artifact.",ado;scrum,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

User Story,Implement weekly status summary across ADO+GitHub+Azure,"Produce weekly summary referencing work items, PRs, deployments, and evidence IDs.",status;reporting,FEATURE\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

```



\### Optional: Tasks CSV (import last)



```csv

Work Item Type,Title,Description,Tags,Parent,Area Path,Iteration Path

Task,Define evidence-pack.json schema,"Define required fields: evidenceId, AB#, PR, commit, environment, timestamps, artifact links.",evidence;schema,USER\_STORY\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Task,Add evidenceId propagation into backend logs,"Ensure evidenceId appears in structured logs and trace context.",telemetry;correlation,USER\_STORY\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

Task,Add smoke test step to deploy workflow,"Hit health endpoints and assert success; store results in evidence pack.",deploy;smoke-test,USER\_STORY\_ID\_HERE,IITB\\EVA,IITB\\EVA\\P0

```



---



Runbooks are exactly the right “bridge artifact” between \*\*user stories\*\* and eventual \*\*agent-executed workflows\*\*.



Below is a \*\*runbook data model (JSON)\*\* plus a \*\*starter set of EVA runbooks\*\* aligned to your operating model:



\* \*\*GitHub plane\*\* (design/dev/test/verify/evidence)

\* \*\*Azure plane\*\* (deploy/promote/monitor/triage)

\* \*\*ADO plane\*\* (scrum/status/user intake)



Each runbook is written so it can be maintained in a UI today, and later compiled into an executable workflow (GitHub Actions / Azure Functions / Container Apps Jobs / ADO Pipelines).



---



\## 1) Runbook JSON schema (store in DB + edit in UI)



```json

{

&nbsp; "runbookId": "rb-000",

&nbsp; "name": "Runbook Name",

&nbsp; "status": "draft",

&nbsp; "plane": "github",

&nbsp; "category": "build",

&nbsp; "appId": "app-eva-da-rebuild",

&nbsp; "environments": \["env-dev"],

&nbsp; "triggers": \[

&nbsp;   {

&nbsp;     "type": "manual",

&nbsp;     "source": "ui",

&nbsp;     "filters": {}

&nbsp;   }

&nbsp; ],

&nbsp; "inputs": \[

&nbsp;   { "name": "workItemId", "type": "string", "required": true },

&nbsp;   { "name": "repo", "type": "string", "required": true }

&nbsp; ],

&nbsp; "preconditions": \[

&nbsp;   { "id": "pc-1", "text": "Repo branch protection enabled; PR required." }

&nbsp; ],

&nbsp; "steps": \[

&nbsp;   {

&nbsp;     "stepId": "s-10",

&nbsp;     "title": "Do something",

&nbsp;     "kind": "action",

&nbsp;     "executor": {

&nbsp;       "type": "agent",

&nbsp;       "agentId": "agent-gh-ci",

&nbsp;       "skillId": "skill-run-tests"

&nbsp;     },

&nbsp;     "params": {},

&nbsp;     "evidence": \[

&nbsp;       { "type": "log", "required": true, "name": "step-log" },

&nbsp;       { "type": "artifact", "required": true, "name": "test-report" }

&nbsp;     ],

&nbsp;     "onFailure": {

&nbsp;       "strategy": "stop",

&nbsp;       "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Bug" }

&nbsp;     }

&nbsp;   }

&nbsp; ],

&nbsp; "approvalGates": \[

&nbsp;   {

&nbsp;     "gateId": "g-1",

&nbsp;     "type": "manual",

&nbsp;     "requiredFor": \["env-stg", "env-prod"],

&nbsp;     "approverRole": "approver"

&nbsp;   }

&nbsp; ],

&nbsp; "outputs": \[

&nbsp;   { "name": "evidencePackUri", "type": "string" }

&nbsp; ],

&nbsp; "evidencePack": {

&nbsp;   "required": true,

&nbsp;   "schemaVersion": "1.0",

&nbsp;   "requiredArtifacts": \["evidence\_pack", "deploy\_log"],

&nbsp;   "retentionDays": 90

&nbsp; },

&nbsp; "rbac": {

&nbsp;   "canRunRoles": \["admin", "maintainer"],

&nbsp;   "canEditRoles": \["admin"],

&nbsp;   "canApproveRoles": \["approver"]

&nbsp; },

&nbsp; "links": {

&nbsp;   "adoWorkItem": "",

&nbsp;   "githubPr": "",

&nbsp;   "azureDeployment": ""

&nbsp; },

&nbsp; "notes": "Human-readable intent + future workflow mapping notes."

}

```



---



\## 2) Starter runbooks (ready to paste into your DB)



\### RB-001 — PR CI + Evidence Pack (GitHub plane)



```json

{

&nbsp; "runbookId": "rb-001",

&nbsp; "name": "PR → Build/Test → Evidence Pack",

&nbsp; "status": "active",

&nbsp; "plane": "github",

&nbsp; "category": "verify",

&nbsp; "appId": "app-eva-da-rebuild",

&nbsp; "environments": \["env-dev"],

&nbsp; "triggers": \[

&nbsp;   {

&nbsp;     "type": "event",

&nbsp;     "source": "github",

&nbsp;     "filters": { "event": "pull\_request", "action": \["opened", "synchronize", "reopened"] }

&nbsp;   }

&nbsp; ],

&nbsp; "inputs": \[

&nbsp;   { "name": "repoId", "type": "string", "required": true },

&nbsp;   { "name": "prNumber", "type": "number", "required": true },

&nbsp;   { "name": "commitSha", "type": "string", "required": true },

&nbsp;   { "name": "workItemId", "type": "string", "required": false }

&nbsp; ],

&nbsp; "preconditions": \[

&nbsp;   { "id": "pc-1", "text": "Branch protection enabled; status checks required for merge." }

&nbsp; ],

&nbsp; "steps": \[

&nbsp;   {

&nbsp;     "stepId": "s-10",

&nbsp;     "title": "Build",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "agent", "agentId": "agent-gh-ci", "skillId": "skill-run-tests" },

&nbsp;     "params": { "mode": "build\_only" },

&nbsp;     "evidence": \[{ "type": "log", "required": true, "name": "build-log" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Bug" } }

&nbsp;   },

&nbsp;   {

&nbsp;     "stepId": "s-20",

&nbsp;     "title": "Run unit tests",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "agent", "agentId": "agent-gh-ci", "skillId": "skill-run-tests" },

&nbsp;     "params": { "mode": "unit" },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "unit-test-report" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Bug" } }

&nbsp;   },

&nbsp;   {

&nbsp;     "stepId": "s-30",

&nbsp;     "title": "Generate evidence-pack.zip",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "agent", "agentId": "agent-gh-ci", "skillId": "skill-build-evidence-pack" },

&nbsp;     "params": { "include": \["build-log", "unit-test-report", "metadata"] },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "evidence-pack.zip" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Bug" } }

&nbsp;   }

&nbsp; ],

&nbsp; "approvalGates": \[],

&nbsp; "outputs": \[{ "name": "evidencePackUri", "type": "string" }],

&nbsp; "evidencePack": { "required": true, "schemaVersion": "1.0", "requiredArtifacts": \["evidence\_pack"], "retentionDays": 90 },

&nbsp; "rbac": { "canRunRoles": \["admin", "maintainer"], "canEditRoles": \["admin"], "canApproveRoles": \["approver"] },

&nbsp; "notes": "Maps directly to a GitHub Actions workflow with required checks."

}

```



---



\### RB-002 — Promote DEV (Azure deploy + telemetry snapshot)



```json

{

&nbsp; "runbookId": "rb-002",

&nbsp; "name": "Promote to DEV → Deploy → Smoke Test → Telemetry Snapshot",

&nbsp; "status": "active",

&nbsp; "plane": "azure",

&nbsp; "category": "deploy",

&nbsp; "appId": "app-eva-da-rebuild",

&nbsp; "environments": \["env-dev"],

&nbsp; "triggers": \[

&nbsp;   {

&nbsp;     "type": "manual",

&nbsp;     "source": "ui",

&nbsp;     "filters": { "requires": \["evidencePackUri", "commitSha"] }

&nbsp;   }

&nbsp; ],

&nbsp; "inputs": \[

&nbsp;   { "name": "commitSha", "type": "string", "required": true },

&nbsp;   { "name": "artifactUri", "type": "string", "required": false },

&nbsp;   { "name": "evidenceId", "type": "string", "required": true }

&nbsp; ],

&nbsp; "preconditions": \[

&nbsp;   { "id": "pc-1", "text": "Caller has RBAC to deploy into DEV resource group." },

&nbsp;   { "id": "pc-2", "text": "Evidence pack exists for commitSha and is linked to PR." }

&nbsp; ],

&nbsp; "steps": \[

&nbsp;   {

&nbsp;     "stepId": "s-10",

&nbsp;     "title": "Deploy to DEV",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "agent", "agentId": "agent-azure-deploy", "skillId": "skill-deploy-azure" },

&nbsp;     "params": { "envId": "env-dev" },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "deploy-log" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Bug" } }

&nbsp;   },

&nbsp;   {

&nbsp;     "stepId": "s-20",

&nbsp;     "title": "Smoke test",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "script", "name": "smoke-test", "location": "azure" },

&nbsp;     "params": { "endpoints": \["/health", "/version"] },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "smoke-test.json" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Bug" } }

&nbsp;   },

&nbsp;   {

&nbsp;     "stepId": "s-30",

&nbsp;     "title": "Telemetry snapshot (evidenceId correlated)",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "agent", "agentId": "agent-azure-deploy", "skillId": "skill-query-telemetry" },

&nbsp;     "params": { "envId": "env-dev" },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "telemetry-snapshot.json" }],

&nbsp;     "onFailure": { "strategy": "continue", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Task" } }

&nbsp;   },

&nbsp;   {

&nbsp;     "stepId": "s-40",

&nbsp;     "title": "Append to evidence pack",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "script", "name": "append-evidence", "location": "azure" },

&nbsp;     "params": { "append": \["deploy-log", "smoke-test.json", "telemetry-snapshot.json"] },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "evidence-pack.zip" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Bug" } }

&nbsp;   }

&nbsp; ],

&nbsp; "approvalGates": \[],

&nbsp; "outputs": \[

&nbsp;   { "name": "deploymentId", "type": "string" },

&nbsp;   { "name": "evidencePackUri", "type": "string" }

&nbsp; ],

&nbsp; "evidencePack": { "required": true, "schemaVersion": "1.0", "requiredArtifacts": \["deploy\_log", "smoke\_test", "telemetry\_snapshot"], "retentionDays": 90 },

&nbsp; "rbac": { "canRunRoles": \["admin", "maintainer"], "canEditRoles": \["admin"], "canApproveRoles": \["approver"] },

&nbsp; "notes": "Maps to Azure Container Apps Job or Function + GitHub status update."

}

```



---



\### RB-003 — Incident triage from Azure alert → ADO bug + PR link



```json

{

&nbsp; "runbookId": "rb-003",

&nbsp; "name": "Azure Alert → Triage → Create/Update ADO Bug → Attach Telemetry Evidence",

&nbsp; "status": "active",

&nbsp; "plane": "azure",

&nbsp; "category": "ops",

&nbsp; "appId": "app-eva-da-rebuild",

&nbsp; "environments": \["env-dev", "env-stg", "env-prod"],

&nbsp; "triggers": \[

&nbsp;   {

&nbsp;     "type": "event",

&nbsp;     "source": "azure\_monitor",

&nbsp;     "filters": { "severity": \["Sev0", "Sev1", "Sev2"] }

&nbsp;   }

&nbsp; ],

&nbsp; "inputs": \[

&nbsp;   { "name": "alertId", "type": "string", "required": true },

&nbsp;   { "name": "envId", "type": "string", "required": true }

&nbsp; ],

&nbsp; "preconditions": \[

&nbsp;   { "id": "pc-1", "text": "Alert contains correlation dimensions (evidenceId or deploymentId when possible)." }

&nbsp; ],

&nbsp; "steps": \[

&nbsp;   {

&nbsp;     "stepId": "s-10",

&nbsp;     "title": "Collect telemetry window (last 30 min)",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "agent", "agentId": "agent-azure-deploy", "skillId": "skill-query-telemetry" },

&nbsp;     "params": { "envIdFromInput": true, "timeWindowMinutes": 30 },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "triage-telemetry.json" }],

&nbsp;     "onFailure": { "strategy": "continue", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Task" } }

&nbsp;   },

&nbsp;   {

&nbsp;     "stepId": "s-20",

&nbsp;     "title": "Create/update ADO Bug with telemetry link",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "connector", "name": "ado", "operation": "upsert\_bug" },

&nbsp;     "params": { "titleFromAlert": true, "attachArtifacts": \["triage-telemetry.json"] },

&nbsp;     "evidence": \[{ "type": "log", "required": true, "name": "ado-upsert-log" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": false } }

&nbsp;   }

&nbsp; ],

&nbsp; "approvalGates": \[],

&nbsp; "outputs": \[{ "name": "adoBugId", "type": "string" }],

&nbsp; "evidencePack": { "required": false, "schemaVersion": "1.0", "requiredArtifacts": \[], "retentionDays": 90 },

&nbsp; "rbac": { "canRunRoles": \["admin", "maintainer"], "canEditRoles": \["admin"], "canApproveRoles": \["approver"] },

&nbsp; "notes": "Maps to Azure Monitor action group → Function/Job → ADO API."

}

```



---



\### RB-004 — ADO Scrum weekly status (ADO plane)



```json

{

&nbsp; "runbookId": "rb-004",

&nbsp; "name": "Weekly Status Summary (ADO + GitHub + Azure Evidence)",

&nbsp; "status": "draft",

&nbsp; "plane": "ado",

&nbsp; "category": "scrum",

&nbsp; "appId": "app-eva-da-rebuild",

&nbsp; "environments": \["env-dev"],

&nbsp; "triggers": \[

&nbsp;   {

&nbsp;     "type": "schedule",

&nbsp;     "source": "ado",

&nbsp;     "filters": { "dayOfWeek": "Friday", "time": "15:00", "timezone": "America/Montreal" }

&nbsp;   }

&nbsp; ],

&nbsp; "inputs": \[

&nbsp;   { "name": "iterationPath", "type": "string", "required": true },

&nbsp;   { "name": "areaPath", "type": "string", "required": true }

&nbsp; ],

&nbsp; "preconditions": \[

&nbsp;   { "id": "pc-1", "text": "ADO project configured; GitHub repo linked; evidence packs produced on PRs." }

&nbsp; ],

&nbsp; "steps": \[

&nbsp;   {

&nbsp;     "stepId": "s-10",

&nbsp;     "title": "Summarize ADO progress (completed/in-progress/blockers)",

&nbsp;     "kind": "action",

&nbsp;     "executor": { "type": "agent", "agentId": "agent-ado-scrum", "skillId": "skill-scrum-draft" },

&nbsp;     "params": { "include": \["completed", "in\_progress", "blocked"] },

&nbsp;     "evidence": \[{ "type": "artifact", "required": true, "name": "weekly-status.md" }],

&nbsp;     "onFailure": { "strategy": "stop", "createTicket": { "enabled": true, "targetPlane": "ado", "workItemType": "Task" } }

&nbsp;   }

&nbsp; ],

&nbsp; "approvalGates": \[],

&nbsp; "outputs": \[{ "name": "statusMarkdownUri", "type": "string" }],

&nbsp; "evidencePack": { "required": false, "schemaVersion": "1.0", "requiredArtifacts": \[], "retentionDays": 30 },

&nbsp; "rbac": { "canRunRoles": \["admin", "maintainer"], "canEditRoles": \["admin"], "canApproveRoles": \["approver"] },

&nbsp; "notes": "Future: enrich with PR/deploy/evidenceId links."

}

```



---



\## 3) Runbook “workflow readiness” fields (so they convert cleanly later)



When you build the UI, ensure these are captured for every runbook:



\* `plane`, `runtime`, `executor` per step

\* `trigger` + `filters`

\* `inputs` + validation rules

\* `evidence` required per step

\* `onFailure` strategy + ticketing behavior

\* `approvalGates` (env-aware)

\* `rbac` (who can run/edit/approve)



This is what makes a runbook “compilable” into real workflows.



---



Below are \*\*UI specs for the screens\*\* you need to manage the whole model (connections → apps/envs → agents/skills → runbooks/workflows → runs/evidence → policies/RBAC), based directly on the requirements we established.



I’m assuming you’re building this inside your \*\*EVA admin portal\*\* (Fluent UI + GC Design System), bilingual-ready and WCAG-friendly.



---



\# 0) Global UI requirements (apply to every screen)



\*\*Navigation\*\*



\* Left nav: \*\*Dashboard\*\*, \*\*Runbooks\*\*, \*\*Workflows\*\*, \*\*Runs \& Evidence\*\*, \*\*Agents\*\*, \*\*Connections\*\*, \*\*Apps \& Environments\*\*, \*\*Policies\*\*, \*\*RBAC\*\*, \*\*Settings\*\*

\* Global search box (top): search by `evidenceId`, `AB#`, PR number, run id, workflow, app



\*\*Layout\*\*



\* Standard admin template: page title + subtitle + primary actions + filter bar + content (DataGrid) + right-side details panel



\*\*Common patterns\*\*



\* DataGrid: sortable columns, filter chips, column picker, pagination

\* Details panel: read-only summary + actions + tabs (Overview / Steps / Evidence / History)

\* “Copy” buttons for IDs/URLs (evidenceId, PR, deployment id)

\* Status badges: Draft/Active/Paused/Failed/Succeeded



\*\*Bilingual \& a11y\*\*



\* i18n keys for all strings

\* Keyboard-first: full grid navigation, filter controls, dialogs

\* ARIA labels for icon-only controls; focus trapping in dialogs

\* Error summary blocks + inline field errors



---



\# 1) Dashboard screen



\*\*Purpose\*\*

At-a-glance operational health + links to the last evidence.



\*\*Widgets\*\*



1\. \*\*Runs Overview\*\* (last 24h / 7d toggle)



\* total runs, success rate, avg duration, failures by workflow



2\. \*\*Top Failing Workflows\*\*



\* workflow name, failure count, last failure time



3\. \*\*Environment Health\*\*



\* DEV/STG/PROD: last deployment, current version/commit, open alerts



4\. \*\*Cost/Usage (optional placeholder)\*\*



\* last 7d Azure cost by app/env (if available)



\*\*Primary actions\*\*



\* “Run a Runbook”

\* “Create Runbook”

\* “Create Workflow”

\* “View Evidence Packs”



---



\# 2) Runbooks screens



\## 2.1 Runbooks List



\*\*Purpose\*\*

Manage human-authored runbooks (the “source”) before they become workflows.



\*\*Columns\*\*



\* Name

\* Plane (GitHub/Azure/ADO)

\* Category (Build/Test/Deploy/Ops/Scrum/User Support)

\* App

\* Status (Draft/Active/Paused)

\* Trigger type (Manual/Event/Schedule/Alert)

\* Last run (time + status)

\* Owner team



\*\*Filter bar\*\*



\* App, Plane, Status, Category, Environment, Trigger type



\*\*Row actions\*\*



\* View

\* Run (if active)

\* Clone

\* Export JSON

\* Archive



\*\*Bulk actions\*\*



\* Enable/Disable

\* Export selected



\## 2.2 Runbook Detail



\*\*Tabs\*\*



1\. \*\*Overview\*\*



\* metadata: name, status, plane, category, app, supported envs

\* trigger summary

\* required inputs summary

\* linked workflows (if converted)

\* audit: created by / updated by / version



2\. \*\*Steps\*\*



\* step list with: order, title, executor (agent/skill/script/connector), on-failure strategy

\* “View step config” panel (JSON editor + form editor toggle)

\* “Add step” (wizard)



3\. \*\*Inputs \& Preconditions\*\*



\* input schema table (name, type, required, default)

\* preconditions checklist (text items)



4\. \*\*Evidence\*\*



\* evidence pack required? (yes/no)

\* required artifacts list (type/name)

\* retention policy



5\. \*\*History\*\*



\* version timeline (v1, v2…), diff viewer (JSON diff)



\*\*Primary actions\*\*



\* Save Draft

\* Publish (sets status Active)

\* Run Now (opens “Run dialog”)

\* Convert to Workflow (creates workflow definition from runbook steps)

\* Export JSON



\## 2.3 Run Runbook dialog



\*\*Fields\*\*



\* Choose Environment (if applicable)

\* Inputs (generated from schema)

\* “Link to Work Item” (optional AB#)

\* “Link to PR” (optional)

\* Confirm RBAC + approval requirement



\*\*Output\*\*



\* Launch run → redirect to Run Detail



---



\# 3) Workflows screens (compiled/executable automation)



\## 3.1 Workflows List



\*\*Columns\*\*



\* Name

\* App

\* Status

\* Trigger (PR / webhook / schedule / alert / manual)

\* Planes used (chips: GitHub/Azure/ADO)

\* Approval gates (none / STG / PROD)

\* Last run

\* Success rate (7d)



\*\*Primary actions\*\*



\* Create Workflow

\* Import from Runbook

\* Pause/Resume



\## 3.2 Workflow Builder (visual + form)



\*\*Left panel\*\*



\* Trigger configuration

\* Policies attached

\* Approval gates



\*\*Main canvas\*\*



\* Steps as a vertical flow

\* Each step shows: executor, inputs, outputs, evidence required

\* Drag reorder, add step, delete step



\*\*Right panel (selected step)\*\*



\* executor type: Agent+Skill / Script / Connector

\* params form + “advanced JSON”

\* on-failure behavior

\* evidence artifacts produced



\*\*Validation\*\*



\* warn if: no evidence pack, no correlation ID mapping, missing approval on STG/PROD, missing required checks



\*\*Primary actions\*\*



\* Save

\* Publish

\* Test-run (sandbox only)

\* Export JSON/YAML (for Actions/Functions)



---



\# 4) Runs \& Evidence screens



\## 4.1 Runs List



\*\*Columns\*\*



\* Run ID

\* Evidence ID

\* Workflow/Runbook

\* App

\* Environment

\* Status

\* Started

\* Duration

\* Initiator (user/agent/system)

\* Links (AB#, PR, deployment)



\*\*Filter bar\*\*



\* Status, App, Env, Date range, Plane, Initiator, “Has Evidence Pack”



\*\*Row click\*\*



\* opens Run Detail



\## 4.2 Run Detail



\*\*Header\*\*



\* Status timeline: Queued → Running → Completed

\* evidenceId + copy

\* deep links: ADO work item, GitHub PR, Azure deployment



\*\*Tabs\*\*



1\. Overview (run context, initiator, env, version/commit)

2\. Steps (step runs, duration, logs link, outputs)

3\. Evidence (artifact list with download, hashes, retention)

4\. Telemetry (queries, snapshots, App Insights/Log Analytics links)

5\. Notes/Comments (operator annotations)



\*\*Primary actions\*\*



\* Download Evidence Pack

\* Re-run (if allowed)

\* Create ADO Bug/Task (pre-filled with evidence links)

\* Mark as “Reviewed” (audit)



---



\# 5) Agents \& Skills screens



\## 5.1 Agents List



\*\*Columns\*\*



\* Agent name

\* Plane

\* Runtime (Actions / Container Apps Job / ADO Pipeline / Foundry)

\* Type (build/test/deploy/ops/scrum)

\* Status (enabled/disabled)

\* Owned by team

\* Last run



\*\*Actions\*\*



\* Enable/Disable

\* View config

\* Test connectivity (runs a “ping skill”)



\## 5.2 Agent Detail



\*\*Tabs\*\*



\* Overview (plane/runtime, identity used, allowed scopes)

\* Skills (enabled skills list; toggle; defaults)

\* Policies (attached restrictions)

\* Health (recent failures, latency)

\* Secrets/Identity (read-only references; never show secret values)



\## 5.3 Skills Catalog



\*\*Grid\*\*



\* Skill name

\* Category

\* Input schema summary

\* Output schema summary

\* Used by agents (count)



\*\*Skill Detail\*\*



\* schema editor (JSON schema)

\* validation rules

\* example payloads



---



\# 6) Connections screens (ADO / GitHub / Azure)



\## 6.1 Connections List



\*\*Columns\*\*



\* Name

\* Plane

\* Auth mode (OIDC / PAT / MI)

\* Status

\* Last check

\* Owner



\*\*Actions\*\*



\* Add connection

\* Test connection

\* Disable



\## 6.2 Connection Detail



\*\*Sections\*\*



\* Summary (type, endpoints, tenant scope)

\* Auth config (non-secret): client id, tenant id, audience, scopes

\* Permissions checklist (read-only)

\* Test results (logs)

\* Dependent objects (repos, envs, workflows)



---



\# 7) Apps \& Environments screens



\## 7.1 Apps List



\*\*Columns\*\*



\* App name

\* Owner team

\* Repos linked

\* Environments count

\* Active workflows

\* Last deployment



\*\*App Detail\*\*



\* repos, services, tags

\* default policies

\* default evidence retention



\## 7.2 Environments List



\*\*Columns\*\*



\* Env name (DEV/STG/PROD)

\* Classification

\* Azure subscription/RG

\* Approval gate required?

\* Current version/commit

\* Last deploy



\*\*Env Detail\*\*



\* service inventory (App Service/APIM/etc.)

\* tags + cost center

\* telemetry workspace links

\* deployment history



---



\# 8) Policies screen



\*\*Policies List\*\*



\* Policy name

\* Type (allowed actions, logging required, env restriction, data boundary)

\* Status

\* Attached to (# workflows, # agents)



\*\*Policy Detail\*\*



\* rules editor (form + JSON)

\* impact preview (what it affects)



---



\# 9) RBAC screen



\*\*Users\*\*



\* UPN, display name

\* roles assigned

\* last activity



\*\*Roles\*\*



\* role name

\* permissions matrix



\*\*Assignments\*\*



\* scope type: global/app/env/workflow

\* assign/remove actions



---



\# 10) Settings screen



\* Evidence retention defaults

\* Naming conventions (evidenceId format)

\* Notification integrations (email/Teams later)

\* Feature flags (enable “Convert runbooks to workflows”, etc.)



---


# EVA Data Model - Layer Architecture

## How Many Layers?

**Short Answer:** The data model currently has **30 semantic layers**, but this is **not fixed**. New layers can be added dynamically to the cloud API.

## Why "30 Layers"?

The number 30 appears in documentation and backup manifests because that's what the cloud API currently exposes. It's an **observed count**, not a hardcoded limit:

```
📊 Current Count (as of March 5, 2026 11:54 AM):
├─ 30 layers discovered via agent-summary
├─ 4,279 objects distributed across layers
├─ Largest: agents, endpoints, projects
└─ Smallest: evidence (L31 - specialized audit trail)
```

## Dynamic Layer Discovery

**Original Issue:** The sync script originally used a **hardcoded list** of 30 layer names.

**Current Solution:** The sync script now **discovers layers dynamically**:

```powershell
# Fetches from cloud API - adapts automatically if new layers added
$summary = Invoke-RestMethod "$CloudApiBase/agent-summary"
$layers = $summary.layers | Select-Object -ExpandProperty name
```

**Implication:** If a new layer is added to the cloud API tomorrow, the backup script will automatically include it on the next run.

## The Layers

The 30 layers include:

| Category | Examples | Count |
|----------|----------|-------|
| **Agents** | agents, agent-configs, agent-deployments | 3 |
| **Infrastructure** | endpoints, containers, services, hosts, networking | 5 |
| **Projects** | projects, tasks, work-items, resources, allocations | 5 |
| **Evidence** | evidence, test-results, artifacts, correlations, audit-trail | 5 |
| **Data** | datasets, transformations, schema, models, indexes | 4 |
| **Knowledge** | kb-articles, wikis, docs, media, references | 3+ |
| **Operations** | health-status, metrics, logs, alerts, events | 3 |
| **Other** | deprecated, experimental, temp, sandbox, graph | 2+ |

## Why Not a Fixed List?

In AI research and MAT (Model Augmentation Technology):
- **Ontologies evolve**: New relationships require new layers
- **Scaling**: As EVA grows (agents, projects, evidence), layer organization may change
- **Experimentation**: New layer types are tested before promotion

## For Developers

When working with the data model:

✅ **DO:** Query `agent-summary` to learn current layer structure  
✅ **DO:** Write code that iterates over discovered layers (not hardcoded lists)  
✅ **DO:** Assume the data model is a growing/evolving system  

❌ **DON'T:** Hardcode layer names or counts  
❌ **DON'T:** Assume "30 layers" is permanent  
❌ **DON'T:** Skip layers because they weren't in an old script  

## Historical Context

**Session 20 (Mar 5, 2026):**
- **Before:** sync-cloud-to-local.ps1 had hardcoded layer list (appeared arbitrary)
- **After:** Script dynamically queries agent-summary, adapts to cloud API changes
- **Why:** Single source of truth principle — cloud API is the authority on which layers exist

---

**Updated:** March 5, 2026 12:15 PM  
**Automated by:** GitHub Copilot (Agent Framework mode)  
**Related:** [sync-cloud-to-local.ps1](scripts/sync-cloud-to-local.ps1), [USER-GUIDE.md Section 1](USER-GUIDE.md#1-discover-what-layers-exist)

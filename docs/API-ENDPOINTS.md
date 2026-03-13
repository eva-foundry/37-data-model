# EVA Data Model API - Endpoint Reference

**Last Updated**: 2026-03-12 23:05:25

## Overview

The EVA Data Model API provides access to all 121 operational layers and supports DPDCA-driven governance.

## Base URL

\\\
https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io
\\\

## Authentication

All endpoints require bearer token authentication (for /model/admin endpoints) or are public.

---

## Endpoints

### GET /health

**Status**: Operational  
**Response**: Application health status

\\\json
{
  "status": "ok",
  "service": "model-api",
  "version": "1.0.0",
  "uptime_seconds": 106062
}
\\\

---

### GET /model/agent-guide

**Status**: Operational  
**Description**: Retrieves agent guidelines for querying the data model safely

**Response Schema**:
\\\json
{
  "query_patterns": [],
  "write_cycle": {},
  "common_mistakes": [],
  "layers_available": 121
}
\\\

**Usage**: Essential for every agent session bootstrap

---

### GET /model/user-guide

**Status**: Operational  
**Description**: Retrieves 6 DPDCA category runbooks with deterministic layer query sequences

**Categories**:
1. **session_tracking** - paperless project_work updates (ID: {project_id}-{YYYY-MM-DD})
2. **sprint_tracking** - velocity and delivery tracking
3. **evidence_tracking** - immutable audit trail
4. **governance_events** - verification_records, quality_gates, decisions, risks
5. **infra_observability** - infrastructure_events, deployment_records
6. **ontology_domains** - 12-domain reasoning architecture

**Response Schema**:
\\\json
{
  "categories": [
    {
      "name": "session_tracking",
      "layers": ["project_work"],
      "query_sequence": [],
      "anti_trash_rules": []
    }
  ]
}
\\\

**Related Docs**: [98-model-ontology-for-agents.md](library/98-model-ontology-for-agents.md)

---

### GET /model/ontology

**Status**: Operational  
**Description**: Returns 12-domain cognitive architecture for agent reasoning

**Domains**:
1. System Architecture
2. Identity & Access
3. AI Runtime
4. User Interface
5. Project & PM
6. Strategy & Portfolio
7. Execution Engine
8. DevOps & Delivery
9. Governance & Policy
10. Observability & Evidence
11. Infrastructure & FinOps
12. Ontology Domains

**Response Schema**:
\\\json
{
  "domains": [
    {
      "name": "System Architecture",
      "domain_id": 1,
      "layers": []
    }
  ]
}
\\\

**Related Docs**: [99-layers-design-20260309-0935.md](library/99-layers-design-20260309-0935.md)

---

### GET /ready

**Status**: Operational  
**Description**: Kubernetes readiness probe endpoint

**Response**: HTTP 200 + boolean (used by load balancer)

\\\json
{ "ready": true }
\\\

**Related Infrastructure**: [DEPLOYMENT.md](../docs/DEPLOYMENT.md)

---

## Rate Limits

- **Default**: 1000 requests/minute per API key
- **Burst**: 100 requests/second
- **Headers**: \X-RateLimit-Remaining\, \X-RateLimit-Reset\

## Error Handling

All errors follow standard HTTP status codes:

\\\
200 OK
400 Bad Request
401 Unauthorized
404 Not Found
429 Too Many Requests
500 Internal Server Error
\\\

Error response format:

\\\json
{
  "error": "error_code",
  "message": "human readable message",
  "correlation_id": "unique request identifier"
}
\\\

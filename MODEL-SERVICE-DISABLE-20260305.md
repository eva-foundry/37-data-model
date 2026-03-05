# LOCAL SERVICE DISABLE - MARCH 5, 2026

## Summary
Local development service on port 8010 (http://localhost:8010) has been permanently disabled.
All agents must now use the cloud API endpoint exclusively.

## What Changed
- Port 8010 is no longer listening
- Model files (model/ directory) have been archived
- All documentation updated to reference cloud endpoint only

## Cloud Endpoint (Single Source of Truth)
Base: https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io
- Health: GET /health
- Agent Summary: GET /model/agent-summary (4,339 objects)
- Any Layer: GET /model/{layer}/

## Files Archived
- C:\AICOE\eva-foundry\37-data-model\model > model-archive-disabled-20260305-1136/
- C:\AICOE\eva-foundry\37-data-model\model > model-archive-20260305/

## Documentation Updated
- README.md - Points to cloud endpoint only
- USER-GUIDE.md - v2.7 - Clarifies cloud is sole source of truth
- All localhost:8010 references replaced with cloud URL

## Reason
To maintain data consistency, we eliminate local-to-cloud sync issues by having ONE authoritative source.

## Agent Migration Required
Update any agent code that references http://localhost:8010 to use:
$base = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

## Timestamp
March 5, 2026, 11:36 AM ET

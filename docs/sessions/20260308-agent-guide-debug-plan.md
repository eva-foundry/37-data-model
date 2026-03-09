# Agent-Guide 500 Error Debug Plan
**Session**: 41 - Phase 3 Fix
**Date**: 2026-03-08
**Objective**: Resolve agent-guide endpoint 500 Internal Server Error

## Problem Statement
GET /model/agent-guide returns 500 error on both local (8010) and Azure deployment.
Phase 2 endpoints (layer-metadata) work perfectly. Error persists after 3 fix attempts.

## Root Cause Hypothesis
Unknown - need to capture actual Python traceback to diagnose.

## DPDCA Plan

### [x] DISCOVER
- [x] Confirmed tests/ directory exists
- [x] Verified 2 server processes running (need to clean up)
- [x] Confirmed 3 commits ready: c0fd544, a65bfbe, fc9c05a
- [x] No uncommitted changes to tracked files

### [ ] PLAN (Current)
- [ ] Create debug endpoint with explicit error handling
- [ ] Add logging to agent_guide() function
- [ ] Restart server with debug endpoint
- [ ] Capture Python traceback
- [ ] Analyze root cause

### [ ] DO
- [ ] Implement debug endpoint
- [ ] Restart server cleanly (kill existing processes)
- [ ] Test debug endpoint

### [ ] CHECK
- [ ] Verify debug endpoint returns detailed error info
- [ ] Analyze traceback to find exact failing line
- [ ] Run test suite if one exists

### [ ] ACT
- [ ] Fix root cause based on traceback
- [ ] Test fix locally
- [ ] Commit fix with proper message
- [ ] Push and redeploy to Azure
- [ ] Update STATUS.md

## Success Criteria
- [PASS] Local agent-guide returns 200 with remediation_framework section
- [PASS] Azure agent-guide returns 200 with remediation_framework section  
- [PASS] Test suite exits 0 (if tests exist for this endpoint)
- [PASS] Commits properly formatted with evidence

## Evidence Trail
- Initial discovery: Session 41, 8:00 PM ET
- Fix attempts: 3 (all unsuccessful - no traceback captured)
- Current blocker: Need Python traceback to identify exact error location

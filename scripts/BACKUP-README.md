BACKUP AND DISASTER RECOVERY SCRIPTS

These scripts manage the local backup copy of cloud data.

PURPOSE
=======
- Cloud API (https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io) is the primary source
- Local model/ directory is BACKUP ONLY for disaster recovery
- Agents always use cloud API, never local files


SCRIPTS
=======

1. sync-cloud-to-local.ps1
   - Download all 30+ layers from cloud API
   - Save as JSON files in model/ directory
   - Create BACKUP-SYNC-MANIFEST.json with sync details
   - Recommended: Run daily via Task Scheduler
   - Usage: powershell -File .\scripts\sync-cloud-to-local.ps1
   - Time: ~60 seconds
   - Output: 4,279 objects, 7.2 MB local backup

2. validate-cloud-sync.ps1
   - Verify local backup files match manifest
   - Check for file integrity and consistency
   - Recommended: Run after each sync
   - Usage: powershell -File .\scripts\validate-cloud-sync.ps1
   - Exit: 0 (valid) or 1 (issues found)

3. health-check.ps1
   - Test cloud API connectivity and health
   - Shows service status, uptime, store type
   - Recommended: Run before sync
   - Usage: powershell -File .\scripts\health-check.ps1

4. restore-from-backup.ps1
   - ONLY if cloud API is down for extended time
   - Starts local uvicorn server on port 8010
   - Loads backup JSON files from model/ directory
   - After cloud recovers: Run sync-cloud-to-local.ps1 again
   - Usage: powershell -File .\scripts\restore-from-backup.ps1


BACKUP LOCATIONS
================
model/                              - 30 JSON layer files (4,279 objects)
BACKUP-SYNC-MANIFEST.json           - Sync metadata and file list
BACKUP-SUMMARY.txt                  - Human-readable summary


DISASTER RECOVERY PROCEDURE
============================
If cloud API is unavailable:

1. Verify local backup exists:
   ls C:\eva-foundry\model\

2. Start local service:
   powershell -File .\scripts\restore-from-backup.ps1

3. Agent use local endpoint temporarily:
   http://localhost:8010

4. When cloud restored, re-sync:
   powershell -File .\scripts\sync-cloud-to-local.ps1

5. Agents switch back to cloud:
   https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io


RECOMMENDED SCHEDULE
====================
Daily:   sync-cloud-to-local.ps1
Daily:   validate-cloud-sync.ps1
Weekly:  Review BACKUP-SUMMARY.txt
Monthly: Verify backup files are readable


CLOUD DATA STATUS
=================
Last sync:  2026-03-05 11:54:36
Objects:    4,279
Layers:     30
Size:       7.2 MB
Cloud API:  HEALTHY (24x7 operational)
Started:    2026-03-05 14:53:33


NOTES
=====
- Local copy is READ-ONLY for backup purposes
- Do NOT configure agents to use port 8010 during normal operations
- Agents access cloud API exclusively
- If port 8010 is running, cloud API is down (emergency mode)
- Maximum downtime before using local: Not defined (use judgment)
- After restoring from backup, full sync to cloud may be needed

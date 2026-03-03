import json
import urllib.request
import urllib.error

BASE = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"

# Step 1 -- verify hook
print("=== VERIFY HOOK ===")
url = f"{BASE}/model/hooks/useActingSession"
try:
    with urllib.request.urlopen(url, timeout=20) as resp:
        h = json.loads(resp.read().decode("utf-8"))
        print(f"[PASS] id={h.get('id')} rv={h.get('row_version')} status={h.get('status')} modified_by={h.get('modified_by')}")
except urllib.error.HTTPError as e:
    print(f"[FAIL] HTTP {e.code}: {e.read().decode()}")
    raise SystemExit(1)

# Step 2 -- agent-summary to confirm hooks count
print("\n=== AGENT SUMMARY ===")
url = f"{BASE}/model/agent-summary"
with urllib.request.urlopen(url, timeout=20) as resp:
    s = json.loads(resp.read().decode("utf-8"))
    print(f"total={s['total']} hooks={s['layers']['hooks']}")

# Step 3 -- commit
print("\n=== COMMIT ===")
req = urllib.request.Request(f"{BASE}/model/admin/commit", data=b"", method="POST")
req.add_header("Authorization", "Bearer dev-admin")
req.add_header("Content-Length", "0")
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        c = json.loads(resp.read().decode("utf-8"))
        print(f"status         = {c.get('status')}")
        print(f"violation_count= {c.get('violation_count')}")
        print(f"exported_total = {c.get('exported_total')}")
        print(f"export_errors  = {c.get('export_errors')}")
        if c.get("violation_count") == 0:
            print("[PASS] COMMIT CLEAN")
        else:
            print(f"[FAIL] violations: {c.get('violations')}")
except urllib.error.HTTPError as e:
    print(f"[FAIL] HTTP {e.code}: {e.read().decode()}")

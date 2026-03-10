import json
import urllib.request
import urllib.error

BASE = "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io"
OUT = r"C:\eva-foundry\commit-result.txt"

# write startup marker immediately so we know the script ran
with open(OUT, "w", encoding="ascii") as _sf:
    _sf.write("STARTED\n")

lines = []
req = urllib.request.Request(f"{BASE}/model/admin/commit", data=b"", method="POST")
req.add_header("Authorization", "Bearer dev-admin")
req.add_header("Content-Length", "0")

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        c = json.loads(resp.read().decode("utf-8"))
        lines.append(f"status={c.get('status')}")
        lines.append(f"violation_count={c.get('violation_count')}")
        lines.append(f"exported_total={c.get('exported_total')}")
        errs = c.get("export_errors") or []
        lines.append(f"export_errors_count={len(errs)}")
        if c.get("violation_count") == 0 and not errs:
            lines.append("COMMIT_PASS")
        else:
            lines.append(f"COMMIT_FAIL violations={c.get('violations')}")
except urllib.error.HTTPError as e:
    lines.append(f"HTTP_FAIL {e.code} {e.read().decode()}")
except Exception as ex:
    lines.append(f"ERROR {ex}")

result = "\n".join(lines)
print(result)
with open(OUT, "w", encoding="ascii", errors="replace") as f:
    f.write(result + "\n")

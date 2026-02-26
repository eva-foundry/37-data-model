"""
Quick smoke test for the live EVA Model API.
Run: python smoke_test.py
"""
import sys
import httpx

BASE = "http://127.0.0.1:8010"
ADMIN = {"Authorization": "Bearer dev-admin"}
PASS = []
FAIL = []

def check(label, condition, detail=""):
    if condition:
        PASS.append(label)
        print(f"  PASS  {label}")
    else:
        FAIL.append(label)
        print(f"  FAIL  {label}  {detail}")

with httpx.Client(base_url=BASE, timeout=10, follow_redirects=True) as c:
    # Health
    r = c.get("/health")
    check("GET /health 200", r.status_code == 200)
    check("health.store=memory", r.json().get("store") == "memory")

    # List services
    r = c.get("/model/services")
    check("GET /model/services 200", r.status_code == 200)
    check("services count >= 1", len(r.json()) >= 1)

    # Get one
    r = c.get("/model/services/eva-brain-api")
    check("GET /model/services/eva-brain-api 200", r.status_code == 200)
    svc = r.json()
    check("has audit fields", all(k in svc for k in ["created_at","modified_at","row_version"]))

    # 404 on unknown
    r = c.get("/model/services/nonexistent-xyz")
    check("unknown object is 404", r.status_code == 404)

    # Cache header
    r = c.get("/model/services/eva-brain-api")
    check("cached flag on second GET", r.json().get("_cached") is True)

    # Filter endpoints
    r = c.get("/model/endpoints/filter?status=stub")
    check("GET /model/endpoints/filter?status=stub 200", r.status_code == 200)
    check("filter returns list", isinstance(r.json(), list))
    check("all filtered are stub", all(e.get("status") == "stub" for e in r.json()))

    # Impact
    r = c.get("/model/impact?container=jobs")
    check("GET /model/impact?container=jobs 200", r.status_code == 200)
    data = r.json()
    check("impact has endpoints", len(data["impact"]["endpoints"]) >= 1)

    # Upsert + row_version
    r = c.put("/model/services/smoke-test-svc", json={"name":"Smoke Test","type":"internal_api"})
    check("PUT new object 200", r.status_code == 200)
    check("row_version=1 on create", r.json().get("row_version") == 1)
    r = c.put("/model/services/smoke-test-svc", json={"name":"Smoke Test v2"})
    check("row_version=2 on update", r.json().get("row_version") == 2)

    # Soft delete + 404
    c.put("/model/services/to-delete", json={"name":"Delete Me"})
    r = c.delete("/model/services/to-delete")
    check("DELETE soft-deletes 200", r.status_code == 200)
    r = c.get("/model/services/to-delete")
    check("GET soft-deleted is 404", r.status_code == 404)

    # Admin seed (requires proper token)
    r = c.post("/model/admin/seed", headers=ADMIN)
    check("POST /model/admin/seed 200", r.status_code == 200)
    seed = r.json()
    check("seed total > 0", seed.get("total", 0) > 0)
    check("seed errors empty", seed.get("errors", []) == [])

print()
print(f"Results: {len(PASS)}/{len(PASS)+len(FAIL)} PASS")
if FAIL:
    print("FAILED:", FAIL)
    sys.exit(1)
else:
    print("ALL SMOKE TESTS PASSED")

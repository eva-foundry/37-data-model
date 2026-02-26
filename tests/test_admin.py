"""
Admin + seed tests.

Tests:
  T30  GET /health                                  → ok, store=memory, cache=memory
  T31  POST /model/admin/seed (no auth)             → 403
  T32  POST /model/admin/seed (with admin token)    → 200, seeded counts > 0
  T33  GET  /model/admin/audit                      → list with layer + obj_id + row_version
  T34  GET  /model/admin/validate                   → PASS (0 violations on clean model)
  T35  POST /model/admin/cache/flush                → 200, flushed=true
  T36  row_version increments correctly on re-seed  → row_version ≥ 2 after second seed
"""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient


def test_T30_health(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["store"] == "memory"
    assert body["cache"] == "memory"


def test_T31_seed_requires_admin(client: TestClient):
    r = client.post("/model/admin/seed")
    assert r.status_code == 403


def test_T32_seed_loads_all_layers(client: TestClient, admin_headers: dict):
    r = client.post("/model/admin/seed", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 200, f"Expected ≥200 seeded objects, got {body['total']}"
    assert "services" in body["seeded"]
    assert body["seeded"]["services"] >= 9
    assert body["seeded"]["endpoints"] >= 44
    assert body["seeded"]["containers"] >= 7
    assert body["errors"] == []


def test_T33_audit_returns_write_events(client: TestClient, admin_headers: dict):
    # Create a fresh object so there's definitely something in the audit log
    client.put(
        "/model/services/audit-test-svc",
        json={"id": "audit-test-svc", "label": "Audit", "type": "internal_api",
              "tech_stack": [], "status": "planned"},
        headers={"X-Actor": "audit-tester"},
    )
    r = client.get("/model/admin/audit?limit=5", headers=admin_headers)
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) >= 1
    for row in rows:
        assert "modified_at" in row
        assert "row_version" in row


def test_T34_validate_passes_on_clean_model(client: TestClient, admin_headers: dict):
    r = client.get("/model/admin/validate", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "PASS", (
        f"validate returned FAIL with {body['count']} violations:\n"
        + "\n".join(body["violations"][:10])
    )
    assert body["count"] == 0


def test_T35_cache_flush(client: TestClient, admin_headers: dict):
    # warm cache
    client.get("/model/services")
    # flush
    r = client.post("/model/admin/cache/flush", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["flushed"] is True
    # next list should work (re-populated from store)
    r2 = client.get("/model/services")
    assert r2.status_code == 200


def test_T36_row_version_increments_on_reseed(client: TestClient, admin_headers: dict):
    # First seed: row_version=1 (already done in startup auto-seed)
    r1 = client.get("/model/services/eva-brain-api")
    v1 = r1.json()["row_version"]

    # Second seed (re-run)
    client.post("/model/admin/seed", headers=admin_headers)

    r2 = client.get("/model/services/eva-brain-api")
    v2 = r2.json()["row_version"]
    assert v2 == v1 + 1, f"Expected row_version to increment from {v1} to {v1+1}, got {v2}"


def test_T37_provenance_source_file_on_all_layers(client: TestClient, admin_headers: dict):
    """
    E-09: After auto-seed every object must carry source_file.
    Checks representative objects from 5 different layers.
    """
    spot_checks = [
        ("/model/services/eva-brain-api",    "model/services.json"),
        ("/model/screens/TranslationsPage",  "model/screens.json"),
        ("/model/endpoints/GET /v1/health",  "model/endpoints.json"),
        ("/model/components/AdminListPage",  "model/components.json"),
        ("/model/hooks/useTranslations",     "model/hooks.json"),
    ]
    for url, expected_source in spot_checks:
        r = client.get(url)
        assert r.status_code == 200, f"GET {url} → {r.status_code}"
        body = r.json()
        assert body.get("source_file") == expected_source, (
            f"{url}: expected source_file={expected_source!r}, got {body.get('source_file')!r}"
        )


def test_T38_provenance_audit_fields_present(client: TestClient):
    """
    E-09: created_by, created_at, modified_by, modified_at, row_version, is_active
    must all be present on every auto-seeded object.
    """
    required_fields = {"created_by", "created_at", "modified_by", "modified_at",
                       "row_version", "is_active"}
    r = client.get("/model/services/eva-brain-api")
    assert r.status_code == 200
    body = r.json()
    missing = required_fields - body.keys()
    assert not missing, f"Missing audit fields on services/eva-brain-api: {missing}"
    assert body["row_version"] >= 1
    assert body["is_active"] is True
    assert body["created_by"] != ""

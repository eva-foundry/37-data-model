"""
CRUD tests — cover all generic layer operations via the HTTP API.

Tests:
  T01  GET /model/services            → 200, list populated from disk seed
  T02  GET /model/services/{id}       → 200, correct object returned
  T03  GET /model/services/{id}       → second call served from cache (_cached=True)
  T04  PUT /model/services/{id}       → 200, row_version=1 on first write, audit stamped
  T05  PUT /model/services/{id}       → second write row_version=2, created_* preserved
  T06  DELETE /model/services/{id}    → 200, soft-delete confirmed
  T07  GET /model/services?active_only=false  → soft-deleted object appears
  T08  GET /model/services/{id}       → 404 after soft-delete (active_only=True by default)
  T09  GET /model/endpoints/filter    → filter by status=implemented
  T10  GET /model/endpoints/filter    → filter by cosmos_writes
  T11  GET /model/endpoints/filter    → filter by auth persona
  T12  Wrong layer → 404 on unknown object id
"""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient


# ── T01 — list returns seeded data ────────────────────────────────────────────

def test_T01_list_services(client: TestClient):
    r = client.get("/model/services")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) >= 9, f"Expected ≥9 services from disk seed, got {len(data)}"
    ids = [d.get("id") or d.get("obj_id") for d in data]
    assert "eva-brain-api" in ids
    assert "model-api" in ids


# ── T02 — get one ─────────────────────────────────────────────────────────────

def test_T02_get_one_service(client: TestClient):
    r = client.get("/model/services/eva-brain-api")
    assert r.status_code == 200
    obj = r.json()
    assert obj.get("id") == "eva-brain-api" or obj.get("obj_id") == "eva-brain-api"
    assert obj.get("row_version") >= 1
    assert obj.get("created_by") == "system:autoload"
    assert obj.get("modified_at")


# ── T03 — second call served from cache ───────────────────────────────────────

def test_T03_cached_response(client: TestClient):
    # warm the cache
    client.get("/model/services/eva-brain-api")
    # second call should be cached
    r = client.get("/model/services/eva-brain-api")
    assert r.status_code == 200
    assert r.json().get("_cached") is True


# ── T04 — upsert creates with row_version=1 + audit fields ───────────────────

def test_T04_upsert_new_object(client: TestClient):
    payload = {
        "id": "test-service",
        "label": "Test Service",
        "type": "internal_api",
        "tech_stack": ["Python"],
        "port": 9999,
        "status": "planned",
    }
    r = client.put(
        "/model/services/test-service",
        json=payload,
        headers={"X-Actor": "test-author"},
    )
    assert r.status_code == 200
    obj = r.json()
    assert obj["row_version"] == 1
    assert obj["created_by"] == "test-author"
    assert obj["modified_by"] == "test-author"
    assert obj["is_active"] is True
    assert obj["created_at"] == obj["modified_at"]   # first write


# ── T05 — second write increments row_version, preserves created_* ────────────

def test_T05_upsert_update_increments_row_version(client: TestClient):
    payload = {"id": "rw-service", "label": "RW", "type": "internal_api",
               "tech_stack": [], "status": "planned"}
    client.put("/model/services/rw-service", json=payload, headers={"X-Actor": "alice"})

    payload["label"] = "RW Updated"
    r = client.put("/model/services/rw-service", json=payload, headers={"X-Actor": "bob"})
    assert r.status_code == 200
    obj = r.json()
    assert obj["row_version"] == 2
    assert obj["created_by"] == "alice"   # preserved from first write
    assert obj["modified_by"] == "bob"    # updated


# ── T06 — soft delete ─────────────────────────────────────────────────────────

def test_T06_soft_delete(client: TestClient):
    # create
    client.put("/model/services/del-me", json={"id": "del-me", "label": "Del",
               "type": "internal_api", "tech_stack": [], "status": "planned"})
    # delete
    r = client.delete("/model/services/del-me", headers={"X-Actor": "remover"})
    assert r.status_code == 200
    resp = r.json()
    assert resp["deleted"] == "del-me"
    assert resp["row_version"] == 2


# ── T07 — soft-deleted appears with active_only=false ─────────────────────────

def test_T07_list_includes_inactive(client: TestClient):
    client.put("/model/services/hidden", json={"id": "hidden", "label": "H",
               "type": "internal_api", "tech_stack": [], "status": "planned"})
    client.delete("/model/services/hidden")

    r = client.get("/model/services?active_only=false")
    assert r.status_code == 200
    ids = [d.get("id") or d.get("obj_id") for d in r.json()]
    assert "hidden" in ids


# ── T08 — 404 after soft-delete on active_only query ─────────────────────────

def test_T08_get_soft_deleted_is_404(client: TestClient):
    client.put("/model/services/ghost", json={"id": "ghost", "label": "G",
               "type": "internal_api", "tech_stack": [], "status": "planned"})
    client.delete("/model/services/ghost")
    r = client.get("/model/services/ghost")
    assert r.status_code == 404


# ── T09 — filter endpoints by status ─────────────────────────────────────────

def test_T09_filter_endpoints_by_status(client: TestClient):
    r = client.get("/model/endpoints/filter?status=implemented")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    for ep in items:
        assert ep.get("status") == "implemented"


# ── T10 — filter endpoints by cosmos_writes ───────────────────────────────────

def test_T10_filter_endpoints_by_cosmos_writes(client: TestClient):
    r = client.get("/model/endpoints/filter?cosmos_writes=jobs")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    for ep in items:
        assert "jobs" in (ep.get("cosmos_writes") or [])


# ── T11 — filter endpoints by auth persona ────────────────────────────────────

def test_T11_filter_endpoints_by_auth(client: TestClient):
    r = client.get("/model/endpoints/filter?auth=admin")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 1
    for ep in items:
        assert "admin" in (ep.get("auth") or [])


# ── T12 — 404 on unknown object ───────────────────────────────────────────────

def test_T12_unknown_object_is_404(client: TestClient):
    r = client.get("/model/services/does-not-exist-xyz")
    assert r.status_code == 404

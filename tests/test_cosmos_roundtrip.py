"""
Cosmos round-trip tests — tests the export/seed cycle using MemoryStore.
No real Cosmos DB connection required; all tests run in-process.

Tests:
  T60  POST /model/admin/export — response format and counts match GET
  T61  Export is idempotent — two consecutive exports produce same total
  T62  PUT -> export records the write (exported count includes new object)
  T63  Fresh seed after export restores PUT objects correctly
  T64  Audit fields (row_version, created_by, modified_by) survive export->seed cycle

COS-7 intent: validate the seed-backup-restore cycle is end-to-end correct.
MemoryStore is used as the backing store; behaviour is identical to CosmosStore
for all operations that flow through the abstract AbstractStore interface.

Isolation: all tests use the `isolated_client` fixture, which:
  1. Copies the real model/*.json to a pytest tmp_path directory
  2. Monkeypatches api.routers.admin._MODEL_DIR to point at that copy
  3. Creates a fresh TestClient whose lifespan auto-seeds from (and exports to) the clone
This ensures no test artifact ever leaks into the real model JSON files.
"""
from __future__ import annotations
import shutil
import pytest
from fastapi.testclient import TestClient


# -- isolation fixture --------------------------------------------------------

@pytest.fixture
def isolated_client(tmp_path, monkeypatch, settings):
    """
    Fresh TestClient backed by a temp copy of the model directory.
    Auto-seed reads from the copy; all exports write to the copy.
    Real model/*.json files are never touched.
    """
    import api.routers.admin as admin_mod
    from api.server import create_app
    from api import config as _cfg

    # Clone real model files into a temp directory before the lifespan starts
    dst = tmp_path / "model"
    # Get the real model directory from the function (not a constant)
    real_model_dir = admin_mod._get_model_dir()
    shutil.copytree(str(real_model_dir), str(dst))

    # Redirect _get_model_dir to return the clone (must happen BEFORE TestClient.__enter__)
    monkeypatch.setattr(admin_mod, "_get_model_dir", lambda: dst)

    _cfg._settings = settings
    app = create_app()
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin_headers() -> dict[str, str]:
    return {"Authorization": "Bearer test-admin"}


# -- T60 -- export response format and counts ---------------------------------

def test_T60_export_response_format(isolated_client: TestClient, admin_headers: dict):
    """
    POST /model/admin/export returns correct structure.
    Actor format is "admin:<token[:8]>" per require_admin convention.
    """
    r = isolated_client.post("/model/admin/export", headers=admin_headers)
    assert r.status_code == 200, f"export failed: {r.text}"

    body = r.json()
    assert "exported" in body, "missing 'exported' key"
    assert "total"    in body, "missing 'total' key"
    assert "errors"   in body, "missing 'errors' key"
    assert "actor"    in body, "missing 'actor' key"

    assert body["errors"] == [], f"unexpected export errors: {body['errors']}"
    assert body["total"] > 0,   "expected non-zero total from auto-seeded store"
    assert body["actor"].startswith("admin:"), (
        f"unexpected actor format: {body['actor']!r} -- expected 'admin:<token>'"
    )

    # All 27 layers must appear in the exported dict
    exported = body["exported"]
    required_layers = [
        "services", "personas", "feature_flags", "containers", "endpoints",
        "schemas", "screens", "literals", "agents", "infrastructure", "requirements",
        "planes", "connections", "environments", "cp_skills", "cp_agents",
        "runbooks", "cp_workflows", "cp_policies", "mcp_servers", "prompts",
        "security_controls", "components", "hooks", "ts_types", "projects", "wbs",
    ]
    for layer in required_layers:
        assert layer in exported, f"layer '{layer}' missing from export response"

    # Spot-check: export count for services matches GET list count
    r_list = isolated_client.get("/model/services?active_only=false")
    assert r_list.status_code == 200
    response = r_list.json()
    assert "data" in response
    get_count = len(response["data"])
    assert exported["services"] == get_count, (
        f"export.services={exported['services']} but GET /model/services returned {get_count}"
    )


# -- T61 -- consecutive exports are idempotent --------------------------------

def test_T61_export_is_idempotent(isolated_client: TestClient, admin_headers: dict):
    """Two consecutive exports of an unchanged store must produce the same total."""
    r1 = isolated_client.post("/model/admin/export", headers=admin_headers)
    assert r1.status_code == 200
    total1 = r1.json()["total"]

    r2 = isolated_client.post("/model/admin/export", headers=admin_headers)
    assert r2.status_code == 200
    total2 = r2.json()["total"]

    assert total1 == total2, (
        f"Export not idempotent: first={total1}, second={total2}"
    )
    exp1, exp2 = r1.json()["exported"], r2.json()["exported"]
    for layer in exp1:
        assert exp1[layer] == exp2[layer], (
            f"layer '{layer}': first={exp1[layer]}, second={exp2[layer]}"
        )


# -- T62 -- PUT is captured by subsequent export ------------------------------

def test_T62_put_reflected_in_export(isolated_client: TestClient, admin_headers: dict):
    """After a PUT creating a new object, the next export count must increase by 1."""
    r_base = isolated_client.post("/model/admin/export", headers=admin_headers)
    assert r_base.status_code == 200
    base_count = r_base.json()["exported"]["containers"]

    r_put = isolated_client.put(
        "/model/containers/roundtrip-test-container",
        json={
            "id": "roundtrip-test-container",
            "label": "Round-trip test container",
            "type": "test",
            "status": "planned",
        },
        headers={"X-Actor": "test-roundtrip"},
    )
    assert r_put.status_code == 200, f"PUT failed: {r_put.text}"

    r_exp = isolated_client.post("/model/admin/export", headers=admin_headers)
    assert r_exp.status_code == 200
    new_count = r_exp.json()["exported"]["containers"]

    assert new_count == base_count + 1, (
        f"Expected containers export to grow from {base_count} to {base_count + 1}, got {new_count}"
    )


# -- T63 -- fresh seed after export restores objects --------------------------

def test_T63_fresh_seed_restores_store(isolated_client: TestClient, admin_headers: dict):
    """
    Export then re-seed must not lose any objects.
    Total after export+reseed >= total before (no data loss).
    """
    total_before = isolated_client.get("/model/agent-summary").json()["total"]

    r_exp = isolated_client.post("/model/admin/export", headers=admin_headers)
    assert r_exp.status_code == 200
    assert r_exp.json()["errors"] == []

    r_seed = isolated_client.post("/model/admin/seed", headers=admin_headers)
    assert r_seed.status_code == 200
    assert r_seed.json()["errors"] == []

    total_after = isolated_client.get("/model/agent-summary").json()["total"]
    assert total_after >= total_before, (
        f"Data loss: {total_before} objects before, {total_after} after export+reseed"
    )


# -- T64 -- audit fields survive export -> seed cycle ------------------------

def test_T64_audit_fields_survive_roundtrip(isolated_client: TestClient, admin_headers: dict):
    """
    PUT -> export -> reseed must preserve created_by, modified_by, row_version.
    Validates that bulk_load's audit-field preservation logic works correctly.
    """
    unique_id = "roundtrip-audit-test-svc"

    r_put = isolated_client.put(
        f"/model/services/{unique_id}",
        json={
            "id": unique_id,
            "label": "Audit round-trip test service",
            "type": "internal_api",
            "tech_stack": [],
            "status": "planned",
        },
        headers={"X-Actor": "audit-roundtrip-tester"},
    )
    assert r_put.status_code == 200
    orig = r_put.json()

    # Export to temp clone
    r_exp = isolated_client.post("/model/admin/export", headers=admin_headers)
    assert r_exp.status_code == 200

    # Re-seed from the temp clone (simulates cold restart)
    r_seed = isolated_client.post("/model/admin/seed", headers=admin_headers)
    assert r_seed.status_code == 200

    r_get = isolated_client.get(f"/model/services/{unique_id}")
    assert r_get.status_code == 200, "object lost after export+reseed"
    restored = r_get.json()

    assert restored["created_by"] == orig["created_by"], (
        f"created_by changed: {orig['created_by']!r} -> {restored['created_by']!r}"
    )
    assert restored["modified_by"] == orig["modified_by"], (
        f"modified_by changed: {orig['modified_by']!r} -> {restored['modified_by']!r}"
    )
    # row_version may increment on reseed (bulk_load increments for existing objects)
    assert restored["row_version"] >= orig["row_version"], (
        f"row_version regressed: expected >= {orig['row_version']}, got {restored['row_version']}"
    )

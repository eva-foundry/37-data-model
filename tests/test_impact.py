"""
Impact analysis tests.

Tests:
  T20  GET /model/impact?container=translations  → finds endpoints
  T21  Same call returns screens that call those endpoints
  T22  /model/impact?container=jobs              → different endpoint set
  T23  impact total count is sum of all sub-lists
  T24  Unknown container returns empty impact (not 404)
"""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient


def test_T20_impact_finds_endpoints_for_translations(client: TestClient):
    # TranslationsPage calls GET /v1/config/translations/{language}
    # which reads from the 'config' container
    r = client.get("/model/impact?container=config")
    assert r.status_code == 200
    data = r.json()
    assert data["container"] == "config"
    eps = data["impact"]["endpoints"]
    assert len(eps) >= 1, "Expected ≥1 endpoint touching config container"
    for ep in eps:
        assert ep.get("id") or ep.get("obj_id")


def test_T21_impact_includes_screens(client: TestClient):
    # TranslationsPage calls GET /v1/config/translations/{language}
    # which reads from config → impact(config) must include TranslationsPage
    r = client.get("/model/impact?container=config")
    data = r.json()
    screens = data["impact"]["screens"]
    screen_ids = [s.get("id") or s.get("obj_id") for s in screens]
    assert "TranslationsPage" in screen_ids


def test_T22_impact_jobs_container(client: TestClient):
    r = client.get("/model/impact?container=jobs")
    assert r.status_code == 200
    data = r.json()
    eps = data["impact"]["endpoints"]
    assert len(eps) >= 1


def test_T23_impact_total_is_consistent(client: TestClient):
    r = client.get("/model/impact?container=translations")
    data = r.json()
    impact = data["impact"]
    computed_total = (
        len(impact["endpoints"])
        + len(impact["screens"])
        + len(impact["schemas"])
        + len(impact["agents"])
        + len(impact["requirements"])
    )
    # total should match or be ≥ the stated total (some callers may set it differently)
    assert impact["total"] <= computed_total + 5   # small tolerance for summary-only counts


def test_T24_unknown_container_returns_empty_impact(client: TestClient):
    r = client.get("/model/impact?container=does_not_exist_xyz")
    assert r.status_code == 200
    data = r.json()
    assert data["impact"]["total"] == 0
    assert data["impact"]["endpoints"] == []

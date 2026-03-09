"""
Agent Guide Endpoint Tests — prevent Session 41 regression

Tests the /model/agent-guide endpoint for:
  T01  GET /model/agent-guide → 200 status
  T02  Response has required top-level keys
  T03  Layers count is 51 (50 base + 1 metadata)
  T04  Remediation framework section exists
  T05  All boolean values are Python True/False (not lowercase)
  T06  Response is valid JSON (no undefined variables)
  T07  Layer metadata integration documented
  T08  Common mistakes include Session 41 entries

Session 41 Regression Prevention:
  - Validates no lowercase 'true'/'false' in response
  - Ensures remediation_framework section is present
  - Confirms layer loading from layer-metadata-index works
"""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient


# ── T01 — endpoint returns 200 ───────────────────────────────────────────────

def test_T01_agent_guide_returns_200(client: TestClient):
    """Basic liveness: endpoint exists and returns 200."""
    r = client.get("/model/agent-guide")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:200]}"


# ── T02 — response structure ─────────────────────────────────────────────────

def test_T02_response_has_required_keys(client: TestClient):
    """Agent guide must include identity, query patterns, write cycle, etc."""
    r = client.get("/model/agent-guide")
    response = r.json()
    
    required_keys = [
        "identity",
        "golden_rule",
        "query_patterns",
        "write_cycle",
        "common_mistakes",
        "layers_available",
        "remediation_framework",  # Session 40 addition
    ]
    
    for key in required_keys:
        assert key in response, f"Missing required key: {key}. Found: {list(response.keys())}"


# ── T03 — layer count ─────────────────────────────────────────────────────────

def test_T03_layers_count_is_51(client: TestClient):
    """Verify 51 layers (50 base + 1 metadata) are loaded from layer-metadata-index."""
    r = client.get("/model/agent-guide")
    response = r.json()
    
    layers = response.get("layers_available", [])
    assert isinstance(layers, list), f"layers_available should be list, got {type(layers)}"
    assert len(layers) == 51, f"Expected 51 layers, got {len(layers)}"


# ── T04 — remediation framework ──────────────────────────────────────────────

def test_T04_remediation_framework_exists(client: TestClient):
    """Session 40 added L48-L51 remediation framework documentation."""
    r = client.get("/model/agent-guide")
    response = r.json()
    
    framework = response.get("remediation_framework")
    assert framework is not None, "remediation_framework section missing"
    assert isinstance(framework, dict), f"remediation_framework should be dict, got {type(framework)}"
    
    # Verify key subsections
    assert "overview" in framework
    assert "examples" in framework
    assert "fk_navigation" in framework
    assert "ready_for_production" in framework


# ── T05 — boolean syntax (Session 41 regression prevention) ──────────────────

def test_T05_no_lowercase_booleans(client: TestClient):
    """
    Session 41 bug: lowercase 'true' (JavaScript) used in Python dict.
    This test prevents regression by verifying response is valid Python.
    """
    r = client.get("/model/agent-guide")
    response = r.json()
    
    # If response parses as JSON, no undefined variables exist
    # The bug manifested as NameError before JSON serialization
    # So successful parsing proves fix is working
    assert response is not None
    
    # Verify specific field that had the bug in Session 41
    framework = response.get("remediation_framework", {})
    ready = framework.get("ready_for_production", {})
    
    # This field had lowercase 'true' in Session 41 (line 907)
    data_available = ready.get("data_available")
    assert data_available is True, f"Expected Python True, got {data_available} ({type(data_available)})"


# ── T06 — response is valid JSON ─────────────────────────────────────────────

def test_T06_response_is_valid_json(client: TestClient):
    """
    Verify entire response serializes to JSON without errors.
    Session 41 bug would have failed here with NameError.
    """
    r = client.get("/model/agent-guide")
    assert r.status_code == 200
    
    # TestClient automatically parses JSON; if it succeeds, response is valid
    response = r.json()
    assert isinstance(response, dict)
    assert len(response) > 10, "Response seems too small"


# ── T07 — layer metadata integration ─────────────────────────────────────────

def test_T07_layer_metadata_documented(client: TestClient):
    """Session 41 Phase 2: layer-metadata discovery patterns."""
    r = client.get("/model/agent-guide")
    response = r.json()
    
    query_patterns = response.get("query_patterns", {})
    
    # Verify layer-metadata query patterns exist
    assert "discover_layers" in query_patterns or "layer_metadata" in query_patterns
    assert "discover_operational" in query_patterns
    assert "fk_relationship_matrix" in query_patterns or "fk_matrix" in query_patterns


# ── T08 — common mistakes include Session 41 entries ─────────────────────────

def test_T08_common_mistakes_documented(client: TestClient):
    """Session 41 Phase 3: FK resolution and operational status mistakes."""
    r = client.get("/model/agent-guide")
    response = r.json()
    
    mistakes = response.get("common_mistakes", {})
    
    # Count mistakes (Session 41 added mistakes 14, 15, 16)
    mistake_count = len([k for k in mistakes.keys() if k.startswith("mistake_")])
    assert mistake_count >= 16, f"Expected ≥16 common mistakes, got {mistake_count}"
    
    # Verify Session 41 additions
    assert "mistake_14" in mistakes, "Missing mistake_14 (FK discovery)"
    assert "mistake_15" in mistakes, "Missing mistake_15 (FK resolution pattern)"
    assert "mistake_16" in mistakes, "Missing mistake_16 (operational status check)"


# ── T09 — FK navigation patterns ─────────────────────────────────────────────

def test_T09_fk_navigation_patterns(client: TestClient):
    """Session 41 Phase 3: FK navigation for L48-L51."""
    r = client.get("/model/agent-guide")
    response = r.json()
    
    framework = response.get("remediation_framework", {})
    fk_nav = framework.get("fk_navigation", {})
    
    assert "outbound_fks" in fk_nav, "Missing outbound_fks in FK navigation"
    assert "inbound_fks" in fk_nav, "Missing inbound_fks in FK navigation"
    
    # Check L48-L51 documented
    outbound = fk_nav.get("outbound_fks", {})
    assert "L48_remediation_policies" in outbound
    assert "L49_auto_fix_execution_history" in outbound
    assert "L50_remediation_outcomes" in outbound
    assert "L51_remediation_effectiveness" in outbound


# ── T10 — examples include code samples ──────────────────────────────────────

def test_T10_examples_include_code(client: TestClient):
    """Verify practical code examples exist."""
    r = client.get("/model/agent-guide")
    response = r.json()
    
    examples = response.get("examples", {})
    
    # Session 26 examples
    assert "before_after_pagination" in examples
    assert "safe_write_pattern" in examples
    
    # Verify safe_write_pattern includes code
    safe_write = examples.get("safe_write_pattern", {})
    assert "code" in safe_write, "safe_write_pattern missing code array"
    code_lines = safe_write.get("code", [])
    assert len(code_lines) >= 5, f"Expected multi-step code example, got {len(code_lines)} lines"


# ── Performance check ─────────────────────────────────────────────────────────

def test_T11_response_time_acceptable(client: TestClient):
    """Agent guide should respond quickly (< 500ms)."""
    import time
    start = time.time()
    r = client.get("/model/agent-guide")
    duration = time.time() - start
    
    assert r.status_code == 200
    assert duration < 0.5, f"Response took {duration:.2f}s (expected < 0.5s)"


# ── Caching behavior ──────────────────────────────────────────────────────────

def test_T12_not_cached(client: TestClient):
    """
    Agent guide is static content but should NOT be cached
    (changes when model evolves, must reflect current state).
    """
    # First call
    r1 = client.get("/model/agent-guide")
    assert r1.status_code == 200
    
    # Second call - should NOT have _cached=True flag
    r2 = client.get("/model/agent-guide")
    assert r2.status_code == 200
    response = r2.json()
    
    # Agent guide is dynamic (reflects current layer state)
    # So caching would be incorrect
    assert response.get("_cached") is not True, "Agent guide should not be cached"

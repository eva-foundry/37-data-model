"""
FP (Function Point) Estimate Router
GET /model/fp/estimate?project_id=...

Computes IFPUG Unadjusted Function Points (UFP) for a project directly from the
data model -- no manual data entry required. Inputs are pulled from the existing
containers and endpoints layers.

IFPUG components derived automatically:
  ILF  -- containers with data_function_type == "ILF"   (Internal Logical Files)
  EIF  -- containers with data_function_type == "EIF"   (External Interface Files)
  EI   -- endpoints with transaction_function_type == "EI"  (External Inputs)
  EO   -- endpoints with transaction_function_type == "EO"  (External Outputs)
  EQ   -- endpoints with transaction_function_type == "EQ"  (External Inquiries)

Complexity is determined by:
  - ILF/EIF: Low/Med/High based on det_count (field count of the container)
    Low:  1-19 DETs   ->  weight 7 (ILF) / 5 (EIF)
    Med:  20-50 DETs  ->  weight 10 (ILF) / 7 (EIF)
    High: 51+ DETs    ->  weight 15 (ILF) / 10 (EIF)
  - EI: Low/Med/High based on ftr_count (cosmos_writes count)
    Low:  0-1 FTRs    ->  weight 3
    Med:  2-3 FTRs    ->  weight 4
    High: 4+ FTRs     ->  weight 6
  - EO: based on ftr_count (cosmos_reads + cosmos_writes)
    Low:  0-1 FTRs    ->  weight 4
    Med:  2-3 FTRs    ->  weight 5
    High: 4+ FTRs     ->  weight 7
  - EQ: based on cosmos_reads count
    Low:  0-1          ->  weight 3
    Med:  2-3          ->  weight 4
    High: 4+           ->  weight 6

When data_function_type / transaction_function_type is null, the container/endpoint
is excluded from the count (not yet typed). Use PATCH /model/containers/{id} to
set these fields.

The result also includes:
  - unadjusted_fp (UFP)
  - story_point_estimate: UFP * 2.4  (canonical COCOMO II conversion)
  - effort_days_estimate: UFP * 0.5  (industry average: 2 FP/person-day)
  - untyped_containers / untyped_endpoints: how many were excluded (coverage signal)
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query

from api.dependencies import get_store
from api.store.base import AbstractStore

router = APIRouter(prefix="/model/fp", tags=["fp-estimator"])

# IFPUG UFP complexity weights
_ILF_WEIGHTS = {"Low": 7,  "Med": 10, "High": 15}
_EIF_WEIGHTS = {"Low": 5,  "Med": 7,  "High": 10}
_EI_WEIGHTS  = {"Low": 3,  "Med": 4,  "High": 6}
_EO_WEIGHTS  = {"Low": 4,  "Med": 5,  "High": 7}
_EQ_WEIGHTS  = {"Low": 3,  "Med": 4,  "High": 6}


def _det_complexity(det_count: int) -> str:
    if det_count >= 51:
        return "High"
    if det_count >= 20:
        return "Med"
    return "Low"


def _ftr_complexity(ftr_count: int) -> str:
    if ftr_count >= 4:
        return "High"
    if ftr_count >= 2:
        return "Med"
    return "Low"


@router.get(
    "/estimate",
    summary="Get IFPUG UFP estimate for a project (or all projects)",
    response_description="UFP breakdown, story point estimate, and effort estimate in person-days",
)
async def fp_estimate(
    project_id: str | None = Query(None, description="Filter by project id (e.g. 33-eva-brain-v2). Omit for portfolio total."),
    store: AbstractStore = Depends(get_store),
) -> dict[str, Any]:

    containers = await store.get_all("containers", active_only=True)
    endpoints  = await store.get_all("endpoints",  active_only=True)

    # Optionally restrict to a single project via service cross-reference
    # (endpoints have a .service field; containers are global -- use all of them)
    if project_id:
        # filter endpoints by service whose repo_path starts with project_id
        services = await store.get_all("services", active_only=True)
        svc_ids = {s["id"] for s in services if (s.get("repo_path") or "").startswith(project_id)}
        endpoints = [e for e in endpoints if e.get("service") in svc_ids]

    ufp = 0
    breakdown: dict[str, Any] = {
        "ILF": {"count": 0, "ufp": 0, "items": []},
        "EIF": {"count": 0, "ufp": 0, "items": []},
        "EI":  {"count": 0, "ufp": 0, "items": []},
        "EO":  {"count": 0, "ufp": 0, "items": []},
        "EQ":  {"count": 0, "ufp": 0, "items": []},
    }
    untyped_containers = 0
    untyped_endpoints  = 0

    # ── Data Function Types (ILF / EIF) ──────────────────────────────────────
    for c in containers:
        dft = c.get("data_function_type")
        if not dft:
            untyped_containers += 1
            continue
        # DETs: use det_count if set, else fall back to fields array length
        det_count = c.get("det_count") or len(c.get("fields") or [])
        complexity = _det_complexity(det_count)
        weights = _ILF_WEIGHTS if dft == "ILF" else _EIF_WEIGHTS
        fp = weights[complexity]
        ufp += fp
        breakdown[dft]["count"] += 1
        breakdown[dft]["ufp"] += fp
        breakdown[dft]["items"].append({
            "id": c["id"],
            "label": c.get("label", c["id"]),
            "det_count": det_count,
            "complexity": complexity,
            "fp": fp,
        })

    # ── Transaction Function Types (EI / EO / EQ) ────────────────────────────
    for e in endpoints:
        tft = e.get("transaction_function_type")
        if not tft:
            untyped_endpoints += 1
            continue

        # FTRs: use ftr_count if set, else derive from cosmos_reads + cosmos_writes
        reads  = e.get("cosmos_reads") or []
        writes = e.get("cosmos_writes") or []
        ftr_count = e.get("ftr_count") or len(set(reads) | set(writes))

        if tft == "EI":
            # EI complexity based on writes FTRs
            ftr_count_ei = e.get("ftr_count") or len(writes)
            complexity = _ftr_complexity(ftr_count_ei)
            fp = _EI_WEIGHTS[complexity]
        elif tft == "EO":
            complexity = _ftr_complexity(ftr_count)
            fp = _EO_WEIGHTS[complexity]
        else:  # EQ
            reads_ftr = e.get("ftr_count") or len(reads)
            complexity = _ftr_complexity(reads_ftr)
            fp = _EQ_WEIGHTS[complexity]

        ufp += fp
        breakdown[tft]["count"] += 1
        breakdown[tft]["ufp"] += fp
        breakdown[tft]["items"].append({
            "id": e["id"],
            "ftr_count": ftr_count,
            "complexity": complexity,
            "fp": fp,
        })

    # COCOMO II conversion: 1 FP ~ 2.4 story points (Scrum community average)
    story_point_estimate = round(ufp * 2.4)
    # Industry benchmark: ~2 FP / person-day (range 1-4 depending on team)
    effort_days_estimate = round(ufp * 0.5)

    total_containers = len(containers)
    total_endpoints  = len(endpoints)
    typed_containers = total_containers - untyped_containers
    typed_endpoints  = total_endpoints  - untyped_endpoints
    coverage_pct = round(
        (typed_containers + typed_endpoints) / max(1, total_containers + total_endpoints) * 100
    )

    return {
        "project_id": project_id or "all",
        "unadjusted_fp": ufp,
        "story_point_estimate": story_point_estimate,
        "effort_days_estimate": effort_days_estimate,
        "breakdown": breakdown,
        "coverage": {
            "typed_containers": typed_containers,
            "total_containers": total_containers,
            "typed_endpoints": typed_endpoints,
            "total_endpoints": total_endpoints,
            "coverage_pct": coverage_pct,
            "note": "coverage_pct < 100 means some containers/endpoints have no IFPUG type set yet. Run PUT /model/containers/{id} with data_function_type to improve accuracy.",
        },
        "methodology": "IFPUG v4.3 Unadjusted Function Points",
        "conversion_notes": [
            "story_point_estimate = UFP * 2.4 (COCOMO II, industry average)",
            "effort_days_estimate = UFP * 0.5 (2 FP/person-day benchmark)",
            "Adjust multipliers for your team's historical velocity.",
        ],
    }

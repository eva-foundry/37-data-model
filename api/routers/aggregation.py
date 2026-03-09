"""
Aggregation Router — Metrics and analytics across layers

Provides aggregated metrics, counts, and analytics for evidence, sprints, and projects.
Enables agents to get summary statistics without fetching and processing full datasets.

ENHANCEMENT 5 from AGENT-EXPERIENCE-AUDIT.md (Session 26, 2026-03-05)
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/model", tags=["aggregation"])


# ── Helper: Calculate aggregations ─────────────────────────────────────────
def _calculate_aggregations(
    objects: List[Dict[str, Any]],
    group_by: Optional[str],
    metrics: List[str]
) -> Dict[str, Any]:
    """
    Calculate aggregations on a list of objects.

    Args:
        objects: List of dictionaries to aggregate
        group_by: Field to group by (e.g., "phase", "sprint_id")
        metrics: List of metrics to calculate (e.g., ["count", "avg:coverage_percent"])

    Returns:
        Dictionary with aggregation results
    """
    if not objects:
        return {"groups": [], "total": 0}

    # If no grouping, treat all objects as one group
    if not group_by:
        groups = {"_all": objects}
    else:
        groups = {}
        for obj in objects:
            # Support nested field access (e.g., "validation.test_result")
            group_value = obj
            for key_part in group_by.split("."):
                if isinstance(group_value, dict) and key_part in group_value:
                    group_value = group_value[key_part]
                else:
                    group_value = None
                    break

            group_key = str(
                group_value) if group_value is not None else "_null"
            if group_key not in groups:
                groups[group_key] = []
            groups[group_key].append(obj)

    # Calculate metrics for each group
    results = []
    for group_key, group_objects in groups.items():
        group_result = {"group": group_key if group_key != "_all" else None}

        for metric in metrics:
            # Parse metric (e.g., "count" or "avg:coverage_percent")
            if ":" in metric:
                agg_type, field = metric.split(":", 1)
            else:
                agg_type = metric
                field = None

            if agg_type == "count":
                group_result["count"] = len(group_objects)

            elif agg_type == "avg" and field:
                # Calculate average of a numeric field
                values = []
                for obj in group_objects:
                    val = obj
                    for key_part in field.split("."):
                        if isinstance(val, dict) and key_part in val:
                            val = val[key_part]
                        else:
                            val = None
                            break
                    if val is not None:
                        try:
                            values.append(float(val))
                        except (ValueError, TypeError):
                            pass

                if values:
                    group_result[f"avg_{field.replace('.', '_')}"] = sum(
                        values) / len(values)
                else:
                    group_result[f"avg_{field.replace('.', '_')}"] = None

            elif agg_type == "sum" and field:
                # Calculate sum of a numeric field
                total = 0
                for obj in group_objects:
                    val = obj
                    for key_part in field.split("."):
                        if isinstance(val, dict) and key_part in val:
                            val = val[key_part]
                        else:
                            val = None
                            break
                    if val is not None:
                        try:
                            total += float(val)
                        except (ValueError, TypeError):
                            pass

                group_result[f"sum_{field.replace('.', '_')}"] = total

            elif agg_type == "min" and field:
                # Calculate minimum of a numeric field
                values = []
                for obj in group_objects:
                    val = obj
                    for key_part in field.split("."):
                        if isinstance(val, dict) and key_part in val:
                            val = val[key_part]
                        else:
                            val = None
                            break
                    if val is not None:
                        try:
                            values.append(float(val))
                        except (ValueError, TypeError):
                            pass

                if values:
                    group_result[f"min_{field.replace('.', '_')}"] = min(
                        values)
                else:
                    group_result[f"min_{field.replace('.', '_')}"] = None

            elif agg_type == "max" and field:
                # Calculate maximum of a numeric field
                values = []
                for obj in group_objects:
                    val = obj
                    for key_part in field.split("."):
                        if isinstance(val, dict) and key_part in val:
                            val = val[key_part]
                        else:
                            val = None
                            break
                    if val is not None:
                        try:
                            values.append(float(val))
                        except (ValueError, TypeError):
                            pass

                if values:
                    group_result[f"max_{field.replace('.', '_')}"] = max(
                        values)
                else:
                    group_result[f"max_{field.replace('.', '_')}"] = None

        results.append(group_result)

    return {
        "groups": results,
        "total": len(objects),
        "group_by": group_by,
        "metrics": metrics
    }


# ── GET /model/evidence/aggregate ──────────────────────────────────────────
@router.get(
    "/evidence/aggregate",
    summary="Aggregate evidence metrics",
    description="Calculate aggregated metrics across evidence objects with grouping"
)
async def aggregate_evidence(
    request: Request,
    sprint_id: Optional[str] = Query(None, description="Filter by sprint_id"),
    story_id: Optional[str] = Query(None, description="Filter by story_id"),
    phase: Optional[str] = Query(None, description="Filter by phase (D1, D2, P, D3, A)"),
    group_by: Optional[str] = Query(None, description="Field to group by (e.g., 'phase', 'story_id')"),
    metrics: str = Query("count", description="Comma-separated metrics (count, avg:field, sum:field, min:field, max:field)")
):
    """
    Aggregate evidence metrics with optional filtering and grouping.

    Examples:
        GET /model/evidence/aggregate?sprint_id=ACA-S11&group_by=phase&metrics=count
        GET /model/evidence/aggregate?group_by=sprint_id&metrics=count,avg:metrics.duration_ms
        GET /model/evidence/aggregate?phase=D3&group_by=story_id&metrics=count
    """
    store = request.app.state.store

    try:
        # Fetch all evidence objects
        evidence_objects = await store.get_all("evidence")

        # Apply filters
        if sprint_id:
            evidence_objects = [
                e for e in evidence_objects if e.get("sprint_id") == sprint_id]
        if story_id:
            evidence_objects = [
                e for e in evidence_objects if e.get("story_id") == story_id]
        if phase:
            evidence_objects = [
                e for e in evidence_objects if e.get("phase") == phase]

        # Parse metrics
        metric_list = [m.strip() for m in metrics.split(",")]

        # Calculate aggregations
        results = _calculate_aggregations(
            evidence_objects, group_by, metric_list)

        return JSONResponse(content=results)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to aggregate evidence", "reason": str(e)}
        )


# ── GET /model/sprints/{id}/metrics ────────────────────────────────────────
@router.get(
    "/sprints/{sprint_id}/metrics",
    summary="Get sprint metrics",
    description="Calculate aggregated evidence metrics for a specific sprint"
)
async def get_sprint_metrics(sprint_id: str, request: Request):
    """
    Get comprehensive metrics for a sprint by aggregating its evidence.

    Returns:
        - Total stories completed
        - Evidence counts by phase (D1, D2, P, D3, A)
        - Average coverage percentage (if available)
        - Test results breakdown (PASS/FAIL)
        - Duration metrics

    Example:
        GET /model/sprints/ACA-S11/metrics → {phases: {D1: 14, D2: 14, P: 14, D3: 14, A: 6}, ...}
    """
    store = request.app.state.store

    try:
        # Fetch sprint object
        sprint = await store.get_one("sprints", sprint_id)
        if not sprint:
            raise HTTPException(
                status_code=404,
                detail={"error": "Sprint not found", "sprint_id": sprint_id}
            )

        # Fetch all evidence for this sprint
        evidence_objects = await store.get_all("evidence")
        sprint_evidence = [
            e for e in evidence_objects if e.get("sprint_id") == sprint_id]

        if not sprint_evidence:
            return JSONResponse(content={
                "sprint_id": sprint_id,
                "total_evidence": 0,
                "phases": {},
                "message": "No evidence found for this sprint"
            })

        # Calculate metrics
        by_phase = {}
        for phase in ["D1", "D2", "P", "D3", "A"]:
            by_phase[phase] = len(
                [e for e in sprint_evidence if e.get("phase") == phase])

        # Calculate story count (unique story_ids)
        unique_stories = set(e.get("story_id")
                             for e in sprint_evidence if e.get("story_id"))

        # Calculate test results breakdown
        test_results = {}
        for ev in sprint_evidence:
            validation = ev.get("validation", {})
            result = validation.get("test_result")
            if result:
                test_results[result] = test_results.get(result, 0) + 1

        # Calculate average coverage if available
        coverage_values = []
        for ev in sprint_evidence:
            metrics = ev.get("metrics", {})
            coverage = metrics.get("coverage_percent")
            if coverage is not None:
                try:
                    coverage_values.append(float(coverage))
                except (ValueError, TypeError):
                    pass

        avg_coverage = sum(coverage_values) / \
            len(coverage_values) if coverage_values else None

        # Calculate duration metrics
        duration_values = []
        for ev in sprint_evidence:
            metrics = ev.get("metrics", {})
            duration = metrics.get("duration_ms")
            if duration is not None:
                try:
                    duration_values.append(float(duration))
                except (ValueError, TypeError):
                    pass

        avg_duration = sum(duration_values) / \
            len(duration_values) if duration_values else None
        total_duration = sum(duration_values) if duration_values else None

        return JSONResponse(
            content={
                "sprint_id": sprint_id,
                "sprint_label": sprint.get("label"),
                "total_evidence": len(sprint_evidence),
                "unique_stories": len(unique_stories),
                "phases": by_phase,
                "test_results": test_results,
                "coverage": {
                    "average_percent": round(
                        avg_coverage,
                        2) if avg_coverage else None,
                    "samples": len(coverage_values)},
                "duration": {
                    "average_ms": round(
                        avg_duration,
                        2) if avg_duration else None,
                    "total_ms": round(
                        total_duration,
                        2) if total_duration else None,
                    "samples": len(duration_values)}})

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to calculate sprint metrics",
                "reason": str(e)})


# ── GET /model/projects/{id}/metrics/trend ─────────────────────────────────
@router.get(
    "/projects/{project_id}/metrics/trend",
    summary="Get project metrics trend across sprints",
    description="Calculate metrics trend across multiple sprints for a project"
)
async def get_project_metrics_trend(project_id: str, request: Request):
    """
    Get metrics trend for a project across all its sprints.

    Returns sprint-by-sprint breakdown of:
        - Evidence counts by phase
        - Story completion
        - Test results
        - Coverage trends

    Example:
        GET /model/projects/51-ACA/metrics/trend → [{sprint: "ACA-S10", evidence: 62, ...}, ...]
    """
    store = request.app.state.store

    try:
        # Fetch project
        project = await store.get_one("projects", project_id)
        if not project:
            raise HTTPException(
                status_code=404,
                detail={"error": "Project not found", "project_id": project_id}
            )

        # Fetch all sprints for this project
        all_sprints = await store.get_all("sprints")
        project_sprints = [
            s for s in all_sprints if s.get(
                "id", "").startswith(project_id)]

        if not project_sprints:
            return JSONResponse(content={
                "project_id": project_id,
                "project_label": project.get("label"),
                "sprints": [],
                "message": "No sprints found for this project"
            })

        # Sort sprints by id
        project_sprints.sort(key=lambda s: s.get("id", ""))

        # Fetch all evidence
        all_evidence = await store.get_all("evidence")

        # Calculate metrics for each sprint
        trend_data = []
        for sprint in project_sprints:
            sprint_id = sprint.get("id")
            sprint_evidence = [
                e for e in all_evidence if e.get("sprint_id") == sprint_id]

            # Phase breakdown
            by_phase = {}
            for phase in ["D1", "D2", "P", "D3", "A"]:
                by_phase[phase] = len(
                    [e for e in sprint_evidence if e.get("phase") == phase])

            # Unique stories
            unique_stories = len(set(e.get("story_id")
                                 for e in sprint_evidence if e.get("story_id")))

            trend_data.append({
                "sprint_id": sprint_id,
                "sprint_label": sprint.get("label"),
                "total_evidence": len(sprint_evidence),
                "unique_stories": unique_stories,
                "phases": by_phase
            })

        return JSONResponse(content={
            "project_id": project_id,
            "project_label": project.get("label"),
            "sprint_count": len(project_sprints),
            "sprints": trend_data
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to calculate project trend",
                "reason": str(e)})

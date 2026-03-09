"""
Foreign Key Validation Module

Provides enhanced FK validation capabilities:
- Cascade impact analysis (what breaks if I delete this?)
- Enhanced orphan detection with severity levels
- Reverse reference lookup (who references me?)

Session 41 Part 7 - Priority 3
"""

from typing import Dict, List, Set, Any, Tuple
import logging

logger = logging.getLogger(__name__)

# ── FK RELATIONSHIP MAPPING ───────────────────────────────────────────────────

# Maps: (child_layer, field_name) → parent_layer
# Represents "child_layer.field_name references parent_layer"

FK_RELATIONSHIPS: List[Tuple[str, str, str]] = [
    # (child_layer, field_name, parent_layer)
    ("endpoints", "cosmos_reads", "containers"),      # array field
    ("endpoints", "cosmos_writes", "containers"),     # array field
    ("endpoints", "feature_flag", "feature_flags"),   # single field
    ("endpoints", "auth", "personas"),                # array field
    ("screens", "api_calls", "endpoints"),            # array field
    ("literals", "screens", "screens"),               # array field
    ("requirements", "satisfied_by", "endpoints"),    # array field (combined check below)
    ("requirements", "satisfied_by", "screens"),      # array field (combined check)
    ("agents", "output_screens", "screens"),          # array field
]


def get_field_type(layer: str, field: str) -> str:
    """Determine if a field is 'array' or 'single' based on FK relationships."""
    if field == "feature_flag":
        return "single"
    return "array"


def build_reverse_index(
    layers_data: Dict[str, List[dict]]
) -> Dict[Tuple[str, str], List[Tuple[str, str, str]]]:
    """
    Build reverse index for FK lookups.
    
    Returns a mapping:
        (parent_layer, parent_id) → [(child_layer, child_id, field_name), ...]
    
    This enables O(1) cascade impact lookups.
    
    Example:
        ("screens", "S001") → [
            ("literals", "L001", "screens"),
            ("literals", "L002", "screens"),
            ("agents", "A001", "output_screens")
        ]
    """
    reverse_index: Dict[Tuple[str, str], List[Tuple[str, str, str]]] = {}
    
    for child_layer, field_name, parent_layer in FK_RELATIONSHIPS:
        if child_layer not in layers_data:
            continue
        
        field_type = get_field_type(child_layer, field_name)
        
        for child_obj in layers_data[child_layer]:
            child_id = str(child_obj.get("id") or child_obj.get("obj_id") or "")
            if not child_id:
                continue
            
            if field_type == "single":
                # Single FK reference
                parent_id = child_obj.get(field_name)
                if parent_id:
                    key = (parent_layer, str(parent_id))
                    if key not in reverse_index:
                        reverse_index[key] = []
                    reverse_index[key].append((child_layer, child_id, field_name))
            else:
                # Array FK reference
                parent_ids = child_obj.get(field_name) or []
                for parent_id in parent_ids:
                    if parent_id:
                        key = (parent_layer, str(parent_id))
                        if key not in reverse_index:
                            reverse_index[key] = []
                        reverse_index[key].append((child_layer, child_id, field_name))
    
    logger.info("Reverse index built: %d parent objects have references", len(reverse_index))
    return reverse_index


def cascade_impact_check(
    target_layer: str,
    target_id: str,
    layers_data: Dict[str, List[dict]],
    reverse_index: Dict[Tuple[str, str], List[Tuple[str, str, str]]]
) -> Dict[str, Any]:
    """
    Perform cascade impact analysis for a target object.
    
    Returns detailed information about all references to the target,
    including whether it's safe to delete.
    """
    # Check if target exists
    target_exists = False
    target_is_active = False
    
    if target_layer in layers_data:
        for obj in layers_data[target_layer]:
            obj_id = str(obj.get("id") or obj.get("obj_id") or "")
            if obj_id == target_id:
                target_exists = True
                target_is_active = obj.get("is_active", True)
                break
    
    if not target_exists:
        return {
            "error": "Target object not found",
            "target": {
                "layer": target_layer,
                "id": target_id,
                "exists": False
            },
            "message": "Cannot perform cascade check on non-existent object"
        }
    
    # Look up references in reverse index
    key = (target_layer, target_id)
    references_list = reverse_index.get(key, [])
    
    # Group references by layer and field
    references_grouped: Dict[str, Dict[str, Any]] = {}
    
    for child_layer, child_id, field_name in references_list:
        # Get child object details
        child_obj = None
        if child_layer in layers_data:
            for obj in layers_data[child_layer]:
                obj_id = str(obj.get("id") or obj.get("obj_id") or "")
                if obj_id == child_id:
                    child_obj = obj
                    break
        
        if not child_obj:
            continue
        
        key_name = f"{child_layer}:{field_name}"
        if key_name not in references_grouped:
            references_grouped[key_name] = {
                "layer": child_layer,
                "field": field_name,
                "referencing_objects": [],
                "count": 0
            }
        
        references_grouped[key_name]["referencing_objects"].append({
            "id": child_id,
            "is_active": child_obj.get("is_active", True)
        })
        references_grouped[key_name]["count"] += 1
    
    # Convert grouped dict to sorted list
    references = sorted(references_grouped.values(), key=lambda x: (x["layer"], x["field"]))
    
    total_references = sum(r["count"] for r in references)
    safe_to_delete = total_references == 0
    
    # Build remediation guidance
    remediation = []
    if not safe_to_delete:
        for ref in references:
            obj_ids = [obj["id"] for obj in ref["referencing_objects"]]
            obj_ids_str = ", ".join(obj_ids[:5])  # Show first 5
            if len(obj_ids) > 5:
                obj_ids_str += f", ... ({len(obj_ids) - 5} more)"
            
            remediation.append(
                f"Remove {target_id} from {ref['layer']} {obj_ids_str} (field: {ref['field']})"
            )
    
    result = {
        "target": {
            "layer": target_layer,
            "id": target_id,
            "exists": target_exists,
            "is_active": target_is_active
        },
        "references": references,
        "total_references": total_references,
        "safe_to_delete": safe_to_delete
    }
    
    if safe_to_delete:
        result["message"] = "No objects reference this target. Safe to delete."
    else:
        result["warning"] = (
            f"Deleting this object would create {total_references} orphaned reference(s) "
            f"across {len(references)} field(s)"
        )
        result["remediation"] = remediation
    
    return result


def enhanced_validate(
    layers_data: Dict[str, List[dict]]
) -> Dict[str, Any]:
    """
    Enhanced FK validation with severity levels and detailed categorization.
    
    Returns both legacy violations array (backward compatible) and
    new enhanced structure with severity, layer grouping, and remediation.
    """
    violations: List[str] = []
    violations_by_layer: Dict[str, Dict[str, Any]] = {}
    
    def _ids(layer_data: List[dict]) -> Set[str]:
        return {str(d.get("id") or d.get("obj_id") or "")
                for d in layer_data if d}
    
    def _add_violation(
        child_layer: str,
        child_id: str,
        field: str,
        invalid_ref: str,
        target_layer: str,
        severity: str,
        message: str,
        remediation: str
    ):
        # Add to legacy violations array
        violations.append(f"{child_layer} '{child_id}' {field} references unknown {target_layer} '{invalid_ref}'")
        
        # Add to enhanced structure
        if child_layer not in violations_by_layer:
            violations_by_layer[child_layer] = {
                "count": 0,
                "violations": []
            }
        
        violations_by_layer[child_layer]["violations"].append({
            "id": child_id,
            "field": field,
            "invalid_reference": invalid_ref,
            "target_layer": target_layer,
            "severity": severity,
            "message": message,
            "remediation": remediation
        })
        violations_by_layer[child_layer]["count"] += 1
    
    # Build ID sets for each layer
    id_sets: Dict[str, Set[str]] = {}
    active_id_sets: Dict[str, Set[str]] = {}
    
    for layer_name, objects in layers_data.items():
        id_sets[layer_name] = _ids(objects)
        active_id_sets[layer_name] = {
            str(obj.get("id") or obj.get("obj_id") or "")
            for obj in objects
            if obj.get("is_active", True)
        }
    
    # Validate each FK relationship
    for child_layer, field_name, parent_layer in FK_RELATIONSHIPS:
        if child_layer not in layers_data or parent_layer not in layers_data:
            continue
        
        field_type = get_field_type(child_layer, field_name)
        
        for child_obj in layers_data[child_layer]:
            child_id = str(child_obj.get("id") or child_obj.get("obj_id") or "")
            if not child_id:
                continue
            
            if field_type == "single":
                # Single FK reference
                ref_id = child_obj.get(field_name)
                if not ref_id:
                    continue
                
                ref_id_str = str(ref_id)
                
                if ref_id_str not in id_sets.get(parent_layer, set()):
                    # Critical: completely non-existent
                    _add_violation(
                        child_layer, child_id, field_name, ref_id_str, parent_layer,
                        "critical",
                        f"References non-existent {parent_layer} '{ref_id_str}'",
                        f"Remove or correct {field_name} reference in {child_id}, or create {parent_layer} '{ref_id_str}'"
                    )
                elif ref_id_str not in active_id_sets.get(parent_layer, set()):
                    # Warning: references soft-deleted object
                    _add_violation(
                        child_layer, child_id, field_name, ref_id_str, parent_layer,
                        "warning",
                        f"References soft-deleted {parent_layer} '{ref_id_str}'",
                        f"Update {field_name} in {child_id} to null, or reactivate {parent_layer} '{ref_id_str}'"
                    )
            else:
                # Array FK reference
                ref_ids = child_obj.get(field_name) or []
                for ref_id in ref_ids:
                    if not ref_id:
                        continue
                    
                    ref_id_str = str(ref_id)
                    
                    if ref_id_str not in id_sets.get(parent_layer, set()):
                        # Critical: completely non-existent
                        _add_violation(
                            child_layer, child_id, field_name, ref_id_str, parent_layer,
                            "critical",
                            f"References non-existent {parent_layer} '{ref_id_str}'",
                            f"Remove '{ref_id_str}' from {field_name} array in {child_id}, or create {parent_layer} '{ref_id_str}'"
                        )
                    elif ref_id_str not in active_id_sets.get(parent_layer, set()):
                        # Warning: references soft-deleted object
                        _add_violation(
                            child_layer, child_id, field_name, ref_id_str, parent_layer,
                            "warning",
                            f"References soft-deleted {parent_layer} '{ref_id_str}'",
                            f"Remove '{ref_id_str}' from {field_name} array in {child_id}, or reactivate {parent_layer} '{ref_id_str}'"
                        )
    
    # Build summary
    critical_count = sum(
        1 for layer_data in violations_by_layer.values()
        for v in layer_data["violations"]
        if v["severity"] == "critical"
    )
    warning_count = sum(
        1 for layer_data in violations_by_layer.values()
        for v in layer_data["violations"]
        if v["severity"] == "warning"
    )
    
    records_affected = sum(
        len(set(v["id"] for v in layer_data["violations"]))
        for layer_data in violations_by_layer.values()
    )
    
    status = "PASS" if len(violations) == 0 else "FAIL"
    
    return {
        "status": status,
        "summary": {
            "total_violations": len(violations),
            "critical": critical_count,
            "warning": warning_count,
            "layers_affected": len(violations_by_layer),
            "records_affected": records_affected
        },
        "violations_by_layer": violations_by_layer if violations else {},
        "violations": violations,  # Backward compatible
        "legacy_format_note": "violations array maintained for backward compatibility"
    }


def reverse_reference_lookup(
    target_layer: str,
    target_id: str,
    layers_data: Dict[str, List[dict]],
    reverse_index: Dict[Tuple[str, str], List[Tuple[str, str, str]]]
) -> Dict[str, Any]:
    """
    Lookup all objects that reference a specific target.
    
    Similar to cascade_impact_check but focused on usage patterns
    rather than deletion safety.
    """
    # Check if target exists
    target_exists = False
    target_is_active = False
    
    if target_layer in layers_data:
        for obj in layers_data[target_layer]:
            obj_id = str(obj.get("id") or obj.get("obj_id") or "")
            if obj_id == target_id:
                target_exists = True
                target_is_active = obj.get("is_active", True)
                break
    
    if not target_exists:
        return {
            "error": "Target object not found",
            "target": {
                "layer": target_layer,
                "id": target_id,
                "exists": False
            },
            "message": "Cannot lookup references for non-existent object"
        }
    
    # Look up references
    key = (target_layer, target_id)
    references_list = reverse_index.get(key, [])
    
    # Group by (layer, field) combination
    referenced_by: Dict[str, Dict[str, Any]] = {}
    
    for child_layer, child_id, field_name in references_list:
        # Get child object details
        child_obj = None
        if child_layer in layers_data:
            for obj in layers_data[child_layer]:
                obj_id = str(obj.get("id") or obj.get("obj_id") or "")
                if obj_id == child_id:
                    child_obj = obj
                    break
        
        if not child_obj:
            continue
        
        # Use separate keys for same layer with different fields
        key_name = f"{child_layer}_{field_name}"
        if key_name not in referenced_by:
            referenced_by[key_name] = {
                "field": field_name,
                "references": [],
                "count": 0
            }
        
        referenced_by[key_name]["references"].append({
            "id": child_id,
            "is_active": child_obj.get("is_active", True)
        })
        referenced_by[key_name]["count"] += 1
    
    # Build usage summary
    total_references = sum(r["count"] for r in referenced_by.values())
    
    if total_references == 0:
        usage_summary = "No active references found. Safe to permanently delete."
    else:
        usage_parts = []
        for key_name, data in referenced_by.items():
            layer_name = key_name.rsplit("_", 1)[0]  # Extract layer from key
            usage_parts.append(f"{data['count']} {layer_name} via {data['field']}")
        usage_summary = f"Referenced by: {', '.join(usage_parts)}"
    
    return {
        "target": {
            "layer": target_layer,
            "id": target_id,
            "exists": target_exists,
            "is_active": target_is_active
        },
        "referenced_by": referenced_by,
        "total_references": total_references,
        "usage_summary": usage_summary
    }

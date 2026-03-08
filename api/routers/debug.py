"""
Debug endpoint for agent-guide 500 error investigation
Session 41 - Phase 3 Fix
"""
from fastapi import APIRouter
import traceback

router = APIRouter(prefix="/debug", tags=["debug"])

@router.get("/agent-guide-test")
async def test_agent_guide():
    """
    Debug version of agent-guide with explicit error handling.
    Returns detailed error information if the endpoint fails.
    """
    try:
        # Attempt to load layers exactly as agent_guide() does
        from api.routers.metadata import _load_metadata_index
        
        result = {
            "test": "agent-guide layer loading",
            "status": "attempting"
        }
        
        # Step 1: Load metadata index
        try:
            layer_metadata_index = _load_metadata_index()
            result["step1_load_metadata"] = "[PASS]"
            result["layers_count"] = len(layer_metadata_index.get("layers", []))
        except Exception as e:
            result["step1_load_metadata"] = f"[FAIL] {str(e)}"
            result["step1_traceback"] = traceback.format_exc()
            return result
        
        # Step 2: Extract layer names
        try:
            layers = [entry["layer_name"] for entry in layer_metadata_index["layers"]]
            result["step2_extract_names"] = "[PASS]"
            result["first_3_layers"] = layers[:3]
            result["layers_list_length"] = len(layers)
        except Exception as e:
            result["step2_extract_names"] = f"[FAIL] {str(e)}"
            result["step2_traceback"] = traceback.format_exc()
            return result
        
        # Step 3: Build response structure (simplified)
        try:
            response = {
                "identity": {
                    "service": "EVA Data Model API",
                    "description": "Test version"
                },
                "layers_available": layers,
                "remediation_framework": {
                    "overview": "L48-L51 automated remediation",
                    "description": "4-layer framework",
                    "test": "This is a test to see if remediation_framework works"
                }
            }
            result["step3_build_response"] = "[PASS]"
            result["response_keys"] = list(response.keys())
            result["has_remediation_framework"] = "remediation_framework" in response
        except Exception as e:
            result["step3_build_response"] = f"[FAIL] {str(e)}"
            result["step3_traceback"] = traceback.format_exc()
            return result
        
        result["status"] = "[PASS] All steps succeeded"
        result["final_response_sample"] = {
            "layers_count": len(response.get("layers_available", [])),
            "has_remediation": "remediation_framework" in response
        }
        
        return result
        
    except Exception as e:
        return {
            "test": "agent-guide layer loading",
            "status": "[FAIL] Unexpected error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }

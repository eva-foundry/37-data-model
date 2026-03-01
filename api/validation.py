# EVA-STORY: F37-FK-001
import os
import requests
from typing import List, Tuple

class ValidationResult:
    def __init__(self, valid: bool, errors: List[str]):
        self.valid = valid
        self.errors = errors

def validate_endpoint_references(calls_endpoints: List[str], reads_containers: List[str], writes_containers: List[str]) -> ValidationResult:
    """
    Validates endpoint and container references against the data model API.

    Args:
        calls_endpoints (List[str]): List of endpoint IDs to validate.
        reads_containers (List[str]): List of container names for read operations to validate.
        writes_containers (List[str]): List of container names for write operations to validate.

    Returns:
        ValidationResult: Object containing validation status and error messages.
    """
    data_model_url = os.getenv("DATA_MODEL_URL")
    if not data_model_url:
        raise EnvironmentError("[FAIL] DATA_MODEL_URL environment variable is not set.")

    try:
        # Fetch valid endpoint IDs
        response = requests.get(f"{data_model_url}/model/endpoints/")
        response.raise_for_status()
        valid_endpoints = {endpoint["id"] for endpoint in response.json()}

        # Fetch valid container names
        response = requests.get(f"{data_model_url}/model/containers/")
        response.raise_for_status()
        valid_containers = {container["name"] for container in response.json()}

    except requests.RequestException as e:
        error_message = f"[FAIL] Failed to fetch data from model API: {str(e)}"
        return ValidationResult(valid=False, errors=[error_message])

    errors = []

    # Validate calls_endpoints
    for endpoint in calls_endpoints:
        if endpoint not in valid_endpoints:
            errors.append(f"Invalid endpoint: {endpoint} - not found in endpoints layer")

    # Validate reads_containers
    for container in reads_containers:
        if container not in valid_containers:
            errors.append(f"Invalid read container: {container} - not found in containers layer")

    # Validate writes_containers
    for container in writes_containers:
        if container not in valid_containers:
            errors.append(f"Invalid write container: {container} - not found in containers layer")

    return ValidationResult(valid=(len(errors) == 0), errors=errors)

# Example usage
if __name__ == "__main__":
    # Example data
    calls_endpoints = ["GET /v1/example", "POST /v1/unknown"]
    reads_containers = ["valid_container", "invalid_container"]
    writes_containers = ["another_valid_container", "nonexistent_container"]

    # Perform validation
    result = validate_endpoint_references(calls_endpoints, reads_containers, writes_containers)

    if result.valid:
        print("[PASS] All references are valid.")
    else:
        print("[FAIL] Validation errors found:")
        for error in result.errors:
            print(f"- {error}")

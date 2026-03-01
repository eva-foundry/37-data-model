# EVA-STORY: F37-FK-003
import os
import csv
import argparse
import requests

def fetch_data_model_layer(layer_name):
    """
    Fetches data from the specified layer in the data model API.

    Args:
        layer_name (str): The name of the layer to fetch.

    Returns:
        list: A list of objects from the specified layer.
    """
    data_model_url = os.getenv("DATA_MODEL_URL", "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io")
    try:
        response = requests.get(f"{data_model_url}/model/{layer_name}/")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"[FAIL] Failed to fetch {layer_name} from model API: {str(e)}")
        return []

def validate_references():
    """
    Validates foreign key references across all layers and generates a report.

    Returns:
        list: A list of validation errors.
    """
    errors = []

    # Fetch all necessary data from the model API
    endpoints = fetch_data_model_layer("endpoints")
    screens = fetch_data_model_layer("screens")
    containers = fetch_data_model_layer("containers")

    valid_endpoints = {f"{ep['method']} {ep['path']}" for ep in endpoints}
    valid_containers = {container["name"] for container in containers}

    # Validate endpoints
    for endpoint in endpoints:
        obj_id = endpoint["id"]
        for field, references in {"calls_endpoints": endpoint.get("calls_endpoints", []),
                                  "reads_containers": endpoint.get("reads_containers", []),
                                  "writes_containers": endpoint.get("writes_containers", [])}.items():
            for ref in references:
                if field == "calls_endpoints" and ref not in valid_endpoints:
                    errors.append({"object_id": obj_id, "layer": "endpoints", "field": field, "invalid_ref": ref, "target_layer": "endpoints"})
                elif field in ["reads_containers", "writes_containers"] and ref not in valid_containers:
                    errors.append({"object_id": obj_id, "layer": "endpoints", "field": field, "invalid_ref": ref, "target_layer": "containers"})

    # Validate screens
    for screen in screens:
        obj_id = screen["id"]
        for api_call in screen.get("api_calls", []):
            if api_call not in valid_endpoints:
                errors.append({"object_id": obj_id, "layer": "screens", "field": "api_calls", "invalid_ref": api_call, "target_layer": "endpoints"})

    return errors

def write_report(errors, output_file):
    """
    Writes validation errors to a CSV file.

    Args:
        errors (list): List of validation errors.
        output_file (str): Path to the output CSV file.
    """
    with open(output_file, mode="w", newline="", encoding="ascii") as csvfile:
        fieldnames = ["object_id", "layer", "field", "invalid_ref", "target_layer"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for error in errors:
            writer.writerow(error)

def fix_references(errors):
    """
    Removes invalid references from the data model.

    Args:
        errors (list): List of validation errors.
    """
    data_model_url = os.getenv("DATA_MODEL_URL", "https://marco-eva-data-model.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io")

    for error in errors:
        obj_id = error["object_id"]
        layer = error["layer"]
        field = error["field"]
        invalid_ref = error["invalid_ref"]

        # Fetch the current object
        try:
            response = requests.get(f"{data_model_url}/model/{layer}/{obj_id}")
            response.raise_for_status()
            obj = response.json()
        except requests.RequestException as e:
            print(f"[FAIL] Failed to fetch object {obj_id} from layer {layer}: {str(e)}")
            continue

        # Remove the invalid reference
        if field in obj and invalid_ref in obj[field]:
            obj[field].remove(invalid_ref)

        # Update the object in the data model
        try:
            response = requests.put(f"{data_model_url}/model/{layer}/{obj_id}", json=obj)
            response.raise_for_status()
            print(f"[INFO] Fixed invalid reference in {layer}/{obj_id}: {field} -> {invalid_ref}")
        except requests.RequestException as e:
            print(f"[FAIL] Failed to update object {obj_id} in layer {layer}: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description="Validate and optionally fix foreign key references in the data model.")
    parser.add_argument("--fix", action="store_true", help="Fix invalid references in the data model.")
    args = parser.parse_args()

    print("[INFO] Starting validation of foreign key references...")
    errors = validate_references()

    if errors:
        print(f"[WARN] Validation completed with {len(errors)} violations found.")
        write_report(errors, "validation-report.csv")
        print("[INFO] Validation report written to validation-report.csv")

        if args.fix:
            print("[INFO] Fixing invalid references...")
            fix_references(errors)
            print("[INFO] Invalid references have been fixed.")
    else:
        print("[PASS] No validation errors found.")

if __name__ == "__main__":
    main()

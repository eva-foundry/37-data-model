<!-- SPRINT_MANIFEST
{
  "sprint_id": "SPRINT-00",
  "sprint_title": "phase0-validation",
  "target_branch": "sprint/00-phase0-validation",
  "epic": "F37-FK",
  "stories": [
    {
      "id": "F37-FK-001",
      "title": "Implement string-array validator",
      "wbs": "FK.0.1",
      "size": "M",
      "model": "gpt-4o",
      "model_rationale": "Medium complexity validation logic requiring structured error handling and data model API queries",
      "epic": "Epic FK -- FK Enhancement",
      "files_to_create": [
        "api/validation.py"
      ],
      "acceptance": [
        "Validator rejects invalid endpoint/container references",
        "validate_endpoint_references() function returns ValidationResult(valid: bool, errors: list[str])",
        "Function queries /model/endpoints/ and /model/containers/ for valid IDs",
        "Validates fields: calls_endpoints, reads_containers, writes_containers"
      ],
      "implementation_notes": "Create api/validation.py with validate_endpoint_references() function. Query data model API at /model/endpoints/ and /model/containers/ to get lists of valid IDs. For each reference in fields like calls_endpoints (endpoint IDs) or reads_containers/writes_containers (container names), verify it exists in the corresponding layer. Return ValidationResult(valid, errors) where errors is a list of specific error messages like 'Invalid endpoint: GET /v1/unknown - not found in endpoints layer'. Use requests library to call DATA_MODEL_URL from environment variable. Pattern: valid_endpoints = requests.get(f'{DATA_MODEL_URL}/model/endpoints/').json(); valid_containers = requests.get(f'{DATA_MODEL_URL}/model/containers/').json(). Then check if each reference exists in the ID lists."
    },
    {
      "id": "F37-FK-002",
      "title": "Integrate validator into PUT routers",
      "wbs": "FK.0.2",
      "size": "XS",
      "model": "gpt-4o-mini",
      "model_rationale": "Simple integration task - calling existing validator function and returning 422 on validation failure",
      "epic": "Epic FK -- FK Enhancement",
      "files_to_create": [
        "api/routers/endpoints.py",
        "api/routers/screens.py"
      ],
      "acceptance": [
        "PUT with invalid reference returns 422 Unprocessable Entity",
        "Response includes detailed error list from validator",
        "Validation runs before storing object in data model",
        "Both endpoint and screen PUT routes call validator"
      ],
      "implementation_notes": "Import validate_endpoint_references from api.validation in both router files. In PUT endpoint handler (api/routers/endpoints.py), before calling store.put(), run validation on the payload. If payload contains calls_endpoints, reads_containers, or writes_containers fields, call validator. If validation fails (valid=False), return HTTPException(status_code=422, detail={'errors': result.errors}). Same pattern for screens.py - validate api_calls field before storing. Do not modify existing business logic, just add validation check before the store operation."
    },
    {
      "id": "F37-FK-003",
      "title": "Backfill validation + reporting",
      "wbs": "FK.0.3",
      "size": "M",
      "model": "gpt-4o",
      "model_rationale": "Medium complexity script requiring comprehensive scanning of all layers and detailed CSV reporting",
      "epic": "Epic FK -- FK Enhancement",
      "files_to_create": [
        "scripts/validate-all-refs.py"
      ],
      "acceptance": [
        "Script scans all 187 endpoints + 50 screens for invalid cross-references",
        "CSV report with columns: object_id, layer, field, invalid_ref, target_layer",
        "Dry-run by default, --fix flag to remove invalid references",
        "Script identifies all existing violations before Phase 1A starts"
      ],
      "implementation_notes": "Create scripts/validate-all-refs.py. Query data model API for all endpoints (/model/endpoints/) and all screens (/model/screens/). For each endpoint, validate calls_endpoints, reads_containers, writes_containers fields using the same logic as F37-FK-001 validator. For each screen, validate api_calls field. Collect all validation errors into a list of dicts: [{object_id, layer, field, invalid_ref, target_layer}]. Write to CSV file 'validation-report.csv'. Add argparse --fix flag (default False). If --fix=True, remove invalid references and PUT updated objects back to data model. If --fix=False, just report violations. Use DATA_MODEL_URL environment variable (default marco-eva-data-model ACA endpoint). Print summary: Total objects scanned, total violations found, violations by layer."
    }
  ]
}
-->

# SPRINT-00 -- phase0-validation

Generated: 2026-03-01
Story IDs are canonical Veritas IDs from veritas-plan.json.
EVA-STORY tags in source files must use these exact IDs.

## Stories

| ID | Title | WBS | Size |
|----|-------|-----|------|
| F37-FK-001 | Implement string-array validator | FK.0.1 | M |
| F37-FK-002 | Integrate validator into PUT routers | FK.0.2 | M |
| F37-FK-003 | Backfill validation + reporting | FK.0.3 | M |

## Execution Order

1. `F37-FK-001` -- Implement string-array validator
2. `F37-FK-002` -- Integrate validator into PUT routers
3. `F37-FK-003` -- Backfill validation + reporting

## Notes

- All story IDs verified against .eva/veritas-plan.json
- Fill in TODO fields before creating the GitHub issue
- Create issue with: gh issue create --repo eva-foundry/37-data-model --title "[SPRINT-00] phase0-validation" --body-file .github/sprints/sprint-00-phase0-validation.md --label "sprint-task"

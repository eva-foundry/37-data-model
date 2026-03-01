# EVA-STORY: F37-FK-002
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from api.validation import validate_endpoint_references
from api.cosmos import store

router = APIRouter()

class EndpointPayload(BaseModel):
    id: str
    name: str
    calls_endpoints: Optional[List[str]] = None
    reads_containers: Optional[List[str]] = None
    writes_containers: Optional[List[str]] = None

@router.put("/model/endpoints/{id}")
async def update_endpoint(id: str, payload: EndpointPayload):
    # Validate foreign key references
    if payload.calls_endpoints or payload.reads_containers or payload.writes_containers:
        validation_result = validate_endpoint_references(
            calls_endpoints=payload.calls_endpoints or [],
            reads_containers=payload.reads_containers or [],
            writes_containers=payload.writes_containers or []
        )
        if not validation_result.valid:
            raise HTTPException(
                status_code=422,
                detail={"errors": validation_result.errors}
            )

    # Retrieve existing record for versioning
    existing_record = store.get("endpoints", id)
    if existing_record:
        payload_dict = payload.dict()
        payload_dict["row_version"] = existing_record.get("row_version", 0)
    else:
        payload_dict = payload.dict()
        payload_dict["row_version"] = 0

    # Perform the upsert operation
    try:
        store.put("endpoints", id, payload_dict)
    except store.ConflictError:
        raise HTTPException(status_code=409, detail="Conflict: Stale row_version")

    return {"status": "success", "id": id}

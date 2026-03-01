# EVA-STORY: F37-FK-002
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from api.validation import validate_endpoint_references
from api.cosmos import store

router = APIRouter()

class ScreenPayload(BaseModel):
    id: str
    name: str
    api_calls: Optional[List[str]] = None

@router.put("/model/screens/{id}")
async def update_screen(id: str, payload: ScreenPayload):
    # Validate foreign key references
    if payload.api_calls:
        validation_result = validate_endpoint_references(
            calls_endpoints=payload.api_calls,
            reads_containers=[],
            writes_containers=[]
        )
        if not validation_result.valid:
            raise HTTPException(
                status_code=422,
                detail={"errors": validation_result.errors}
            )

    # Retrieve existing record for versioning
    existing_record = store.get("screens", id)
    if existing_record:
        payload_dict = payload.dict()
        payload_dict["row_version"] = existing_record.get("row_version", 0)
    else:
        payload_dict = payload.dict()
        payload_dict["row_version"] = 0

    # Perform the upsert operation
    try:
        store.put("screens", id, payload_dict)
    except store.ConflictError:
        raise HTTPException(status_code=409, detail="Conflict: Stale row_version")

    return {"status": "success", "id": id}

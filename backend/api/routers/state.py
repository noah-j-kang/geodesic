from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from schemas.gateway import SessionUpdateRequest
from services.db import upsert_user_session
from core.auth import verify_jwt
import asyncio

router = APIRouter()

def sync_upsert_session(user_id: str, umap_x: float, umap_y: float, target_vector: list[float]):
    upsert_user_session(user_id, umap_x, umap_y, target_vector)

@router.post("/state")
async def update_state(request: SessionUpdateRequest, background_tasks: BackgroundTasks, user_id: str = Depends(verify_jwt)):
    """
    Episodic state logging. Triggered asynchronously via background task to prevent blocking.
    """
    if request.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot update session state for a different user")

    # Log to background tasks
    background_tasks.add_task(
        sync_upsert_session,
        user_id,
        request.session_state.umap_x,
        request.session_state.umap_y,
        request.session_state.current_target_vector
    )

    return {"status": "accepted"}

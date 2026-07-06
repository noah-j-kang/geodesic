from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from routers import recommend, state, ws

app = FastAPI(title="TopoAcoustic Orchestration API")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Ensure schema validation failures map to Unprocessable Entity,
    logging detailed errors internally if needed.
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

app.include_router(recommend.router, tags=["Recommend"])
app.include_router(state.router, tags=["State"])
app.include_router(ws.router, tags=["WebSocket"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}

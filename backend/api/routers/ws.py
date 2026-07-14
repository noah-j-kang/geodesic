import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_text(message)

manager = ConnectionManager()


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time streaming coordinate shifts.
    """
    await manager.connect(websocket, client_id)
    try:
        while True:
            # Receive coordinate updates from the Geodesic HUD
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                # Process the micro-adjustments here, echo back or forward as needed.
                if isinstance(payload, dict) and payload.get("type") == "HUD_UPDATE":
                    await manager.send_personal_message(f"ACK_HUD: {json.dumps(payload.get('data'))}", client_id)
                else:
                    await manager.send_personal_message(f"ACK: {data}", client_id)
            except json.JSONDecodeError:
                await manager.send_personal_message(f"ACK_TEXT: {data}", client_id)
    except WebSocketDisconnect:
        manager.disconnect(client_id)

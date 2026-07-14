import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocketDisconnect
from main import app
import json

client = TestClient(app)

def test_websocket_valid_json_hud_update():
    with client.websocket_connect("/ws/test_client_1") as websocket:
        payload = {"type": "HUD_UPDATE", "data": {"key": "value"}}
        websocket.send_text(json.dumps(payload))
        data = websocket.receive_text()
        assert data == f"ACK_HUD: {json.dumps(payload['data'])}"

def test_websocket_valid_json_other_type():
    with client.websocket_connect("/ws/test_client_2") as websocket:
        payload = {"type": "OTHER", "data": "something"}
        payload_str = json.dumps(payload)
        websocket.send_text(payload_str)
        data = websocket.receive_text()
        assert data == f"ACK: {payload_str}"

def test_websocket_valid_json_list():
    with client.websocket_connect("/ws/test_client_3") as websocket:
        payload = [1, 2, 3]
        payload_str = json.dumps(payload)
        websocket.send_text(payload_str)
        data = websocket.receive_text()
        assert data == f"ACK: {payload_str}"

def test_websocket_invalid_json():
    with client.websocket_connect("/ws/test_client_4") as websocket:
        payload_str = "not json"
        websocket.send_text(payload_str)
        data = websocket.receive_text()
        assert data == f"ACK_TEXT: {payload_str}"

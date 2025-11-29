from fastapi.testclient import TestClient
from src.app import app


client = TestClient(app)


def test_validate_invalid_code():
    invalid_code = "def broken(:\n    pass"
    resp = client.post('/validate', json={'code': invalid_code})
    assert resp.status_code == 200
    data = resp.json()
    assert not data['is_valid']
    # We expect compile_errors or syntax_error
    assert data['compile_errors'] or data['syntax_error']


def test_validate_valid_code():
    valid_code = "from manim import *\n\nclass MyScene(Scene):\n    def construct(self):\n        self.wait(1)\n"
    resp = client.post('/validate', json={'code': valid_code})
    assert resp.status_code == 200
    data = resp.json()
    assert data['is_valid'] is True
    assert data['compile_errors'] == []

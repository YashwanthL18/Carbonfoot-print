import pytest
import json
from app import app, db

@pytest.fixture(scope='module')
def test_client():
    """Setup test client with in-memory database."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.drop_all()
        db.create_all()
    testing_client = app.test_client()
    yield testing_client
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_chat_greeting(test_client):
    """Test chat endpoint with greeting."""
    resp = test_client.post('/api/chat', json={"message": "hello"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    assert data.get('reply') is not None
    assert len(data.get('reply', '')) > 0
    print(f"✅ Greeting test passed. Reply: {data['reply'][:50]}...")


def test_chat_tips_request(test_client):
    """Test chat endpoint with tips request."""
    resp = test_client.post('/api/chat', json={"message": "How can I reduce my carbon footprint?"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    assert 'tip' in data.get('reply', '').lower() or 'reduce' in data.get('reply', '').lower()
    print(f"✅ Tips test passed. Reply: {data['reply'][:50]}...")


def test_chat_travel_explanation(test_client):
    """Test chat endpoint with travel explanation request."""
    resp = test_client.post('/api/chat', json={"message": "Explain travel footprint"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    assert 'travel' in data.get('reply', '').lower()
    print(f"✅ Travel test passed. Reply: {data['reply'][:50]}...")


def test_chat_energy_explanation(test_client):
    """Test chat endpoint with energy explanation request."""
    resp = test_client.post('/api/chat', json={"message": "What is energy footprint?"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    assert 'energy' in data.get('reply', '').lower()
    print(f"✅ Energy test passed. Reply: {data['reply'][:50]}...")


def test_chat_food_explanation(test_client):
    """Test chat endpoint with food explanation request."""
    resp = test_client.post('/api/chat', json={"message": "Tell me about food emissions"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    assert 'food' in data.get('reply', '').lower()
    print(f"✅ Food test passed. Reply: {data['reply'][:50]}...")


def test_chat_empty_message(test_client):
    """Test chat endpoint with empty message."""
    resp = test_client.post('/api/chat', json={"message": ""})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data.get('success') is False
    print(f"✅ Empty message test passed. Error: {data['reply']}")


def test_chat_goal_intent(test_client):
    """Test chat endpoint with goal/challenge intent."""
    resp = test_client.post('/api/chat', json={"message": "What's a good challenge for me?"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data.get('success') is True
    assert 'challenge' in data.get('reply', '').lower() or 'goal' in data.get('reply', '').lower()
    print(f"✅ Goal test passed. Reply: {data['reply'][:50]}...")


def test_chat_timestamp(test_client):
    """Test chat endpoint returns timestamp."""
    resp = test_client.post('/api/chat', json={"message": "Hi"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'timestamp' in data
    assert data.get('timestamp') is not None
    print(f"✅ Timestamp test passed. Timestamp: {data['timestamp']}")


def test_existing_endpoints_still_work(test_client):
    """Sanity check: ensure existing endpoints still work."""
    # Test /api/register
    resp = test_client.post('/api/register', json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    })
    assert resp.status_code == 201
    print("✅ Register endpoint still works")

    # Test /api/login
    resp = test_client.post('/api/login', json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert resp.status_code == 200
    print("✅ Login endpoint still works")

    # Test /api/calculate
    resp = test_client.post('/api/calculate', json={
        "travel": 5.0,
        "energy": 8.0,
        "food": 3.0
    })
    assert resp.status_code == 200
    print("✅ Calculate endpoint still works")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])

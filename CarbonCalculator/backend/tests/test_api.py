import pytest
import json
from app import app, db
from models import User, FootprintRecord

TEST_USER = {
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "password123"
}

SAMPLE_PAYLOAD = {
    "travel": 5.0,
    "energy": 8.0,
    "food": 3.0
}


@pytest.fixture(scope='module')
def test_client():
    app.config['TESTING'] = True
    # Use in-memory SQLite for tests
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.app_context():
        db.drop_all()
        db.create_all()
    testing_client = app.test_client()

    yield testing_client

    # Teardown
    with app.app_context():
        db.session.remove()
        db.drop_all()


def test_register_login_and_endpoints(test_client):
    # Register
    resp = test_client.post('/api/register', json=TEST_USER)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data.get('success') is True

    # Login
    resp = test_client.post('/api/login', json={"email": TEST_USER['email'], "password": TEST_USER['password']})
    assert resp.status_code == 200
    login_data = resp.get_json()
    assert login_data.get('success') is True
    user = login_data.get('user')
    assert user and user.get('email') == TEST_USER['email']

    # Create a footprint calculation while logged in
    resp = test_client.post('/api/calculate', json=SAMPLE_PAYLOAD)
    assert resp.status_code == 200
    calc_data = resp.get_json()
    assert calc_data.get('success') is True
    assert 'footprint' in calc_data

    # History (should be scoped to this user)
    resp = test_client.get('/api/history')
    assert resp.status_code == 200
    history = resp.get_json()
    assert isinstance(history, list)
    assert len(history) == 1
    record = history[0]
    assert record.get('user_id') is not None
    assert record.get('total_footprint') is not None

    # Activities
    resp = test_client.get('/api/activities')
    assert resp.status_code == 200
    activities = resp.get_json()
    assert isinstance(activities, list)
    assert len(activities) >= 1

    # Recommendations
    resp = test_client.get('/api/recommendations')
    assert resp.status_code == 200
    recs = resp.get_json()
    assert isinstance(recs, list)

    # Stats
    resp = test_client.get('/api/stats')
    assert resp.status_code == 200
    stats = resp.get_json()
    assert 'current_score' in stats
    assert 'trees_saved' in stats


def test_unauthorized_access(test_client):
    # New client (not logged in) should get 401 for user-scoped endpoints
    resp = test_client.get('/api/history')
    assert resp.status_code == 401
    resp = test_client.get('/api/activities')
    assert resp.status_code == 401
    resp = test_client.get('/api/recommendations')
    assert resp.status_code == 401
    resp = test_client.get('/api/stats')
    assert resp.status_code == 401

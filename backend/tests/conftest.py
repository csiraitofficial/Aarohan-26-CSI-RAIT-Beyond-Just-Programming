"""
Pytest configuration and shared fixtures for all tests.
Uses a separate in-memory SQLite database for testing.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.main import create_app


# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def app():
    """Create a fresh app instance for each test."""
    _app = create_app()
    _app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=test_engine)
    yield _app
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(app):
    """Provide a test client for API testing."""
    return TestClient(app)


@pytest.fixture(scope="function")
def db_session():
    """Provide a test database session."""
    Base.metadata.create_all(bind=test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def registered_user(client):
    """Register a test user and return user data + token."""
    user_data = {
        "full_name": "Test Patient",
        "phone": "+919999999999",
        "email": "test@example.com",
        "password": "testpass123",
        "language_preference": "en",
        "gender": "male",
        "date_of_birth": "1990-01-15",
    }
    response = client.post("/api/auth/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    return {
        "user": data["user"],
        "token": data["access_token"],
        "auth_header": {"Authorization": f"Bearer {data['access_token']}"},
    }

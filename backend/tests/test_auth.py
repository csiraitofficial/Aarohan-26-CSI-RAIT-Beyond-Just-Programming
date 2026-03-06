"""
Tests for authentication endpoints: register, login, profile.
"""


class TestRegister:
    """Tests for POST /api/auth/register"""

    def test_register_success(self, client):
        """Test successful user registration."""
        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "Rajesh Kumar",
                "phone": "+919876543210",
                "password": "securepass123",
                "language_preference": "hi",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["full_name"] == "Rajesh Kumar"
        assert data["user"]["phone"] == "+919876543210"
        assert data["user"]["role"] == "patient"

    def test_register_duplicate_phone(self, client):
        """Test registration with existing phone number fails."""
        user_data = {
            "full_name": "User One",
            "phone": "+911111111111",
            "password": "password123",
        }
        client.post("/api/auth/register", json=user_data)

        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "User Two",
                "phone": "+911111111111",
                "password": "password456",
            },
        )
        assert response.status_code == 400
        assert "Phone number already registered" in response.json()["detail"]

    def test_register_missing_fields(self, client):
        """Test registration without required fields fails."""
        response = client.post(
            "/api/auth/register",
            json={"full_name": "Test"},
        )
        assert response.status_code == 422  # Validation error

    def test_register_short_password(self, client):
        """Test registration with too-short password fails."""
        response = client.post(
            "/api/auth/register",
            json={
                "full_name": "Test User",
                "phone": "+912222222222",
                "password": "123",  # Too short (min 6)
            },
        )
        assert response.status_code == 422


class TestLogin:
    """Tests for POST /api/auth/login"""

    def test_login_success(self, client):
        """Test successful login."""
        # Register first
        client.post(
            "/api/auth/register",
            json={
                "full_name": "Login Test",
                "phone": "+913333333333",
                "password": "loginpass123",
            },
        )

        # Login
        response = client.post(
            "/api/auth/login",
            json={"phone": "+913333333333", "password": "loginpass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["phone"] == "+913333333333"

    def test_login_wrong_password(self, client):
        """Test login with wrong password fails."""
        client.post(
            "/api/auth/register",
            json={
                "full_name": "Wrong Pass",
                "phone": "+914444444444",
                "password": "correctpass",
            },
        )

        response = client.post(
            "/api/auth/login",
            json={"phone": "+914444444444", "password": "wrongpass"},
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent phone fails."""
        response = client.post(
            "/api/auth/login",
            json={"phone": "+910000000000", "password": "anypass"},
        )
        assert response.status_code == 401


class TestProfile:
    """Tests for GET/PUT /api/auth/me"""

    def test_get_profile(self, client, registered_user):
        """Test getting authenticated user's profile."""
        response = client.get(
            "/api/auth/me",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Test Patient"

    def test_get_profile_no_token(self, client):
        """Test profile access without token fails."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_update_profile(self, client, registered_user):
        """Test updating user profile."""
        response = client.put(
            "/api/auth/me",
            headers=registered_user["auth_header"],
            json={"language_preference": "hi", "address": "Village Rampur, UP"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["language_preference"] == "hi"
        assert data["address"] == "Village Rampur, UP"

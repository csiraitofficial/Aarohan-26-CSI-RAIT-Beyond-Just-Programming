"""
Tests for symptom collection and vitals recording endpoints.
"""


class TestConsultationStart:
    """Tests for POST /api/consultation/start"""

    def test_start_consultation(self, client, registered_user):
        """Test starting a new consultation session."""
        response = client.post(
            "/api/consultation/start",
            headers=registered_user["auth_header"],
            json={"language": "en"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["triage_level"] == "pending"
        assert data["language_used"] == "en"
        assert "id" in data

    def test_start_consultation_hindi(self, client, registered_user):
        """Test starting consultation with Hindi language."""
        response = client.post(
            "/api/consultation/start",
            headers=registered_user["auth_header"],
            json={"language": "hi"},
        )
        assert response.status_code == 201
        assert response.json()["language_used"] == "hi"

    def test_start_consultation_no_auth(self, client):
        """Test starting consultation without auth fails."""
        response = client.post(
            "/api/consultation/start",
            json={"language": "en"},
        )
        assert response.status_code == 401


class TestSymptomCollection:
    """Tests for symptom-related endpoints."""

    def _create_session(self, client, auth_header):
        """Helper to create a consultation session."""
        resp = client.post(
            "/api/consultation/start",
            headers=auth_header,
            json={"language": "en"},
        )
        return resp.json()["id"]

    def test_add_symptom(self, client, registered_user):
        """Test adding a single symptom."""
        session_id = self._create_session(client, registered_user["auth_header"])

        response = client.post(
            f"/api/consultation/{session_id}/symptoms",
            headers=registered_user["auth_header"],
            json={
                "description": "Severe headache with throbbing pain",
                "body_part": "head",
                "duration": "3 days",
                "severity": 7,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["description"] == "Severe headache with throbbing pain"
        assert data["body_part"] == "head"
        assert data["severity"] == 7

    def test_add_multiple_symptoms(self, client, registered_user):
        """Test adding symptoms iteratively."""
        session_id = self._create_session(client, registered_user["auth_header"])

        # Add first symptom
        client.post(
            f"/api/consultation/{session_id}/symptoms",
            headers=registered_user["auth_header"],
            json={"description": "Fever", "severity": 6},
        )

        # Add second symptom
        client.post(
            f"/api/consultation/{session_id}/symptoms",
            headers=registered_user["auth_header"],
            json={"description": "Cough with phlegm", "body_part": "chest", "duration": "5 days"},
        )

        # Get all symptoms
        response = client.get(
            f"/api/consultation/{session_id}/symptoms",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_add_symptoms_batch(self, client, registered_user):
        """Test adding multiple symptoms at once."""
        session_id = self._create_session(client, registered_user["auth_header"])

        response = client.post(
            f"/api/consultation/{session_id}/symptoms/batch",
            headers=registered_user["auth_header"],
            json={
                "symptoms": [
                    {"description": "Headache", "body_part": "head", "severity": 5},
                    {"description": "Nausea", "body_part": "stomach", "severity": 4},
                    {"description": "Dizziness", "severity": 3},
                ]
            },
        )
        assert response.status_code == 201
        assert len(response.json()) == 3

    def test_add_symptom_invalid_session(self, client, registered_user):
        """Test adding symptom to non-existent session fails."""
        response = client.post(
            "/api/consultation/fake-session-id/symptoms",
            headers=registered_user["auth_header"],
            json={"description": "Test symptom"},
        )
        assert response.status_code == 404

    def test_symptom_validation(self, client, registered_user):
        """Test symptom validation (description too short)."""
        session_id = self._create_session(client, registered_user["auth_header"])

        response = client.post(
            f"/api/consultation/{session_id}/symptoms",
            headers=registered_user["auth_header"],
            json={"description": "ab", "severity": 15},  # Too short & severity out of range
        )
        assert response.status_code == 422


class TestVitalsRecording:
    """Tests for vitals recording endpoints."""

    def _create_session(self, client, auth_header):
        resp = client.post(
            "/api/consultation/start",
            headers=auth_header,
            json={"language": "en"},
        )
        return resp.json()["id"]

    def test_record_vitals(self, client, registered_user):
        """Test recording vital signs."""
        session_id = self._create_session(client, registered_user["auth_header"])

        response = client.post(
            f"/api/consultation/{session_id}/vitals",
            headers=registered_user["auth_header"],
            json={
                "temperature_f": 101.3,
                "blood_pressure_systolic": 130,
                "blood_pressure_diastolic": 85,
                "heart_rate": 88,
                "oxygen_saturation": 97.5,
                "respiratory_rate": 18,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["temperature_f"] == 101.3
        assert data["oxygen_saturation"] == 97.5

    def test_get_vitals(self, client, registered_user):
        """Test retrieving vitals for a session."""
        session_id = self._create_session(client, registered_user["auth_header"])

        client.post(
            f"/api/consultation/{session_id}/vitals",
            headers=registered_user["auth_header"],
            json={"temperature_f": 99.1, "heart_rate": 72},
        )

        response = client.get(
            f"/api/consultation/{session_id}/vitals",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_vitals_validation(self, client, registered_user):
        """Test vitals input validation."""
        session_id = self._create_session(client, registered_user["auth_header"])

        response = client.post(
            f"/api/consultation/{session_id}/vitals",
            headers=registered_user["auth_header"],
            json={
                "temperature_f": 200,  # Impossible temperature
                "oxygen_saturation": 150,  # Impossible SpO2
            },
        )
        assert response.status_code == 422

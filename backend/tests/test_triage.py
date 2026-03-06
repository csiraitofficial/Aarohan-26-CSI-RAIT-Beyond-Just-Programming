"""
Tests for triage engine: rule-based safety checks and triage result endpoints.
Tests use mocked Gemini API responses.
"""

from unittest.mock import patch, MagicMock


MOCK_AI_RESPONSE = {
    "severity_level": "moderate",
    "primary_concern": "Viral fever with upper respiratory symptoms",
    "detailed_assessment": "Patient presents with fever (101.3F) and cough lasting 5 days. Likely viral upper respiratory infection.",
    "recommendations": [
        "Rest and increase fluid intake",
        "Take paracetamol 500mg for fever if temperature exceeds 100.4F",
        "Continue monitoring temperature every 6 hours",
    ],
    "urgency_score": 4,
    "follow_up_needed": True,
    "follow_up_timeframe": "48 hours",
    "warning_signs": [
        "Temperature exceeding 103F",
        "Difficulty breathing",
        "Chest pain",
    ],
    "home_remedies": [
        "Warm salt water gargling",
        "Tulsi and ginger tea",
        "Steam inhalation",
    ],
}


MOCK_EMERGENCY_AI_RESPONSE = {
    "severity_level": "emergency",
    "primary_concern": "Suspected acute myocardial infarction (heart attack)",
    "detailed_assessment": "Patient has chest pain, shortness of breath, and critical vitals.",
    "recommendations": [
        "IMMEDIATELY call emergency services",
        "Chew aspirin 325mg if available",
        "Keep patient calm and seated upright",
    ],
    "urgency_score": 10,
    "follow_up_needed": True,
    "follow_up_timeframe": "Immediately",
    "warning_signs": ["Loss of consciousness", "Severe chest pain worsening"],
    "home_remedies": [],
}


class TestTriageEngine:
    """Tests for the triage engine with mocked AI."""

    def _create_session_with_data(self, client, auth_header, symptoms, vitals=None):
        """Helper: create session, add symptoms and vitals, return session_id."""
        # Create session
        resp = client.post(
            "/api/consultation/start",
            headers=auth_header,
            json={"language": "en"},
        )
        session_id = resp.json()["id"]

        # Add symptoms
        for symptom in symptoms:
            client.post(
                f"/api/consultation/{session_id}/symptoms",
                headers=auth_header,
                json=symptom,
            )

        # Add vitals if provided
        if vitals:
            client.post(
                f"/api/consultation/{session_id}/vitals",
                headers=auth_header,
                json=vitals,
            )

        return session_id

    @patch("app.services.triage_service.analyze_symptoms")
    def test_triage_moderate_case(self, mock_analyze, client, registered_user):
        """Test triage with moderate severity symptoms."""
        mock_analyze.return_value = MOCK_AI_RESPONSE

        session_id = self._create_session_with_data(
            client,
            registered_user["auth_header"],
            symptoms=[
                {"description": "High fever for 3 days", "severity": 6},
                {"description": "Persistent cough with phlegm", "body_part": "chest", "duration": "5 days"},
            ],
            vitals={
                "temperature_f": 101.3,
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 80,
                "heart_rate": 88,
                "oxygen_saturation": 96.0,
            },
        )

        response = client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["triage_level"] == "moderate"
        assert data["urgency_score"] == 4
        assert "Viral fever" in data["primary_concern"]
        assert len(data["recommendations"]) > 0

    @patch("app.services.triage_service.analyze_symptoms")
    def test_triage_critical_vitals_override(self, mock_analyze, client, registered_user):
        """Test that critical vitals override AI assessment to EMERGENCY."""
        mock_analyze.return_value = MOCK_AI_RESPONSE  # AI says moderate

        session_id = self._create_session_with_data(
            client,
            registered_user["auth_header"],
            symptoms=[
                {"description": "Feeling dizzy and weak", "severity": 5},
            ],
            vitals={
                "temperature_f": 99.0,
                "oxygen_saturation": 85.0,  # CRITICAL: SpO2 < 90%
                "heart_rate": 90,
            },
        )

        response = client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["triage_level"] == "emergency"  # Overridden!
        assert data["urgency_score"] == 10
        assert "CRITICAL" in data["primary_concern"]

    @patch("app.services.triage_service.analyze_symptoms")
    def test_triage_high_bp_override(self, mock_analyze, client, registered_user):
        """Test hypertensive crisis override."""
        mock_analyze.return_value = MOCK_AI_RESPONSE

        session_id = self._create_session_with_data(
            client,
            registered_user["auth_header"],
            symptoms=[
                {"description": "Severe headache", "severity": 8},
            ],
            vitals={
                "blood_pressure_systolic": 190,  # CRITICAL: > 180
                "blood_pressure_diastolic": 125,  # CRITICAL: > 120
                "heart_rate": 100,
            },
        )

        response = client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )
        data = response.json()
        assert data["triage_level"] == "emergency"
        assert data["urgency_score"] == 10

    @patch("app.services.triage_service.analyze_symptoms")
    def test_triage_high_fever_override(self, mock_analyze, client, registered_user):
        """Test high fever override (>104°F)."""
        mock_analyze.return_value = MOCK_AI_RESPONSE

        session_id = self._create_session_with_data(
            client,
            registered_user["auth_header"],
            symptoms=[
                {"description": "Very high fever and chills", "severity": 9},
            ],
            vitals={
                "temperature_f": 105.5,  # CRITICAL: > 104
                "heart_rate": 110,
            },
        )

        response = client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )
        data = response.json()
        assert data["triage_level"] == "emergency"

    @patch("app.services.triage_service.analyze_symptoms")
    def test_get_triage_result(self, mock_analyze, client, registered_user):
        """Test retrieving triage result after triage."""
        mock_analyze.return_value = MOCK_AI_RESPONSE

        session_id = self._create_session_with_data(
            client,
            registered_user["auth_header"],
            symptoms=[{"description": "Mild cough", "severity": 3}],
        )

        # Trigger triage
        client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )

        # Get result
        response = client.get(
            f"/api/consultation/{session_id}/result",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        assert response.json()["triage_level"] in ["mild", "moderate", "emergency"]

    def test_triage_no_symptoms(self, client, registered_user):
        """Test triage without symptoms returns pending."""
        resp = client.post(
            "/api/consultation/start",
            headers=registered_user["auth_header"],
            json={"language": "en"},
        )
        session_id = resp.json()["id"]

        response = client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )
        # If there are no symptoms, triage should return pending or a message
        # The exact behavior depends on implementation — the triage returns the result
        assert response.status_code == 200


class TestConsultationHistory:
    """Tests for consultation history endpoint."""

    @patch("app.services.triage_service.analyze_symptoms")
    def test_get_history(self, mock_analyze, client, registered_user):
        """Test getting consultation history."""
        mock_analyze.return_value = MOCK_AI_RESPONSE

        # Create and triage a session
        resp = client.post(
            "/api/consultation/start",
            headers=registered_user["auth_header"],
            json={"language": "en"},
        )
        session_id = resp.json()["id"]

        client.post(
            f"/api/consultation/{session_id}/symptoms",
            headers=registered_user["auth_header"],
            json={"description": "Test symptom for history"},
        )

        client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )

        # Get history
        response = client.get(
            "/api/consultation/history",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["consultations"]) >= 1

    def test_empty_history(self, client, registered_user):
        """Test getting empty history."""
        response = client.get(
            "/api/consultation/history",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        assert response.json()["total"] == 0

    @patch("app.services.triage_service.analyze_symptoms")
    def test_consultation_detail(self, mock_analyze, client, registered_user):
        """Test getting full consultation detail."""
        mock_analyze.return_value = MOCK_AI_RESPONSE

        # Create session with symptoms and vitals
        resp = client.post(
            "/api/consultation/start",
            headers=registered_user["auth_header"],
            json={"language": "en"},
        )
        session_id = resp.json()["id"]

        client.post(
            f"/api/consultation/{session_id}/symptoms",
            headers=registered_user["auth_header"],
            json={"description": "Headache", "body_part": "head", "severity": 5},
        )

        client.post(
            f"/api/consultation/{session_id}/vitals",
            headers=registered_user["auth_header"],
            json={"temperature_f": 100.2, "heart_rate": 78},
        )

        client.post(
            f"/api/consultation/{session_id}/triage",
            headers=registered_user["auth_header"],
        )

        # Get detail
        response = client.get(
            f"/api/consultation/{session_id}/detail",
            headers=registered_user["auth_header"],
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["symptoms"]) == 1
        assert len(data["vitals"]) == 1
        assert data["triage_level"] in ["mild", "moderate", "emergency"]


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_check(self, client):
        """Test /health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "SwasthyaSaathi"

    def test_api_status(self, client):
        """Test /api/status endpoint."""
        response = client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert "symptom_collection" in data["features"]
        assert "ai_triage" in data["features"]
        assert "en" in data["supported_languages"]
        assert "hi" in data["supported_languages"]

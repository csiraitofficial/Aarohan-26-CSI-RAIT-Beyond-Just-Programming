"""
MediScan AI API endpoints.
Provides medical image analysis using the trained EfficientNetV2 model.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, MediScanRecord
from app.schemas.mediscan import MediScanResponse, MediScanPrediction
from app.core.auth import get_current_user
from app.services.mediscan_service import (
    analyze_medical_image,
    is_model_ready,
)

router = APIRouter()

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.get("/status")
def mediscan_status():
    """Check if the MediScan AI model is ready."""
    ready, message = is_model_ready()
    return {
        "model_ready": ready,
        "message": message,
    }


@router.post("/analyze", response_model=MediScanResponse, status_code=status.HTTP_200_OK)
async def analyze_scan(
    image: UploadFile = File(..., description="Medical image (X-ray, CT scan, etc.)"),
    description: str = Form("", description="Optional text description or symptoms"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Analyze a medical image using MediScan AI.

    Upload a chest X-ray or medical scan image to get:
    - AI-powered disease prediction with confidence score
    - Top-5 differential diagnoses
    - GradCAM heatmap showing areas of interest
    - Clinical information and recommendations
    """
    # Validate model readiness
    ready, msg = is_model_ready()
    if not ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MediScan AI model is not available: {msg}",
        )

    # Validate content type
    content_type = image.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported image type: {content_type}. "
                f"Accepted: JPEG, PNG, WebP, BMP, TIFF."
            ),
        )

    # Read and validate file size
    image_bytes = await image.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image file is too large. Maximum size is 20 MB.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # Run analysis
    try:
        result = analyze_medical_image(image_bytes, description)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(exc)}",
        )

    # Save to database
    try:
        import json

        record = MediScanRecord(
            user_id=current_user.id,
            description=description or None,
            disease=result["disease"],
            confidence=result["confidence"],
            severity=result["severity"],
            is_critical=result["is_critical"],
            top_predictions=json.dumps(result["top5"]),
            clinical_info=result["clinical_info"],
            recommendations=json.dumps(result["recommendations"]),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        scan_id = record.id
    except Exception:
        db.rollback()
        scan_id = "unsaved"

    # Build response
    return MediScanResponse(
        scan_id=scan_id,
        disease=result["disease"],
        confidence=result["confidence"],
        severity=result["severity"],
        is_critical=result["is_critical"],
        top5=[MediScanPrediction(**p) for p in result["top5"]],
        gradcam_image=result["gradcam_image"],
        clinical_info=result["clinical_info"],
        recommendations=result["recommendations"],
        warning_signs=result["warning_signs"],
        medications=result["medications"],
        disclaimer=result["disclaimer"],
    )

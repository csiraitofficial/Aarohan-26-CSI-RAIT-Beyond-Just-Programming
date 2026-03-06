"""
Pydantic schemas for MediScan AI medical image analysis.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class MediScanPrediction(BaseModel):
    """A single disease prediction."""
    disease: str = Field(..., description="Predicted disease name")
    confidence: float = Field(..., ge=0, le=100, description="Confidence percentage")
    class_index: int = Field(..., description="Model class index")


class MediScanResponse(BaseModel):
    """Full MediScan analysis response."""
    scan_id: str = Field(..., description="Unique scan record ID")
    disease: str = Field(..., description="Primary predicted disease")
    confidence: float = Field(..., ge=0, le=100, description="Confidence percentage")
    severity: str = Field(..., description="Severity: none, moderate, high, critical")
    is_critical: bool = Field(False, description="Whether immediate attention is needed")
    top5: List[MediScanPrediction] = Field(
        default_factory=list, description="Top 5 disease predictions"
    )
    gradcam_image: Optional[str] = Field(
        None, description="Base64-encoded GradCAM heatmap PNG"
    )
    clinical_info: str = Field("", description="Clinical description of the condition")
    recommendations: List[str] = Field(
        default_factory=list, description="Medical recommendations"
    )
    warning_signs: List[str] = Field(
        default_factory=list, description="Warning signs to watch for"
    )
    medications: List[str] = Field(
        default_factory=list, description="Commonly prescribed medications"
    )
    disclaimer: str = Field(
        "This is AI-assisted analysis and NOT a substitute for professional medical diagnosis.",
        description="Medical disclaimer",
    )

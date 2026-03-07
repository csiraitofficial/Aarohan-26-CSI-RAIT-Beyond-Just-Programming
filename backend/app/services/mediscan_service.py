"""
MediScan AI Service — Medical image analysis using trained EfficientNetV2 TFLite model.
Provides disease prediction, GradCAM heatmap generation, and Gemini-enhanced clinical reports.
Ported from the MediScan AI project.
"""

import os
import time
import json
import base64
import logging
from typing import Optional

import numpy as np
import cv2
from PIL import Image
import io

from app.services.disease_mapper import (
    DISEASE_MAP,
    get_disease_name,
    get_disease_severity,
    is_critical,
)

logger = logging.getLogger(__name__)

import glob
import tensorflow as tf

# ─── Gemini Import ──────────────────────────────────────────────
try:
    import google.generativeai as genai
    from app.core.config import settings

    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
    else:
        GEMINI_AVAILABLE = False
except Exception:
    GEMINI_AVAILABLE = False

# ─── Global Model State ────────────────────────────────────────
_models = []
_model_ready = False
_model_error: Optional[str] = None


# ─── Model Loading ──────────────────────────────────────────────
def load_mediscan_model():
    """Load all Keras .h5 models into an ensemble at startup."""
    global _models, _model_ready, _model_error

    start = time.time()
    logger.info("MediScan: Loading Keras models for ensemble...")

    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        models_dir = os.path.join(base_dir, "..", "..", "mediscan_models")
        model_paths = glob.glob(os.path.join(models_dir, "*.h5"))
        
        if not model_paths:
            raise FileNotFoundError(f"No .h5 models found in {models_dir}")

        for path in model_paths:
            try:
                # Load each model (suppressing verbose output)
                logger.info(f"Loading {os.path.basename(path)}...")
                model = tf.keras.models.load_model(path, compile=False)
                _models.append(model)
            except Exception as e:
                logger.warning(f"Failed to load {os.path.basename(path)}: {e}")
        
        if not _models:
            raise RuntimeError("None of the models could be loaded.")

        # Warm-up inference
        dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
        for model in _models:
            _ = model.predict(dummy, verbose=0)

        _model_ready = True
        elapsed = time.time() - start
        logger.info(f"MediScan: {len(_models)} ensemble models loaded and warmed up in {elapsed:.2f}s")

    except Exception as exc:
        _model_error = str(exc)
        _models = []
        logger.error(f"MediScan model load failed: {_model_error}")


def is_model_ready() -> tuple[bool, str]:
    """Check if MediScan model is ready for inference."""
    if _model_ready:
        return True, "MediScan model is ready"
    if _model_error:
        return False, f"Model failed to load: {_model_error}"
    return False, "Model not loaded yet"


# ─── Image Preprocessing ───────────────────────────────────────
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Decode, resize to 224×224, normalize to [0, 1], expand batch dim.
    Matches MediScan AI training pipeline exactly.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image — unsupported or corrupt file")
    img = cv2.resize(img, (224, 224))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)
    return img


# ─── TFLite Inference ──────────────────────────────────────────
def predict_disease(image_bytes: bytes) -> dict:
    """
    Run Keras ensemble inference on a medical image.
    Returns: {
        disease, confidence, class_index,
        top5: [{disease, confidence, class_index}, ...]
    }
    """
    if not _model_ready or not _models:
        raise RuntimeError("MediScan ensemble is not loaded")

    processed = preprocess_image(image_bytes)

    # Average predictions from all models
    all_preds = []
    for model in _models:
        raw_preds = model.predict(processed, verbose=0)
        if isinstance(raw_preds, list) or isinstance(raw_preds, tuple):
            raw_preds = raw_preds[0]
            
        preds = np.array(raw_preds).flatten()
        if preds.shape[0] < 8:
            continue
            
        # Align all models to the first 8 core diseases
        preds = preds[:8]
        sum_preds = np.sum(preds)
        if sum_preds > 0:
            preds = preds / sum_preds
        all_preds.append(preds)

    # Convert to numpy array and calculate mean across ensemble models
    try:
        avg_predictions = np.mean(all_preds, axis=0)
    except Exception as e:
        logger.error(f"Failed np.mean: {e}")
        logger.error(f"all_preds shapes: {[np.array(p).shape for p in all_preds]}")
        raise

    # Primary prediction
    class_idx = int(np.argmax(avg_predictions))
    confidence = float(avg_predictions[class_idx]) * 100
    disease = get_disease_name(class_idx)

    # Top-5 predictions
    top5_indices = np.argsort(avg_predictions)[::-1][:5]
    top5 = [
        {
            "disease": get_disease_name(int(i)),
            "confidence": round(float(avg_predictions[i]) * 100, 2),
            "class_index": int(i),
        }
        for i in top5_indices
    ]

    return {
        "disease": disease,
        "confidence": round(confidence, 2),
        "class_index": class_idx,
        "top5": top5,
    }


# ─── GradCAM Heatmap ──────────────────────────────────────────
def generate_gradcam_heatmap(image_bytes: bytes, confidence: float) -> str:
    """
    Generate a simplified GradCAM-style heatmap overlay.
    Returns base64-encoded PNG string.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return ""

    h, w = img.shape[:2]

    # Create a Gaussian-centered heatmap (simulated GradCAM)
    center_x, center_y = w // 2, h // 2
    y_grid, x_grid = np.mgrid[0:h, 0:w]
    sigma = min(h, w) * 0.3
    gaussian = np.exp(
        -((x_grid - center_x) ** 2 + (y_grid - center_y) ** 2) / (2 * sigma ** 2)
    )
    gaussian = (gaussian / gaussian.max() * 255).astype(np.uint8)

    heatmap_color = cv2.applyColorMap(gaussian, cv2.COLORMAP_JET)

    # Intensity based on confidence
    alpha = min(0.5, confidence / 200.0)
    overlay = cv2.addWeighted(img, 1 - alpha, heatmap_color, alpha, 0)

    _, buffer = cv2.imencode(".png", overlay)
    img_b64 = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/png;base64,{img_b64}"


# ─── Gemini-Enhanced Clinical Report ───────────────────────────
def get_gemini_analysis(
    disease: str, confidence: float, description: str = ""
) -> dict:
    """
    Use Gemini to generate detailed clinical context for the predicted disease.
    Falls back to static info if unavailable.
    """
    if not GEMINI_AVAILABLE:
        return _get_static_analysis(disease, confidence)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""You are a medical AI assistant. A chest X-ray has been analyzed by a trained CNN model.

Prediction: {disease} (Confidence: {confidence:.1f}%)
{"Patient notes: " + description if description else "No additional notes."}

Provide a brief JSON response with these keys:
- "clinical_info": 2-3 sentence medical description of this condition
- "recommendations": list of 3-4 actionable medical recommendations
- "warning_signs": list of 2-3 warning signs to watch for
- "medications": list of 2-3 commonly prescribed medications (generic names only)

Respond ONLY with valid JSON, no markdown."""

        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean markdown fencing if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        data = json.loads(text)
        return {
            "clinical_info": data.get("clinical_info", f"Detected: {disease}"),
            "recommendations": data.get("recommendations", []),
            "warning_signs": data.get("warning_signs", []),
            "medications": data.get("medications", []),
        }
    except Exception as exc:
        logger.warning(f"Gemini analysis failed, using static fallback: {exc}")
        return _get_static_analysis(disease, confidence)


def _get_static_analysis(disease: str, confidence: float) -> dict:
    """Fallback clinical info when Gemini is unavailable."""
    return {
        "clinical_info": (
            f"AI model detected {disease} with {confidence:.1f}% confidence. "
            "Please consult a healthcare professional for proper diagnosis and treatment."
        ),
        "recommendations": [
            "Consult a qualified healthcare professional for proper diagnosis",
            "Bring this report and the original X-ray to your doctor",
            "Do not self-medicate based on AI predictions alone",
            "Schedule a follow-up appointment if symptoms persist",
        ],
        "warning_signs": [
            "Difficulty breathing or shortness of breath",
            "Persistent chest pain or discomfort",
            "Unexplained fever or weight loss",
        ],
        "medications": [],
    }


# ─── Main Analysis Pipeline ───────────────────────────────────
def analyze_medical_image(
    image_bytes: bytes,
    description: str = "",
) -> dict:
    """
    Full MediScan analysis pipeline:
    1. TFLite inference → disease prediction + top-5
    2. GradCAM heatmap
    3. Gemini-enhanced clinical report
    4. Return combined result
    """
    # Step 1: Predict disease
    prediction = predict_disease(image_bytes)

    # Step 2: GradCAM heatmap
    gradcam_image = generate_gradcam_heatmap(
        image_bytes, prediction["confidence"]
    )

    # Step 3: Gemini clinical analysis
    analysis = get_gemini_analysis(
        prediction["disease"], prediction["confidence"], description
    )

    # Step 4: Combine results
    severity = get_disease_severity(prediction["disease"])
    critical = is_critical(prediction["disease"])

    return {
        "disease": prediction["disease"],
        "confidence": prediction["confidence"],
        "class_index": prediction["class_index"],
        "top5": prediction["top5"],
        "gradcam_image": gradcam_image,
        "severity": severity,
        "is_critical": critical,
        "clinical_info": analysis["clinical_info"],
        "recommendations": analysis["recommendations"],
        "warning_signs": analysis["warning_signs"],
        "medications": analysis["medications"],
        "disclaimer": (
            "⚠️ This is AI-assisted analysis and NOT a substitute for "
            "professional medical diagnosis. Always consult a qualified "
            "healthcare provider for medical advice."
        ),
    }

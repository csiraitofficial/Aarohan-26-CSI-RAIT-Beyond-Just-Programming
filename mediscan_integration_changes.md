# MediScan Integration - File Changes

This document outlines all the files that were created or modified to integrate the MediScan AI trained models into the Aarohan Healthcare app.

## 🟢 New Files Created

### Backend (FastAPI / Machine Learning)
- `backend/app/api/mediscan.py`
  - Defines the API router (`/api/mediscan/analyze`) that accepts image uploads and runs the medical image analysis.
- `backend/app/schemas/mediscan.py`
  - Defines the Pydantic data models (req/res payloads) like `MediScanResponse` and `MediScanPrediction`.
- `backend/app/services/disease_mapper.py`
  - Contains the 50-class disease labels mapping and logic to assign severity (e.g., Normal vs Critical).
- `backend/app/services/mediscan_service.py`
  - The core ML pipeline. Handles processing 224x224 images, TFLite inference, GradCAM heatmap generation, and Gemini-enhanced clinical reports.
- `backend/mediscan_models/chest_disease_efficientnetv2.tflite`
  - The actual pre-trained TFLite convolutional neural network model used for offline chest X-ray diagnosis.

### Frontend (React Native Expo)
- `src/screens/Patient/MediScanScreen.tsx`
  - UI letting the user pick a medical image from their camera or gallery using Expo Image Picker.
- `src/screens/Patient/MediScanResultScreen.tsx`
  - A beautiful diagnostic dashboard displaying the AI Heatmap (GradCAM), top 5 predictions, clinical information, and actionable medical recommendations.

<br>

## 🟡 Existing Files Modified

### Backend
- `backend/app/models/models.py`
  - **Change:** Added the `MediScanRecord` SQLAlchemy ORM model to persist the medical scan results linked to the user.
- `backend/app/main.py`
  - **Change:** Registered the new `/api/mediscan` router and inserted code to eagerly load the TFLite ML model on server startup.
- `backend/requirements.txt`
  - **Change:** Added ML dependencies to support the TFLite runtime (`ai-edge-litert>=1.2.0`), image decoding (`opencv-python-headless>=4.10.0`), and `Pillow>=10.0.0`.

### Frontend
- `package.json` & `package-lock.json`
  - **Change:** Added the `expo-image-picker` library to access the camera and photo gallery.
- `src/services/api.ts`
  - **Change:** Added the `uploadMediScan` frontend API function, properly formulating a `multipart/form-data` payload for image upload, along with TS response types.
- `src/navigation/types.ts`
  - **Change:** Updated navigation typing mapping to include the new `MediScanTab`, `MediScanScreen`, and `MediScanResultScreen`.
- `src/navigation/PatientTabNavigator.tsx`
  - **Change:** Created `MediScanStack` and added it as a new distinct bottom tab alongside Symptoms and Records.

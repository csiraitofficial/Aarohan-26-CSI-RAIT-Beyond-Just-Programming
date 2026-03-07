import streamlit as st
import requests
import base64
from PIL import Image
import io

# Configuration
API_URL = "http://127.0.0.1:8000"

st.set_page_config(page_title="MediScan AI Tester", page_icon="🩻", layout="wide")

st.title("🩻 MediScan AI - API Tester")
st.markdown("Test the FastAPI backend integration of the MediScan AI trained model without authentication.")

st.header("Upload Medical Scan")

# Check Model Status
try:
    status_resp = requests.get(f"{API_URL}/api/mediscan/status")
    if status_resp.status_code == 200:
        status_data = status_resp.json()
        if status_data.get("model_ready"):
            st.success("✅ " + status_data.get("message", "Model Ready"))
        else:
            st.warning("⏳ " + status_data.get("message", "Model Loading..."))
except:
    st.error("Could not reach backend to check model status. Is the FastAPI server running?")

uploaded_file = st.file_uploader("Choose a chest X-Ray or medical image...", type=["jpg", "jpeg", "png", "webp"])
description = st.text_area("Patient Notes / Description (Optional)", placeholder="e.g. Persistent cough for 2 weeks")

if uploaded_file is not None:
    st.image(uploaded_file, caption="Uploaded Image preview", width=300)
    
    if st.button("🔬 Analyze Image", type="primary"):
        with st.spinner("Analyzing with MediScan AI..."):
            try:
                # Prepare file for upload
                files = {"image": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                data = {"description": description}
                
                response = requests.post(
                    f"{API_URL}/api/mediscan/analyze-test",
                    files=files,
                    data=data,
                    timeout=30 # longer timeout for ML inference
                )
                
                if response.status_code == 200:
                    res = response.json()
                    st.success("Analysis Complete!")
                    
                    col1, col2 = st.columns([1, 1])
                    
                    with col1:
                        st.subheader("Results")
                        st.markdown(f"**Primary Diagnosis:** `{res['disease']}`")
                        st.markdown(f"**Confidence:** `{res['confidence']}%`")
                        
                        severity_color = {
                            "none": "green",
                            "moderate": "orange",
                            "high": "red",
                            "critical": "darkred"
                        }.get(res["severity"], "grey")
                        
                        st.markdown(f"**Severity:** :{severity_color}[{res['severity'].upper()}]")
                        
                        if res.get("is_critical"):
                            st.error("🚨 CRITICAL: Immediate medical attention may be required")
                            
                        st.markdown(f"**Clinical Info:** {res['clinical_info']}")
                        
                        st.subheader("Top Differential Diagnoses")
                        for pred in res.get("top5", []):
                            st.progress(pred["confidence"]/100, text=f"{pred['disease']} ({pred['confidence']}%)")
                            
                    with col2:
                        st.subheader("AI Heatmap (GradCAM)")
                        if res.get("gradcam_image"):
                            # Decode base64 image
                            b64_str = res["gradcam_image"].split(",")[1] if "," in res["gradcam_image"] else res["gradcam_image"]
                            img_bytes = base64.b64decode(b64_str)
                            st.image(img_bytes, caption="GradCAM Heatmap Overlay", use_container_width=True)
                        else:
                            st.info("No heatmap generated.")
                            
                    st.divider()
                    
                    st.subheader("Recommendations")
                    for rec in res.get("recommendations", []):
                        st.markdown(f"- {rec}")
                        
                    col3, col4 = st.columns(2)
                    with col3:
                        if res.get("warning_signs"):
                            st.subheader("⚠️ Warning Signs")
                            for sign in res["warning_signs"]:
                                st.markdown(f"- {sign}")
                    with col4:
                        if res.get("medications"):
                            st.subheader("💊 Common Medications")
                            for med in res["medications"]:
                                st.markdown(f"- {med}")
                                
                    st.info(f"Disclaimer: {res['disclaimer']}")
                        
                else:
                    st.error(f"Error {response.status_code}: {response.text}")
            except Exception as e:
                st.error(f"Failed to connect to API: {e}")

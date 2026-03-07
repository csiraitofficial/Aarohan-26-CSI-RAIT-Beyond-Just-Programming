import requests
import json
import sys
import os

url = 'http://127.0.0.1:8000/api/mediscan/analyze-test'

if len(sys.argv) < 2:
    print("Usage: python test_image.py <path_to_image>")
    sys.exit(1)

image_path = sys.argv[1]

if not os.path.exists(image_path):
    print(f"File not found: {image_path}")
    sys.exit(1)

print(f"Testing image: {image_path}")

try:
    with open(image_path, 'rb') as f:
        # Determine content type
        ext = os.path.splitext(image_path)[1].lower()
        if ext in ['.jpg', '.jpeg']:
            content_type = 'image/jpeg'
        elif ext == '.png':
            content_type = 'image/png'
        else:
            content_type = 'image/jpeg'
            
        files = {'image': (os.path.basename(image_path), f, content_type)}
        response = requests.post(url, files=files)

        print("Status Code:", response.status_code)
        
        try:
            resp_json = response.json()
            if 'gradcam_image' in resp_json:
                resp_json['gradcam_image'] = '<BASE64_IMAGE_OMITTED>'
            print(json.dumps(resp_json, indent=2))
        except Exception:
            print("Response text:", response.text)

except Exception as e:
    print(f"Error connecting to API: {e}")

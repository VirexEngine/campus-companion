import urllib.request
import os

base_url = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/"
models_dir = "public/models"

files = [
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1"
]

if not os.path.exists(models_dir):
    os.makedirs(models_dir)

for file in files:
    print(f"Downloading {file}...")
    try:
        # Using a browser-like User-Agent to avoid blocks
        req = urllib.request.Request(base_url + file, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(os.path.join(models_dir, file), 'wb') as f:
                f.write(response.read())
        print(f"  Success: {os.path.getsize(os.path.join(models_dir, file))} bytes")
    except Exception as e:
        print(f"  Failed: {e}")

print("Done!")

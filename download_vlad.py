import urllib.request
import os

# Vladmandic models are optimized and proven to work
base_url = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/"
models_dir = "public/models"

files = [
    ("tiny_face_detector.json", "tiny_face_detector_model-weights_manifest.json"),
    ("tiny_face_detector.bin", "tiny_face_detector_model-shard1"),
    ("face_landmark_68.json", "face_landmark_68_model-weights_manifest.json"),
    ("face_landmark_68.bin", "face_landmark_68_model-shard1"),
    ("face_recognition.json", "face_recognition_model-weights_manifest.json"),
    ("face_recognition.bin", "face_recognition_model-shard1")
]

if not os.path.exists(models_dir):
    os.makedirs(models_dir)

for src, dest in files:
    print(f"Downloading {src} and saving as {dest}...")
    try:
        url = base_url + src
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(os.path.join(models_dir, dest), 'wb') as f:
                f.write(response.read())
        print(f"  Success: {os.path.getsize(os.path.join(models_dir, dest))} bytes")
    except Exception as e:
        print(f"  Failed: {e}")

print("Done!")

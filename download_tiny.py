import urllib.request
import os

# Using vladmandic's repo which has optimized, non-sharded binaries
base_url = "https://raw.githubusercontent.com/vladmandic/face-api/master/model/"
models_dir = "public/models"

# Note: vladmandic uses different filenames than justadudewhohacks
# But we can rename them to match what face-api.js expects OR update our code.
# Actually, it's safer to download the shards correctly.
files = [
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1"
]

if not os.path.exists(models_dir):
    os.makedirs(models_dir)

for file in files:
    print(f"Downloading {file}...")
    try:
        # We'll stick to the official repo but try a different CDN/Branch
        url = f"https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/{file}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            with open(os.path.join(models_dir, file), 'wb') as f:
                f.write(response.read())
        print(f"  Success: {os.path.getsize(os.path.join(models_dir, file))} bytes")
    except Exception as e:
        print(f"  Failed: {e}")

print("Done!")

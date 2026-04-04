import urllib.request
import os
import json

base_url = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/"
models_dir = "public/models"

# We'll download the vladmandic files and rename them to standard face-api.js names
# to avoid having to change too much frontend logic, but we must fix the manifest paths.

model_sets = [
    {
        "src_json": "tiny_face_detector_model-weights_manifest.json",
        "src_bin": "tiny_face_detector_model.bin",
        "dest_json": "tiny_face_detector_model-weights_manifest.json",
        "dest_shard": "tiny_face_detector_model-shard1"
    },
    {
        "src_json": "face_landmark_68_model-weights_manifest.json",
        "src_bin": "face_landmark_68_model.bin",
        "dest_json": "face_landmark_68_model-weights_manifest.json",
        "dest_shard": "face_landmark_68_model-shard1"
    },
    {
        "src_json": "face_recognition_model-weights_manifest.json",
        "src_bin": "face_recognition_model.bin",
        "dest_json": "face_recognition_model-weights_manifest.json",
        "dest_shard": "face_recognition_model-shard1"
    }
]

if not os.path.exists(models_dir):
    os.makedirs(models_dir)

for m in model_sets:
    print(f"Processing {m['src_json']}...")
    try:
        # Download bin
        print(f"  Downloading weights...")
        urllib.request.urlretrieve(base_url + m['src_bin'], os.path.join(models_dir, m['dest_shard']))
        
        # Download json
        print(f"  Downloading manifest...")
        urllib.request.urlretrieve(base_url + m['src_json'], os.path.join(models_dir, m['dest_json']))
        
        # Patch manifest JSON to point to the new shard name
        with open(os.path.join(models_dir, m['dest_json']), 'r') as f:
            data = json.load(f)
        
        # Vladmandic models usually have one path array at the root or per weight block
        if isinstance(data, list):
            for block in data:
                if 'paths' in block:
                    block['paths'] = [m['dest_shard']]
        
        with open(os.path.join(models_dir, m['dest_json']), 'w') as f:
            json.dump(data, f)
            
        print(f"  Success: {m['dest_json']} patched to point to {m['dest_shard']}")
    except Exception as e:
        print(f"  Failed set {m['src_json']}: {e}")

print("Done!")

import os
import google.generativeai as genai

# Try to find the .env file in the current or backend directory
env_path = 'backend/.env' if os.path.exists('backend/.env') else '.env'

api_key = None
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                api_key = line.split('=')[1].strip()
                break

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in .env")
else:
    genai.configure(api_key=api_key)
    print(f"Checking available models for your API key...")
    try:
        models = genai.list_models()
        found = False
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                print(f"  - {m.name}")
                found = True
        
        if not found:
            print("  (No models found with generateContent support)")
            
    except Exception as e:
        print(f"❌ API Error: {e}")

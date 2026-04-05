import sys
import os

# Add the current directory to sys.path so we can import the backend folder
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app

# This is required for Vercel to recognize the Flask app
# The variable must be named 'app'
if __name__ == "__main__":
    app.run()

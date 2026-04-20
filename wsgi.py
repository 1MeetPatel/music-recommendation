import sys
import os

# Add the backend directory to Python path so all imports work
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from app import app

if __name__ == '__main__':
    app.run()

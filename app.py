from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from spotify_service import SpotifyService

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

load_dotenv() # Load variables from .env

app = Flask(__name__)
# Enable CORS to allow the frontend to access the API
CORS(app)

spotify_service = SpotifyService()

@app.route('/api/recommend', methods=['GET'])
def recommend():
    mood = request.args.get('mood')
    if not mood:
        return jsonify({"error": "Mood parameter is required"}), 400

    logging.info(f"Received request for mood: {mood}")
    result = spotify_service.recommend_songs(mood)
    
    if "error" in result and not result.get("songs"):
        return jsonify(result), 500
        
    return jsonify({"songs": result.get("songs")}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

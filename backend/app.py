from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import os
from spotify_service import SpotifyService

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

load_dotenv() # Load variables from .env

# Point Flask to serve the frontend folder
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
# Enable CORS to allow the frontend to access the API
CORS(app)

@app.route('/')
def serve_frontend():
    return send_from_directory(FRONTEND_DIR, 'index.html')

spotify_service = SpotifyService()

@app.route('/api/recommend', methods=['GET'])
def recommend():
    mood = request.args.get('mood')
    limit = request.args.get('limit', default=15, type=int)
    if not mood:
        return jsonify({"error": "Mood parameter is required"}), 400

    logging.info(f"Received recommend request for mood: {mood}, limit: {limit}")
    result = spotify_service.recommend_songs(mood, limit)
    
    if "error" in result and not result.get("songs"):
        return jsonify(result), 500
        
    return jsonify({"songs": result.get("songs")}), 200

@app.route('/api/search', methods=['GET'])
def search():
    query = request.args.get('q')
    limit = request.args.get('limit', default=15, type=int)
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    logging.info(f"Received search request for query: {query}, limit: {limit}")
    result = spotify_service.search_songs(query, limit)
    
    if "error" in result and not result.get("songs"):
        return jsonify(result), 500
        
    return jsonify({"songs": result.get("songs")}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)


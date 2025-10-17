#!/usr/bin/env python3
"""
Simple Flask server to serve the HackathonAgent frontend and API.
"""

import os
import json
import uuid
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from simple_workflow import run_hackathon_pipeline

load_dotenv()

# Create Flask app
app = Flask(__name__)
CORS(app)

# Store sessions in memory (in production, use Redis or database)
sessions = {}

# Serve static files
@app.route('/')
def index():
    """Serve the main page."""
    return send_file('frontend/out/index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files."""
    # Handle API routes
    if path.startswith('api/'):
        return "API endpoint not found", 404
    
    # Try to serve the file
    try:
        return send_file(f'frontend/out/{path}')
    except FileNotFoundError:
        # For SPA routing, serve index.html
        try:
            return send_file('frontend/out/index.html')
        except FileNotFoundError:
            return "Frontend not found", 404

@app.route('/api/start-hackathon', methods=['POST'])
def start_hackathon():
    """Start a new hackathon project."""
    try:
        data = request.get_json()
        user_input = data.get('idea', '').strip()
        
        if not user_input:
            return jsonify({'error': 'Project idea is required'}), 400
        
        # Create a new session
        session_id = str(uuid.uuid4())
        
        # Run the hackathon pipeline
        print(f"🚀 Starting hackathon for: {user_input}")
        result = run_hackathon_pipeline(user_input)
        
        # Store the session
        sessions[session_id] = {
            'idea': user_input,
            'result': result,
            'status': 'completed'
        }
        
        # Extract the generated content
        messages = result.get('messages', [])
        generated_content = []
        
        for msg in messages:
            if isinstance(msg, dict) and msg.get('role') == 'assistant':
                content = msg.get('content', '')
                if content and len(content) > 50:
                    try:
                        # Try to parse as JSON
                        parsed = json.loads(content)
                        generated_content.append(parsed)
                    except:
                        # If not JSON, add as text
                        generated_content.append({'type': 'text', 'content': content})
        
        return jsonify({
            'session_id': session_id,
            'status': 'completed',
            'idea': user_input,
            'generated_content': generated_content,
            'summary': {
                'ideation': 'Project ideas generated',
                'research': 'Research and planning completed', 
                'coding': 'Codebase generated',
                'deployment': 'Deployment configured',
                'presentation': 'Presentation materials created'
            }
        })
        
    except Exception as e:
        print(f"Error in start_hackathon: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session details."""
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    session = sessions[session_id]
    return jsonify(session)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'HackathonAgent API is running'})

if __name__ == '__main__':
    print("🚀 Starting HackathonAgent Backend API...")
    print("Frontend will be served from: frontend/out")
    print("API endpoints available at: http://localhost:3001/api/")
    
    app.run(debug=True, host='0.0.0.0', port=3001)

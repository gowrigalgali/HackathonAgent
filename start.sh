#!/bin/bash
# HackathonAgent Startup Script

echo "🚀 Starting HackathonAgent - Complete Full-Stack Application"
echo "============================================================"

# Get the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "📁 Project directory: $PROJECT_DIR"
echo "📁 Frontend directory: $FRONTEND_DIR"

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source "$PROJECT_DIR/ayoo/bin/activate"

# Check if frontend is built
if [ ! -d "$FRONTEND_DIR/out" ]; then
    echo "🔨 Building frontend..."
    cd "$FRONTEND_DIR"
    npm run build
    cd "$PROJECT_DIR"
else
    echo "✅ Frontend already built"
fi

echo ""
echo "🚀 HackathonAgent is ready!"
echo "============================================================"
echo "🌐 Backend API: http://localhost:3001"
echo "🌐 Frontend: http://localhost:3001 (served by backend)"
echo "📋 API endpoints: http://localhost:3001/api/"
echo "============================================================"
echo "💡 Try entering a project idea like:"
echo "   - 'AI recipe generator web app'"
echo "   - 'Smart home dashboard'"
echo "   - 'Fitness tracking mobile app'"
echo "============================================================"
echo "🛑 Press Ctrl+C to stop the server"
echo "============================================================"

# Start the backend server
cd "$PROJECT_DIR"
python3 backend_api.py

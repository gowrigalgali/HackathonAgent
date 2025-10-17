#!/bin/bash
# HackathonAgent Complete Demo Script

echo "🚀 HackathonAgent - Complete End-to-End Demo"
echo "=============================================="
echo ""

# Check if server is running
echo "🔍 Checking if backend server is running..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:3001"
else
    echo "❌ Backend server is not running. Starting it now..."
    echo "Please run: source ayoo/bin/activate && python3 backend_api.py"
    echo "Then run this demo script again."
    exit 1
fi

echo ""
echo "🌐 Frontend is available at: http://localhost:3001"
echo "📋 API endpoints: http://localhost:3001/api/"
echo ""

echo "🎯 Demo Instructions:"
echo "====================="
echo ""
echo "1. 🧠 IDEA STUDIO (http://localhost:3001/idea-studio)"
echo "   - Enter a project idea like 'AI recipe generator web app'"
echo "   - Click 'Generate Ideas'"
echo "   - See AI-generated project ideas with pitches, tech stacks, and novelty"
echo "   - Copy pitches, create GitHub repos, or send to Repo Builder"
echo ""

echo "2. ⚙️ REPO BUILDER (http://localhost:3001/repo-builder)"
echo "   - Configure repository name and description"
echo "   - Click 'Generate Codebase'"
echo "   - Watch live console output"
echo "   - See generated files, README, and requirements"
echo "   - Download files or create GitHub repository"
echo ""

echo "3. 🧪 LIVE TEST (http://localhost:3001/live-test)"
echo "   - Run tests and see real-time results"
echo "   - Monitor performance metrics"
echo "   - View live logs"
echo "   - Rebuild and deploy projects"
echo ""

echo "4. 🎤 AI PRESENTER (http://localhost:3001/ai-presenter)"
echo "   - Enter project title"
echo "   - Choose voice and tone"
echo "   - Generate presentation materials"
echo "   - Create slides outline, pitch, and demo script"
echo "   - Render MP4 videos"
echo ""

echo "5. 🏠 DASHBOARD (http://localhost:3001/dashboard)"
echo "   - Quick project generation from main page"
echo "   - See complete pipeline results"
echo "   - Navigate to all other sections"
echo ""

echo "🔥 Complete Workflow Demo:"
echo "========================="
echo ""
echo "1. Go to Dashboard → Enter 'Smart home dashboard' → Click 'Start Project'"
echo "2. See complete pipeline results with all 5 agents working"
echo "3. Navigate to Idea Studio to refine ideas"
echo "4. Go to Repo Builder to generate code"
echo "5. Use Live Test to run tests and monitor"
echo "6. Create presentation in AI Presenter"
echo ""

echo "🎉 Features Demonstrated:"
echo "========================="
echo "✅ AI Agents: Ideation, Research, Coding, Deployment, Presentation"
echo "✅ Real-time Generation: Live console output and progress"
echo "✅ Complete Codebases: Files, README, requirements"
echo "✅ GitHub Integration: Repository creation and management"
echo "✅ Testing & Monitoring: Live tests, metrics, logs"
echo "✅ Presentation Generation: Slides, pitches, demo scripts"
echo "✅ Modern UI: Dark theme, animations, responsive design"
echo "✅ Full Integration: Frontend ↔ Backend ↔ AI Agents"
echo ""

echo "🚀 Ready to demo! Open http://localhost:3001 in your browser"
echo "============================================================="

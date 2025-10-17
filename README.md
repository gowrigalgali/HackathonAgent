# 🚀 HackathonAgent - Complete Full-Stack Application

A powerful AI-driven hackathon project generator that takes your idea from concept to deployment in minutes!

## ✨ What It Does

HackathonAgent uses multiple AI agents working together to:
- 🧠 **Generate creative project ideas** based on your input
- 🔍 **Research and plan** the technical approach
- 💻 **Generate complete codebases** with frontend, backend, and documentation
- 🚀 **Configure deployment** and hosting
- 🎤 **Create presentation materials** including slides and pitch

## 🏗️ Architecture

### Backend (Python + LangGraph + Google Gemini)
- **AI Agents**: Ideation, Research, Coding, Deployment, Presentation
- **LangGraph**: Orchestrates agent workflow
- **Google Gemini 2.5 Flash**: Powers all AI agents
- **Flask API**: Serves frontend and handles requests

### Frontend (Next.js + React + Tailwind)
- **Dark GitHub-like theme** with modern UI
- **Real-time project generation** with loading states
- **Responsive design** for all devices
- **shadcn/ui components** for consistent styling

## 🚀 Quick Start

### Prerequisites
- Python 3.13+ with virtual environment
- Node.js 20+ with npm
- Google Gemini API key

### 1. Setup Environment
```bash
# Clone and navigate to project
cd HackathonAgent

# Activate virtual environment
source ayoo/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Configure API Keys
Create a `.env` file in the project root:
```bash
GOOGLE_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### 3. Start the Application
```bash
# Option 1: Use the startup script
./start.sh

# Option 2: Manual startup
source ayoo/bin/activate
cd frontend && npm run build && cd ..
python3 backend_api.py
```

### 4. Access the Application
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api/
- **Health Check**: http://localhost:3001/api/health

## 🎯 How to Use

1. **Open the application** in your browser
2. **Enter your project idea** (e.g., "AI recipe generator web app")
3. **Click "Start Project"** and watch the magic happen!
4. **View the generated content** including:
   - Project ideas with detailed pitches
   - Research papers and APIs
   - Complete codebase with files
   - Deployment configuration
   - Presentation materials

## 🔧 API Endpoints

### POST /api/start-hackathon
Start a new hackathon project generation.

**Request:**
```json
{
  "idea": "AI recipe generator web app"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "status": "completed",
  "idea": "AI recipe generator web app",
  "generated_content": [...],
  "summary": {
    "ideation": "Project ideas generated",
    "research": "Research and planning completed",
    "coding": "Codebase generated",
    "deployment": "Deployment configured",
    "presentation": "Presentation materials created"
  }
}
```

### GET /api/health
Health check endpoint.

### GET /api/session/{session_id}
Get session details.

## 🧠 AI Agents

### 1. Ideation Agent
- Generates creative project ideas
- Provides detailed pitches and tech stacks
- Identifies unique value propositions

### 2. Research Planning Agent
- Finds relevant research papers
- Identifies useful APIs and libraries
- Creates technical roadmap

### 3. Coding Agent
- Generates complete codebases
- Creates frontend, backend, and documentation
- Includes proper project structure

### 4. Deployment Agent
- Configures deployment settings
- Provides hosting recommendations
- Generates deployment URLs

### 5. Presentation Agent
- Creates slide outlines
- Generates pitch content
- Provides demo scripts and resources

## 🎨 Frontend Features

- **Dark GitHub-like theme** with custom colors
- **Real-time project generation** with progress indicators
- **Responsive design** for mobile and desktop
- **Modern animations** with Framer Motion
- **Component library** using shadcn/ui
- **TypeScript support** for type safety

## 📁 Project Structure

```
HackathonAgent/
├── agents.py              # AI agent definitions
├── graph.py               # LangGraph workflow
├── state.py               # Agent state management
├── simple_workflow.py     # Simplified workflow
├── backend_api.py         # Flask API server
├── requirements.txt       # Python dependencies
├── start.sh              # Startup script
├── frontend/             # Next.js frontend
│   ├── app/             # App router pages
│   ├── components/       # React components
│   └── package.json     # Node dependencies
└── ayoo/                # Python virtual environment
```

## 🔧 Development

### Backend Development
```bash
source ayoo/bin/activate
python3 simple_workflow.py  # Test agents
python3 test_integration.py  # Test integration
```

### Frontend Development
```bash
cd frontend
npm run dev  # Development server
npm run build  # Production build
```

## 🚀 Deployment

The application is ready for deployment on:
- **Vercel** (frontend)
- **Railway/Render** (backend)
- **Docker** (containerized)

## 🎉 Example Output

When you enter "AI recipe generator web app", you get:

1. **Ideation**: "FlavorForge AI" - A personalized recipe generator
2. **Research**: 5 research papers, 3 APIs, 3 libraries
3. **Coding**: Complete Flask app with HTML, CSS, JS
4. **Deployment**: Configured hosting with URL
5. **Presentation**: 10-slide outline with pitch and demo script

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the logs in the terminal
2. Verify your API keys are set correctly
3. Ensure all dependencies are installed
4. Check that ports 3001 is available

---

**🎯 Ready to build your next hackathon project in minutes? Start HackathonAgent now!**

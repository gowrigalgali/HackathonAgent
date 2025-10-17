#!/usr/bin/env python3
"""
Startup script for HackathonAgent - Complete Full-Stack Application
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

def start_hackathon_agent():
    """Start the complete HackathonAgent system."""
    print("🚀 Starting HackathonAgent - Complete Full-Stack Application")
    print("=" * 60)
    
    # Get the project directory
    project_dir = Path(__file__).parent.absolute()
    frontend_dir = project_dir / "frontend"
    
    print(f"📁 Project directory: {project_dir}")
    print(f"📁 Frontend directory: {frontend_dir}")
    
    # Check if frontend is built
    out_dir = frontend_dir / "out"
    if not out_dir.exists():
        print("🔨 Building frontend...")
        try:
            result = subprocess.run(
                ["npm", "run", "build"], 
                cwd=frontend_dir, 
                capture_output=True, 
                text=True, 
                timeout=120
            )
            if result.returncode == 0:
                print("✅ Frontend built successfully!")
            else:
                print(f"❌ Frontend build failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("❌ Frontend build timed out")
            return False
        except Exception as e:
            print(f"❌ Frontend build error: {e}")
            return False
    else:
        print("✅ Frontend already built")
    
    # Start the backend server
    print("\n🌐 Starting backend server...")
    try:
        # Import and start the Flask app
        sys.path.append(str(project_dir))
        from backend_api import app
        
        print("🚀 HackathonAgent is ready!")
        print("=" * 60)
        print("🌐 Open your browser and go to: http://localhost:3001")
        print("📋 API endpoints available at: http://localhost:3001/api/")
        print("=" * 60)
        print("💡 Try entering a project idea like:")
        print("   - 'AI recipe generator web app'")
        print("   - 'Smart home dashboard'")
        print("   - 'Fitness tracking mobile app'")
        print("=" * 60)
        print("🛑 Press Ctrl+C to stop the server")
        print("=" * 60)
        
        # Start the server
        app.run(debug=True, host='0.0.0.0', port=3001)
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True
    except Exception as e:
        print(f"❌ Server error: {e}")
        return False

if __name__ == "__main__":
    success = start_hackathon_agent()
    sys.exit(0 if success else 1)

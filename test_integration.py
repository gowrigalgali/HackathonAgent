#!/usr/bin/env python3
"""
Test the complete hackathon workflow integration.
"""

import os
import sys
import json
from dotenv import load_dotenv

# Add current directory to path
sys.path.append('.')

# Load environment variables
load_dotenv()

def test_hackathon_workflow():
    """Test the complete hackathon workflow."""
    print("🧪 Testing HackathonAgent Integration...")
    print("=" * 50)
    
    # Test 1: Check if agents work
    print("\n1️⃣ Testing Agents...")
    try:
        from simple_workflow import run_hackathon_pipeline
        
        # Test with a simple idea
        test_idea = "AI recipe generator web app"
        print(f"Testing with idea: {test_idea}")
        
        result = run_hackathon_pipeline(test_idea)
        
        if result and 'messages' in result:
            print("✅ Agents working correctly!")
            print(f"Generated {len(result['messages'])} messages")
            
            # Show first agent output
            for i, msg in enumerate(result['messages'][:2]):
                if isinstance(msg, dict) and msg.get('role') == 'assistant':
                    content = msg.get('content', '')
                    if content:
                        print(f"\n📋 Agent Output {i+1}:")
                        print(content[:200] + "..." if len(content) > 200 else content)
        else:
            print("❌ Agents failed")
            return False
            
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        return False
    
    # Test 2: Check API structure
    print("\n2️⃣ Testing API Structure...")
    try:
        from backend_api import app
        
        # Test health endpoint
        with app.test_client() as client:
            response = client.get('/api/health')
            if response.status_code == 200:
                print("✅ API health check working!")
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False
    
    # Test 3: Test hackathon endpoint
    print("\n3️⃣ Testing Hackathon Endpoint...")
    try:
        with app.test_client() as client:
            response = client.post('/api/start-hackathon', 
                                 json={'idea': 'Test AI app'},
                                 content_type='application/json')
            
            if response.status_code == 200:
                data = response.get_json()
                if 'session_id' in data and 'generated_content' in data:
                    print("✅ Hackathon endpoint working!")
                    print(f"Session ID: {data['session_id']}")
                    print(f"Generated content items: {len(data['generated_content'])}")
                else:
                    print("❌ Invalid response format")
                    return False
            else:
                print(f"❌ Hackathon endpoint failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Hackathon endpoint test failed: {e}")
        return False
    
    print("\n🎉 All tests passed! Integration is working correctly!")
    print("=" * 50)
    print("🚀 Ready to start the server:")
    print("   python3 backend_api.py")
    print("🌐 Then open: http://localhost:8000")
    
    return True

if __name__ == "__main__":
    success = test_hackathon_workflow()
    sys.exit(0 if success else 1)

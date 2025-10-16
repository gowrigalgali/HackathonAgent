import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()

# Initialize Gemini
gemini_api_key = os.getenv("GOOGLE_API_KEY")
if not gemini_api_key:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=gemini_api_key,
    temperature=0.1,
    convert_system_message_to_human=True
)

def ideation_agent(user_input: str) -> dict:
    """Generate 6 hackathon project ideas based on user input."""
    prompt = f"""
    You are an ideation expert for hackathon projects. Given the user input: "{user_input}"
    
    Generate 6 distinct, creative hackathon project ideas as a JSON array.
    Each idea should have: title, pitch (1-2 sentences), tech (technologies used), novelty (what makes it unique).
    
    Return ONLY valid JSON in this format:
    [
        {{
            "title": "Project Name",
            "pitch": "Brief description of what it does",
            "tech": "React, Python, AI, etc.",
            "novelty": "What makes this unique"
        }}
    ]
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        # Try to parse JSON from response
        content = response.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
        
        parsed = json.loads(content)
        return {"success": True, "ideas": parsed}
    except Exception as e:
        return {"success": False, "error": str(e), "ideas": []}

def research_agent(idea: str) -> dict:
    """Research the given idea and provide resources."""
    prompt = f"""
    You are a research expert. For the idea: "{idea}"
    
    Provide research resources as JSON with:
    - papers: 3 relevant research papers with title, url, summary
    - apis: 3 relevant APIs with name, url, summary  
    - libraries: 3 relevant libraries with name, url, summary
    
    Return ONLY valid JSON:
    {{
        "papers": [
            {{"title": "Paper Title", "url": "https://example.com", "summary": "Brief summary"}}
        ],
        "apis": [
            {{"name": "API Name", "url": "https://api.example.com", "summary": "What it does"}}
        ],
        "libraries": [
            {{"name": "Library Name", "url": "https://github.com/example", "summary": "What it does"}}
        ]
    }}
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
        
        parsed = json.loads(content)
        return {"success": True, "research": parsed}
    except Exception as e:
        return {"success": False, "error": str(e), "research": {}}

def coding_agent(idea: str) -> dict:
    """Generate starter code for the idea."""
    prompt = f"""
    You are a coding expert. For the idea: "{idea}"
    
    Generate a starter codebase as JSON with:
    - files: array of {{path, content}} for key files
    - readme: markdown content for README.md
    - requirements: array of Python dependencies
    
    Return ONLY valid JSON:
    {{
        "files": [
            {{"path": "app.py", "content": "# Python code here"}},
            {{"path": "index.html", "content": "<!DOCTYPE html>..."}}
        ],
        "readme": "# Project README\\n\\nDescription...",
        "requirements": ["flask", "requests", "python-dotenv"]
    }}
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
        
        parsed = json.loads(content)
        return {"success": True, "code": parsed}
    except Exception as e:
        return {"success": False, "error": str(e), "code": {}}

def presentation_agent(idea: str) -> dict:
    """Generate presentation materials for the idea."""
    prompt = f"""
    You are a presentation expert. For the idea: "{idea}"
    
    Create presentation materials as JSON with:
    - slides_outline: array of slide titles
    - pitch: 200-word pitch
    - demo_script: step-by-step demo script
    - resources: array of additional resources
    
    Return ONLY valid JSON:
    {{
        "slides_outline": ["Title Slide", "Problem", "Solution", "Demo", "Impact", "Next Steps"],
        "pitch": "200-word compelling pitch about the project...",
        "demo_script": "1. Show the problem\\n2. Demo the solution\\n3. Show results",
        "resources": ["GitHub repo", "Live demo", "Documentation"]
    }}
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith('```json'):
            content = content[7:-3].strip()
        elif content.startswith('```'):
            content = content[3:-3].strip()
        
        parsed = json.loads(content)
        return {"success": True, "presentation": parsed}
    except Exception as e:
        return {"success": False, "error": str(e), "presentation": {}}

def run_hackathon_pipeline(user_input: str):
    """Run the complete hackathon pipeline."""
    print(f"🚀 Starting hackathon pipeline for: {user_input}")
    
    # Step 1: Ideation
    print("\n🧠 Step 1: Ideation")
    ideation_result = ideation_agent(user_input)
    if not ideation_result["success"]:
        print(f"❌ Ideation failed: {ideation_result['error']}")
        return
    
    ideas = ideation_result["ideas"]
    print(f"✅ Generated {len(ideas)} ideas:")
    for i, idea in enumerate(ideas[:3], 1):  # Show first 3
        print(f"  {i}. {idea['title']}: {idea['pitch']}")
    
    # Pick the first idea for the pipeline
    selected_idea = ideas[0]["title"]
    print(f"\n🎯 Selected idea: {selected_idea}")
    
    # Step 2: Research
    print("\n🔍 Step 2: Research")
    research_result = research_agent(selected_idea)
    if research_result["success"]:
        research = research_result["research"]
        print(f"✅ Found {len(research.get('papers', []))} papers, {len(research.get('apis', []))} APIs, {len(research.get('libraries', []))} libraries")
    else:
        print(f"❌ Research failed: {research_result['error']}")
    
    # Step 3: Coding
    print("\n💻 Step 3: Coding")
    coding_result = coding_agent(selected_idea)
    if coding_result["success"]:
        code = coding_result["code"]
        print(f"✅ Generated {len(code.get('files', []))} files, README, and requirements")
    else:
        print(f"❌ Coding failed: {coding_result['error']}")
    
    # Step 4: Presentation
    print("\n🎤 Step 4: Presentation")
    presentation_result = presentation_agent(selected_idea)
    if presentation_result["success"]:
        presentation = presentation_result["presentation"]
        print(f"✅ Created {len(presentation.get('slides_outline', []))} slides and pitch")
    else:
        print(f"❌ Presentation failed: {presentation_result['error']}")
    
    print("\n🎉 Hackathon pipeline completed!")
    return {
        "ideas": ideas,
        "research": research_result.get("research", {}),
        "code": coding_result.get("code", {}),
        "presentation": presentation_result.get("presentation", {})
    }

if __name__ == "__main__":
    user_input = input("Enter your hackathon project idea: ")
    result = run_hackathon_pipeline(user_input)

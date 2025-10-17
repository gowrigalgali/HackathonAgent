#!/usr/bin/env python3
"""
Simple working version of the hackathon agent workflow.
This bypasses LangGraph complexity and directly executes the agents in sequence.
"""

import os
from dotenv import load_dotenv
from agents import ideation_agent, research_planning_agent, coding_agent, deployment_agent, presentation_agent
from state import get_initial_state

load_dotenv()

def run_hackathon_pipeline(user_input: str):
    """Run the complete hackathon pipeline with all agents."""
    print(f"🚀 Starting hackathon pipeline for: {user_input}")
    print("=" * 60)
    
    # Initialize state
    state = get_initial_state(user_input)
    
    # Step 1: Ideation
    print("\n🧠 Step 1: Ideation Agent")
    print("-" * 30)
    try:
        ideation_result = ideation_agent(state)
        if ideation_result and "messages" in ideation_result:
            content = ideation_result["messages"][0].get("content", "")
            print("✅ Ideation completed!")
            print(f"Generated ideas: {content[:200]}...")
            state["messages"].extend(ideation_result["messages"])
        else:
            print("❌ Ideation failed")
            return
    except Exception as e:
        print(f"❌ Ideation error: {e}")
        return
    
    # Step 2: Research Planning
    print("\n🔍 Step 2: Research Planning Agent")
    print("-" * 30)
    try:
        research_result = research_planning_agent(state)
        if research_result and "messages" in research_result:
            content = research_result["messages"][0].get("content", "")
            print("✅ Research planning completed!")
            print(f"Research output: {content[:200]}...")
            state["messages"].extend(research_result["messages"])
        else:
            print("❌ Research planning failed")
    except Exception as e:
        print(f"❌ Research planning error: {e}")
    
    # Step 3: Coding
    print("\n💻 Step 3: Coding Agent")
    print("-" * 30)
    try:
        coding_result = coding_agent(state)
        if coding_result and "messages" in coding_result:
            content = coding_result["messages"][0].get("content", "")
            print("✅ Coding completed!")
            print(f"Code output: {content[:200]}...")
            state["messages"].extend(coding_result["messages"])
        else:
            print("❌ Coding failed")
    except Exception as e:
        print(f"❌ Coding error: {e}")
    
    # Step 4: Deployment
    print("\n🚀 Step 4: Deployment Agent")
    print("-" * 30)
    try:
        deployment_result = deployment_agent(state)
        if deployment_result and "messages" in deployment_result:
            content = deployment_result["messages"][0].get("content", "")
            print("✅ Deployment completed!")
            print(f"Deployment output: {content[:200]}...")
            state["messages"].extend(deployment_result["messages"])
        else:
            print("❌ Deployment failed")
    except Exception as e:
        print(f"❌ Deployment error: {e}")
    
    # Step 5: Presentation
    print("\n🎤 Step 5: Presentation Agent")
    print("-" * 30)
    try:
        presentation_result = presentation_agent(state)
        if presentation_result and "messages" in presentation_result:
            content = presentation_result["messages"][0].get("content", "")
            print("✅ Presentation completed!")
            print(f"Presentation output: {content[:200]}...")
            state["messages"].extend(presentation_result["messages"])
        else:
            print("❌ Presentation failed")
    except Exception as e:
        print(f"❌ Presentation error: {e}")
    
    print("\n🎉 Hackathon pipeline completed successfully!")
    print("=" * 60)
    
    # Show all generated content
    print("\n📋 Complete Generated Content:")
    print("=" * 60)
    for i, msg in enumerate(state.get("messages", []), 1):
        if isinstance(msg, dict) and msg.get("role") == "assistant":
            content = msg.get("content", "")
            if content and len(content) > 50:
                print(f"\n--- Agent Output {i} ---")
                print(content)
                print("-" * 40)
    
    return state

def main():
    print("🚀 Hackathon Agent - Simple Workflow")
    print("Type your project idea or 'quit' to exit.")
    
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() == 'quit':
            print("Goodbye!")
            break
        
        if user_input.strip():
            run_hackathon_pipeline(user_input)
        else:
            print("Please enter a project idea.")

if __name__ == "__main__":
    main()

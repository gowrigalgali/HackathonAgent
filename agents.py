import os
import requests
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import create_tool_calling_agent, AgentExecutor
from typing import TypedDict, List
from langchain_core.messages import HumanMessage
# FIX: Import GitHubAPIWrapper from the correct module
from langchain_community.utilities.github import GitHubAPIWrapper
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field
from enum import Enum

load_dotenv()

# =====================================================================
# === Configure the LLM and toolkits ===
# =====================================================================
# Initialize Google Gemini LLM
gemini_api_key = os.getenv("GOOGLE_API_KEY")
if not gemini_api_key:
    raise ValueError("GOOGLE_API_KEY environment variable is required")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=gemini_api_key,
    temperature=0.1,
    convert_system_message_to_human=True
)

# Web search tool using Tavily
web_search_tool = TavilySearchResults()

# GitHub tools (using a simplified API wrapper for demonstration)
# Instantiate only if env vars are present to avoid import-time failures
github_repo = os.getenv("GITHUB_REPOSITORY")
github_token = os.getenv("GITHUB_TOKEN")
github_api_wrapper = None
if github_repo:
    try:
        github_api_wrapper = GitHubAPIWrapper(
            github_repository=github_repo,
            github_token=github_token
        )
    except Exception:
        github_api_wrapper = None
@tool
def github_create_branch(repo: str, branch: str) -> str:
    """Creates a new branch in a GitHub repository."""
    if not github_api_wrapper:
        return (
            "GitHub not configured. Set GITHUB_REPOSITORY (and optionally GITHUB_TOKEN) "
            "in your environment/.env."
        )
    # This is a simplified function; you would use pygithub or similar here
    return github_api_wrapper.run(
        { "action": "create_branch", "repo": repo, "branch": branch }
    )

@tool
def github_create_pull_request(repo: str, title: str, head: str, base: str) -> str:
    """Creates a pull request on GitHub."""
    if not github_api_wrapper:
        return (
            "GitHub not configured. Set GITHUB_REPOSITORY (and optionally GITHUB_TOKEN) "
            "in your environment/.env."
        )
    return github_api_wrapper.run(
        { "action": "create_pull_request", "repo": repo, "title": title, "head": head, "base": base }
    )

@tool
def github_commit_file(repo: str, file_path: str, content: str, message: str) -> str:
    """Commits a file with specified content to a GitHub repository."""
    if not github_api_wrapper:
        return (
            "GitHub not configured. Set GITHUB_REPOSITORY (and optionally GITHUB_TOKEN) "
            "in your environment/.env."
        )
    return github_api_wrapper.run(
        { "action": "commit_file", "repo": repo, "file_path": file_path, "content": content, "message": message }
    )

# Vercel Deployment Hook tool
@tool
def vercel_deploy_hook() -> str:
    """Triggers a deployment on Vercel using a pre-configured Deploy Hook."""
    deploy_hook_url = os.getenv("VERCEL_DEPLOY_HOOK_URL")
    if not deploy_hook_url:
        return "Error: VERCEL_DEPLOY_HOOK_URL is not set."
    response = requests.post(deploy_hook_url)
    if response.status_code == 201 or response.status_code == 200:
        return "Deployment triggered successfully on Vercel."
    else:
        return f"Error triggering deployment: {response.text}"

# =====================================================================
# === Helper to create a worker agent ===
# =====================================================================

def create_worker_agent(role: str, tools: list, instruction: str = ""):
    """Creates a simple agent that directly uses the LLM without complex tool calling."""
    def agent_func(state):
        # Get the last user message
        messages = state.get("messages", [])
        if not messages:
            return {"messages": [{"role": "assistant", "content": "No input provided."}]}
        
        # Find the original user input
        user_input = ""
        for msg in messages:
            if isinstance(msg, dict) and msg.get("role") == "user":
                user_input = msg.get("content", "")
                break
            elif hasattr(msg, "content") and hasattr(msg, "__class__"):
                user_input = str(msg.content)
                break
        
        if not user_input:
            user_input = "AI recipe generator web app"  # fallback
        
        # Create the prompt based on role
        system_prompt = f"""You are a helpful AI assistant specialized in {role}. 
        You have access to a set of tools to perform your tasks. 
        Prefer deterministic, concise outputs. If some information is missing, assume reasonable defaults or ask one concise question, then proceed.

        Output policy: Unless explicitly told otherwise, RETURN ONLY JSON with no extra prose. 
        Follow the exact JSON shape requested by the user/task. 
        {instruction}

        User input: {user_input}
        
        Please provide your response as JSON only."""
        
        try:
            response = llm.invoke([HumanMessage(content=system_prompt)])
            content = response.content.strip()
            
            # Clean up JSON if wrapped in markdown
            if content.startswith('```json'):
                content = content[7:-3].strip()
            elif content.startswith('```'):
                content = content[3:-3].strip()
            
            return {"messages": [{"role": "assistant", "content": content}]}
        except Exception as e:
            return {"messages": [{"role": "assistant", "content": f"Error: {str(e)}"}]}
    
    return agent_func

# =====================================================================
# === Define each agent ===
# =====================================================================
ideation_agent = create_worker_agent(
    "ideation and brainstorming",
    tools=[web_search_tool],
    instruction=(
        "\nExpected JSON shape: [{{\"title\", \"pitch\", \"tech\", \"novelty\"}}] for one idea."
    ),
)

research_planning_agent = create_worker_agent(
    "market research and project planning",
    tools=[web_search_tool],
    instruction=(
        "\nExpected JSON: {{\"papers\": [ {\"title\", \"url\", \"summary\"} x5 ], "
        "\"apis\": [ {\"name\", \"url\", \"summary\"} x3 ], "
        "\"libraries\": [ {\"name\", \"url\", \"summary\"} x3 ]}}"
    ),
)

coding_agent = create_worker_agent(
    "writing and managing code",
    tools=[web_search_tool, github_create_branch, github_create_pull_request, github_commit_file],
    instruction=(
        "\nExpected JSON: {{\"files\": [ {\"path\", \"content\"} ], \"readme\": string, \"requirements\": [string] }}."
    ),
)

deployment_agent = create_worker_agent(
    "deploying web applications",
    tools=[vercel_deploy_hook],
    instruction=(
        "\nExpected JSON: {{\"deploy_triggered\": boolean, \"url\": string | null, \"notes\": string }}."
    ),
)

presentation_agent = create_worker_agent(
    "generating presentation content",
    tools=[web_search_tool],
    instruction=(
        "\nExpected JSON: {{\"slides_outline\": [string], \"pitch\": string, \"demo_script\": string, \"resources\": [string], \"slides_link\": string | null }}."
    ),
)

# =====================================================================
# === Supervisor Agent logic remains the same ===
# =====================================================================
class AgentName(str, Enum):
    SUPERVISOR = "supervisor"
    IDEATION = "ideation_agent"
    RESEARCH_PLANNING = "research_planning_agent"
    CODING = "coding_agent"
    DEPLOYMENT = "deployment_agent"
    PRESENTATION = "presentation_agent"
    HUMAN_IN_THE_LOOP = "human_in_the_loop"
    FINISH = "FINISH"

class SupervisorOutput(BaseModel):
    next_agent: AgentName = Field(..., description="The name of the agent to route to next.")
    response: str = Field(..., description="A brief summary of the action to be taken.")

supervisor_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a project supervisor managing an AI hackathon assistant.

You coordinate multiple specialized agents. Your job is to:
1. Read the entire message history.
2. Decide which agent should act next — or FINISH if the goal is complete.
3. If the user input is not clear, ask for clarification
4. The sequence is as follows: ideation_agent -> research_planning_agent -> coding_agent -> deployment_agent -> presentation_agent -> FINISH
5. Provide a short response explaining your reasoning.

CRITICAL: You must progress through the pipeline systematically. Do NOT repeat the same agent.For example, if ideation_agent is run then make sure the next agent is research_planning_agent.

Pipeline flow (MUST follow this order):
1. ideation_agent (generate ideas) → 
2. research_planning_agent (research the idea) → 
3. coding_agent (create code) → 
4. deployment_agent (deploy) → 
5. presentation_agent (create presentation) → 
6. FINISH

Rules:
- Start with ideation_agent for new ideas
- Move to next agent after each completes
- NEVER repeat the same agent twice in a row
- After presentation_agent, always go to FINISH

Always respond in **structured JSON** matching this schema:
{{
  "next_agent": one of ["ideation_agent", "research_planning_agent", "coding_agent", "deployment_agent", "presentation_agent", "human_in_the_loop", "FINISH"],
  "response": "A concise explanation of your reasoning"
}}
"""
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)

# The supervisor uses the same LLM
supervisor_chain = (
    supervisor_prompt
    | llm.with_structured_output(SupervisorOutput)
)

# Simple human-in-the-loop node placeholder used by the graph
def human_in_the_loop_node(state):
    # In a real app, you would pause for human approval. Here we auto-route to coding.
    return {"next_agent": AgentName.CODING.value}

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
from langchain_ollama import ChatOllama
from pydantic import BaseModel, Field
from enum import Enum

load_dotenv()

# =====================================================================
# === Configure the LLM and toolkits ===
# =====================================================================
# Initialize Ollama LLM (tools are bound per-agent via bind_tools)
ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")
ollama_base_url = os.getenv("OLLAMA_BASE_URL")  # e.g. http://localhost:11434

llm = ChatOllama(
    model=ollama_model,
    base_url=ollama_base_url if ollama_base_url else None
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
def create_worker_agent(role: str, tools: list):
    """Creates a tool-calling worker agent compatible with Ollama."""
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                f"You are a helpful AI assistant specialized in {role}. "
                "You have access to a set of tools to perform your tasks. "
                "Use the tools provided to accomplish your goal."
            ),
            MessagesPlaceholder(variable_name="messages"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    # Bind tools directly to the LLM for tool calling
    agent_runnable = create_tool_calling_agent(llm.bind_tools(tools), tools, prompt)
    agent_executor = AgentExecutor(agent=agent_runnable, tools=tools)
    return agent_executor

# =====================================================================
# === Define each agent ===
# =====================================================================
ideation_agent = create_worker_agent(
    "ideation and brainstorming",
    tools=[web_search_tool]
)

research_planning_agent = create_worker_agent(
    "market research and project planning",
    tools=[web_search_tool]
)

coding_agent = create_worker_agent(
    "writing and managing code",
    tools=[web_search_tool, github_create_branch, github_create_pull_request, github_commit_file]
)

deployment_agent = create_worker_agent(
    "deploying web applications",
    tools=[vercel_deploy_hook]
)

presentation_agent = create_worker_agent(
    "generating presentation content",
    tools=[web_search_tool]
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
3. Provide a short response explaining your reasoning.

Valid agent transitions (rules):
- If user introduces a *new idea* or goal → next_agent = "ideation_agent"
- If idea is defined → next_agent = "research_planning_agent"
- If planning/research is done → next_agent = "coding_agent"
- If code is written → next_agent = "deployment_agent"
- If deployed → next_agent = "presentation_agent"
- If presentation is complete → next_agent = "FINISH"
- If human clarification is needed → next_agent = "human_in_the_loop"

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

import os
import requests
from dotenv import load_dotenv
from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.agents import create_tool_calling_agent, AgentExecutor
from typing import TypedDict, List
from langchain_core.messages import HumanMessage
from langchain_community.utilities import GitHubAPIWrapper
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.pydantic_v1 import BaseModel, Field
from enum import Enum

load_dotenv()

# =====================================================================
# === Configure the LLM and toolkits ===
# =====================================================================
# Initialize Gemini LLM with tool calling capabilities
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", tools=[]) # Initialize with empty tools, tools are bound per-agent

# Web search tool using Tavily
web_search_tool = TavilySearchResults()

# GitHub tools (using a simplified API wrapper for demonstration)
# In a real scenario, you would create fine-grained tools for each GitHub action
github_api_wrapper = GitHubAPIWrapper()
@tool
def github_create_branch(repo: str, branch: str) -> str:
    """Creates a new branch in a GitHub repository."""
    # This is a simplified function; you would use pygithub or similar here
    return github_api_wrapper.run(
        { "action": "create_branch", "repo": repo, "branch": branch }
    )

@tool
def github_create_pull_request(repo: str, title: str, head: str, base: str) -> str:
    """Creates a pull request on GitHub."""
    return github_api_wrapper.run(
        { "action": "create_pull_request", "repo": repo, "title": title, "head": head, "base": base }
    )

@tool
def github_commit_file(repo: str, file_path: str, content: str, message: str) -> str:
    """Commits a file with specified content to a GitHub repository."""
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
    """Creates a tool-calling worker agent compatible with Gemini."""
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
    # Gemini requires tools to be bound directly to the LLM for tool calling
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
def human_in_the_loop_node(state: AgentState):
    """Node for human intervention."""
    print("\n*** Human in the Loop required! ***")
    print(f"Current Status: {state['status']}")
    print(f"Last AI message: {state['messages'][-1].content}")
    user_input = input("Please provide your feedback or input to continue: ")
    return {
        "messages": [HumanMessage(content=user_input)],
        "status": "human_feedback"
    }
# =====================================================================
# === Supervisor Agent logic remains the same ===
# =====================================================================
class AgentName(str, Enum):
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
            "You are a project supervisor. Your job is to analyze the user's request "
            "and the current state of the hackathon project, and then decide which "
            "specialized agent should act next. You can also ask for human help or "
            "indicate that the project is complete."
            "The available agents are: {agent_names}."
        ),
        MessagesPlaceholder(variable_name="messages"),
        (
            "system",
            "Based on the conversation history and project status, select the most "
            "appropriate next step from the list of agents or indicate 'FINISH' "
            "if the task is done."
        )
    ]
)

# The supervisor now also uses Gemini
supervisor_chain = (
    supervisor_prompt
    | llm.with_structured_output(SupervisorOutput)
)

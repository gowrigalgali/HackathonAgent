from typing import TypedDict, List
from langchain_core.messages import BaseMessage, HumanMessage

# A shared state representing the state of the hackathon project
class AgentState(TypedDict):
    # A list of messages to track conversation history
    messages: List[BaseMessage]
    # Current status of the project (e.g., "ideation", "research", "coding")
    status: str
    # Output of the ideation phase
    idea: str
    # Output of the research phase (e.g., market analysis, user stories)
    research: str
    # Output of the planning phase (e.g., technical design)
    plan: str
    # Output of the coding phase
    code: str
    # URL of the deployed project on Vercel
    deployment_url: str
    # Presentation content
    presentation: str

def get_initial_state(user_input: str) -> AgentState:
    return AgentState(
        messages=[HumanMessage(content=user_input)],
        status="ideation",
        idea="",
        research="",
        plan="",
        code="",
        deployment_url="",
        presentation="",
    )

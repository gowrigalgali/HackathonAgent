# state.py
from typing import TypedDict, List, Union, Dict, Optional
from langchain_core.messages import BaseMessage, HumanMessage

MessageLike = Union[BaseMessage, Dict[str, str]]  # either Message object or {'role','content'}

class AgentState(TypedDict):
    messages: List[MessageLike]
    status: str
    idea: str
    research: str
    plan: str
    code: str
    deployment_url: str
    presentation: str
    next_agent: Optional[str]
    supervisor_steps: int
    last_agent: Optional[str]
    same_agent_count: int

def get_initial_state(user_input: str) -> AgentState:
    return AgentState(
        messages=[{"role": "user", "content": user_input}],  # canonicalize right away
        status="ideation",
        idea="",
        research="",
        plan="",
        code="",
        deployment_url="",
        presentation="",
        next_agent=None,
        supervisor_steps=0,
        last_agent=None,
        same_agent_count=0,
    )

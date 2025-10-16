# state.py
from typing import TypedDict, List, Union, Dict
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
    )

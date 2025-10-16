import operator
from typing import Annotated
from langgraph.graph import StateGraph, END
# FIX: The import path for MemorySaver has changed
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage,AIMessage,HumanMessage, SystemMessage
from agents import AgentName, supervisor_chain
from state import AgentState

# Import the agents and state definition
from agents import (
    ideation_agent,
    research_planning_agent,
    coding_agent,
    deployment_agent,
    presentation_agent,
    supervisor_chain,
    AgentName,
    human_in_the_loop_node
)
def _to_role_content(msg_obj):
    """Convert a LangChain Message object to {'role','content'} dict."""
    if isinstance(msg_obj, HumanMessage):
        return {"role": "user", "content": msg_obj.content}
    if isinstance(msg_obj, AIMessage):
        return {"role": "assistant", "content": msg_obj.content}
    if isinstance(msg_obj, SystemMessage):
        return {"role": "system", "content": msg_obj.content}
    # fallback
    return {"role": "user", "content": str(msg_obj)}

def normalize_messages_for_langchain(state_messages):
    """
    Convert state_messages (which may contain Message objects, or dicts with 'messages'/'output')
    into a flat list of {"role","content"} dicts acceptable to LangChain.
    """
    normalized = []
    for item in state_messages:
        # If item is a LangChain Message already
        if hasattr(item, "content") and hasattr(item, "__class__"):
            normalized.append(_to_role_content(item))
            continue

        # If it's already a simple dict with role/content
        if isinstance(item, dict) and "role" in item and "content" in item:
            normalized.append({"role": item["role"], "content": item["content"]})
            continue

        # If item is the dict produced by run_agent_node or agent.invoke
        if isinstance(item, dict):
            # If it contains 'messages' (list of Message objects)
            msgs = item.get("messages")
            if isinstance(msgs, list):
                for m in msgs:
                    if hasattr(m, "content"):
                        normalized.append(_to_role_content(m))
                    else:
                        # unknown object, stringify
                        normalized.append({"role": "user", "content": str(m)})

            # If it also has 'output', treat that as assistant reply
            if "output" in item and item["output"]:
                normalized.append({"role": "assistant", "content": item["output"]})
            continue

        # Last fallback: stringify
        normalized.append({"role": "user", "content": str(item)})

    return normalized

# Define helper to run an agent node
def run_agent_node(agent, state: AgentState):
    # Prepare canonical messages for the agent
    canonical_msgs = normalize_messages_for_langchain(state["messages"])

    # Pass messages into agent invocation — some agents accept role/content dicts or Message objects
    # Here we pass the list of dicts; adapt if your agent expects Message objects.
    result = agent.invoke({"messages": canonical_msgs})

    # agent.invoke may return a dict with 'messages' and 'output', or an AIMessage, or text.
    assistant_content = None
    # If result is a dict with 'output'
    if isinstance(result, dict):
        if "output" in result and result["output"]:
            assistant_content = result["output"]
        elif "messages" in result and isinstance(result["messages"], list):
            # try to extract text from first message
            first = result["messages"][0]
            assistant_content = getattr(first, "content", str(first))
    else:
        # If it's a Message object
        if hasattr(result, "content"):
            assistant_content = result.content
        else:
            assistant_content = str(result)

    # Append assistant reply into the shared state as a {'role','content'} dict
    if assistant_content:
        state["messages"].append({"role": "assistant", "content": assistant_content})

    # Return a simplified node payload (keep it minimal)
    return {"messages": [{"role": "assistant", "content": assistant_content}]}

# Define nodes for each agent
def run_ideation(state: AgentState):
    return run_agent_node(ideation_agent, state)

def run_research_planning(state: AgentState):
    return run_agent_node(research_planning_agent, state)

def run_coding(state: AgentState):
    return run_agent_node(coding_agent, state)

def run_deployment(state: AgentState):
    return run_agent_node(deployment_agent, state)

def run_presentation(state: AgentState):
    return run_agent_node(presentation_agent, state)

# Define the supervisor node
def run_supervisor(state):
    # List of all agent names except supervisor/finish
    agent_names = [
        AgentName.IDEATION.value,
        AgentName.RESEARCH_PLANNING.value,
        AgentName.CODING.value,
        AgentName.DEPLOYMENT.value,
        AgentName.PRESENTATION.value,
        AgentName.HUMAN_IN_THE_LOOP.value,
    ]
    # normalize messages into flat role/content format
    normalized_msgs = normalize_messages_for_langchain(state.get("messages", []))


    # Pass agent_names along with messages
    response = supervisor_chain.invoke({
        "messages": normalized_msgs,
        "agent_names": ", ".join(agent_names)
    })
    return response

# Define the conditional routing for the supervisor
def route_supervisor(state: AgentState):
    if state.get("next_agent") is not None:
        return state["next_agent"]
    return AgentName.IDEATION.value

# Create and configure the graph
workflow = StateGraph(AgentState)
workflow.add_node(AgentName.SUPERVISOR.value, run_supervisor)
workflow.add_node(AgentName.IDEATION.value, run_ideation)
workflow.add_node(AgentName.RESEARCH_PLANNING.value, run_research_planning)
workflow.add_node(AgentName.CODING.value, run_coding)
workflow.add_node(AgentName.DEPLOYMENT.value, run_deployment)
workflow.add_node(AgentName.PRESENTATION.value, run_presentation)
# FIX: Added the human_in_the_loop node and made sure to import it
workflow.add_node(AgentName.HUMAN_IN_THE_LOOP.value, human_in_the_loop_node)
workflow.set_entry_point(AgentName.SUPERVISOR.value)

# Add conditional edges from the supervisor to agents or END
workflow.add_conditional_edges(
    AgentName.SUPERVISOR.value,
    route_supervisor,
    {
        AgentName.IDEATION.value: AgentName.IDEATION.value,
        AgentName.RESEARCH_PLANNING.value: AgentName.RESEARCH_PLANNING.value,
        AgentName.CODING.value: AgentName.CODING.value,
        AgentName.DEPLOYMENT.value: AgentName.DEPLOYMENT.value,
        AgentName.PRESENTATION.value: AgentName.PRESENTATION.value,
        AgentName.HUMAN_IN_THE_LOOP.value: AgentName.HUMAN_IN_THE_LOOP.value,
        AgentName.FINISH.value: END,
    }
)

# After each worker, route back to the supervisor
workflow.add_edge(AgentName.IDEATION.value, AgentName.SUPERVISOR.value)
# FIX: Adding a link to the HITL node for human review before coding
workflow.add_edge(AgentName.RESEARCH_PLANNING.value, AgentName.HUMAN_IN_THE_LOOP.value)
workflow.add_edge(AgentName.CODING.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.DEPLOYMENT.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.PRESENTATION.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.HUMAN_IN_THE_LOOP.value, AgentName.SUPERVISOR.value)

# Add persistence and compile
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)

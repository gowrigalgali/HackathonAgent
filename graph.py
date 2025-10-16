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
    SupervisorOutput,
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
import json
from langchain_core.messages import AIMessage

def normalize_agent_output(result):
    """
    Clean up various agent.invoke() output formats to a simple list of messages.
    Handles nested JSON strings and LangChain Message objects.
    """
    # Case 1: already a dict with "messages"
    if isinstance(result, dict) and "messages" in result:
        out = []
        for m in result["messages"]:
            if hasattr(m, "content"):
                out.append({"role": "assistant", "content": m.content})
            elif isinstance(m, dict) and "content" in m:
                out.append({"role": "assistant", "content": m["content"]})
            else:
                out.append({"role": "assistant", "content": str(m)})
        return out

    # Case 2: dict with 'output'
    if isinstance(result, dict) and "output" in result:
        return [{"role": "assistant", "content": str(result["output"])}]

    # Case 3: plain string or JSON string
    if isinstance(result, str):
        try:
            parsed = json.loads(result)
            if isinstance(parsed, dict) and "content" in parsed:
                return [{"role": "assistant", "content": parsed["content"]}]
            if isinstance(parsed, list):
                return [{"role": "assistant", "content": str(p)} for p in parsed]
            return [{"role": "assistant", "content": str(parsed)}]
        except Exception:
            return [{"role": "assistant", "content": result}]

    # Case 4: Message object
    if hasattr(result, "content"):
        return [{"role": "assistant", "content": result.content}]

    # Fallback
    return [{"role": "assistant", "content": str(result)}]

# Define helper to run an agent node
def run_agent_node(agent, state: AgentState):
    canonical_msgs = normalize_messages_for_langchain(state["messages"])
    result = agent.invoke({"messages": canonical_msgs})
    normalized = normalize_agent_output(result)

    # Append to the global message list (for full conversation memory)
    state["messages"].extend(normalized)

    # Optional debug
    print(f"[DEBUG] {agent.__class__.__name__} output → {normalized[0]['content'][:120]}...\n")

    # Return what LangGraph expects (small delta)
    return {"messages": normalized}


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
    agent_names = [
        AgentName.IDEATION.value,
        AgentName.RESEARCH_PLANNING.value,
        AgentName.CODING.value,
        AgentName.DEPLOYMENT.value,
        AgentName.PRESENTATION.value,
        AgentName.HUMAN_IN_THE_LOOP.value,
    ]

    normalized_msgs = normalize_messages_for_langchain(state.get("messages", []))

    # Invoke supervisor chain
    result = supervisor_chain.invoke({
        "messages": normalized_msgs,
        "agent_names": ", ".join(agent_names)
    })

    # 🧩 Handle structured output properly
    if isinstance(result, SupervisorOutput):
        state["next_agent"] = result.next_agent.value
        assistant_message = {
            "role": "assistant",
            "content": result.response
        }
        state["messages"].append(assistant_message)

        print(f"[SUPERVISOR] → Next agent: {state['next_agent']}")
        print(f"[SUPERVISOR] → Response: {result.response[:100]}...\n")

        return {"messages": [assistant_message]}

    # 🧯 Fallback: non-structured or unexpected response
    normalized = normalize_agent_output(result)
    state["messages"].extend(normalized)
    state["next_agent"] = AgentName.FINISH.value  # stop safely
    return {"messages": normalized}



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

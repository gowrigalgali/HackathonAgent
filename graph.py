# graph.py
import json
import operator
from typing import Annotated, Any, Optional
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage, SystemMessage
from state import AgentState
from agents import (
    ideation_agent,
    research_planning_agent,
    coding_agent,
    deployment_agent,
    presentation_agent,
    supervisor_chain,
    AgentName,
    SupervisorOutput,
    human_in_the_loop_node,
)

# ----------------------------
# Helpers: normalize messages
# ----------------------------
def _to_role_content(msg_obj: Any) -> dict:
    """Convert LangChain Message object to {'role','content'} dict."""
    try:
        if isinstance(msg_obj, HumanMessage):
            return {"role": "user", "content": msg_obj.content}
        if isinstance(msg_obj, AIMessage):
            return {"role": "assistant", "content": msg_obj.content}
        if isinstance(msg_obj, SystemMessage):
            return {"role": "system", "content": msg_obj.content}
    except Exception:
        pass
    # fallback for unknown objects
    if isinstance(msg_obj, dict) and "role" in msg_obj and "content" in msg_obj:
        return {"role": msg_obj["role"], "content": msg_obj["content"]}
    return {"role": "user", "content": str(msg_obj)}

def normalize_messages_for_langchain(state_messages):
    """
    Convert state_messages (Message objects, dicts, or agent outputs) into flat list of {"role","content"} dicts.
    """
    normalized = []
    for item in state_messages:
        # Message objects
        if hasattr(item, "content") and hasattr(item, "__class__"):
            normalized.append(_to_role_content(item))
            continue

        # Already a simple dict with role/content
        if isinstance(item, dict) and "role" in item and "content" in item:
            normalized.append({"role": item["role"], "content": item["content"]})
            continue

        # If it's a dict produced by agent.invoke (may contain 'messages' or 'output')
        if isinstance(item, dict):
            msgs = item.get("messages")
            if isinstance(msgs, list):
                for m in msgs:
                    if hasattr(m, "content"):
                        normalized.append(_to_role_content(m))
                    elif isinstance(m, dict) and "role" in m and "content" in m:
                        normalized.append({"role": m["role"], "content": m["content"]})
                    else:
                        normalized.append({"role": "assistant", "content": str(m)})
            if "output" in item and item["output"]:
                normalized.append({"role": "assistant", "content": item["output"]})
            # If the dict had direct content keys
            if "content" in item and "role" in item:
                normalized.append({"role": item["role"], "content": item["content"]})
            continue

        # Last fallback: stringify
        normalized.append({"role": "user", "content": str(item)})

    # Ensure conversation ends with user message for Gemini
    if normalized and normalized[-1]["role"] == "assistant":
        normalized.append({"role": "user", "content": "Please continue with your task."})
    
    return normalized

# ----------------------------
# Helpers: normalize outputs
# ----------------------------
def normalize_agent_output(result: Any) -> list[dict]:
    """
    Convert various forms of agent outputs into a list of simple dict messages:
    [{'role': 'assistant', 'content': '...'}, ...]
    """
    # If supervisor structured output is passed in here by mistake, handle it
    if isinstance(result, SupervisorOutput):
        return [{"role": "assistant", "content": str(result.response)}]

    # Dict with 'messages'
    if isinstance(result, dict) and "messages" in result:
        out = []
        for m in result["messages"]:
            if hasattr(m, "content"):
                out.append({"role": "assistant", "content": m.content})
            elif isinstance(m, dict) and "content" in m:
                r = {"role": m.get("role", "assistant"), "content": m["content"]}
                out.append(r)
            else:
                out.append({"role": "assistant", "content": str(m)})
        return out

    # Dict with 'output'
    if isinstance(result, dict) and "output" in result:
        return [{"role": "assistant", "content": str(result["output"])}]

    # Direct Message object
    if hasattr(result, "content"):
        return [{"role": "assistant", "content": result.content}]

    # Plain string or JSON string
    if isinstance(result, str):
        # strip code fences often returned by LLMs
        content = result.strip()
        if content.startswith("```"):
            # remove fenced code block if present
            try:
                # try to extract inside code block
                parts = content.split("```")
                if len(parts) >= 3:
                    content = parts[1]
                else:
                    content = content.strip("`")
            except Exception:
                content = content.strip("`")
        # attempt to parse JSON string
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                # try to find response-like keys
                keys = list(parsed.keys())
                # If it contains a 'response' or 'output' field
                if "response" in parsed:
                    return [{"role": "assistant", "content": str(parsed["response"])}]
                if "output" in parsed:
                    return [{"role": "assistant", "content": str(parsed["output"])}]
                # fallback: pretty stringify dict
                return [{"role": "assistant", "content": json.dumps(parsed)}]
            if isinstance(parsed, list):
                # join list items into text
                return [{"role": "assistant", "content": json.dumps(parsed)}]
            return [{"role": "assistant", "content": str(parsed)}]
        except Exception:
            # not JSON, return as plain string
            return [{"role": "assistant", "content": content}]

    # Fallback: stringify anything else
    return [{"role": "assistant", "content": str(result)}]

# ----------------------------
# Pipeline control helpers
# ----------------------------
PIPELINE_ORDER = [
    AgentName.IDEATION.value,
    AgentName.RESEARCH_PLANNING.value,
    AgentName.CODING.value,
    AgentName.DEPLOYMENT.value,
    AgentName.PRESENTATION.value,
    AgentName.FINISH.value,
]

def _next_pipeline_stage(completed: list[str]) -> str:
    for stage in PIPELINE_ORDER:
        if stage == AgentName.FINISH.value:
            return AgentName.FINISH.value
        if stage not in completed:
            return stage
    return AgentName.FINISH.value

def _is_valid_agent_name(name: Optional[str]) -> bool:
    return name in {
        AgentName.IDEATION.value,
        AgentName.RESEARCH_PLANNING.value,
        AgentName.CODING.value,
        AgentName.DEPLOYMENT.value,
        AgentName.PRESENTATION.value,
        AgentName.HUMAN_IN_THE_LOOP.value,
        AgentName.FINISH.value,
    }

# ----------------------------
# Core: run_agent_node
# ----------------------------
def run_agent_node(agent_callable, state: AgentState):
    """
    Generic runner for worker agents that returns a normalized assistant message list.
    agent_callable can be either an AgentExecutor or a simple callable that accepts state.
    """
    # Prepare canonical messages
    canonical_msgs = normalize_messages_for_langchain(state.get("messages", []))

    # Invoke the agent: it might be a callable or LangChain AgentExecutor
    try:
        if hasattr(agent_callable, "invoke"):
            # AgentExecutor / runnable
            result = agent_callable.invoke({"messages": canonical_msgs})
        else:
            # Simple callable (as created in some designs)
            result = agent_callable(state)
    except Exception as e:
        err_msg = f"Agent invocation error: {e}"
        print(f"[ERROR] {err_msg}")
        state.setdefault("messages", []).append({"role": "assistant", "content": err_msg})
        return {"messages": [{"role": "assistant", "content": err_msg}]}

    # Normalize and append to state
    normalized = normalize_agent_output(result)
    state.setdefault("messages", []).extend(normalized)

    # Debugging
    try:
        preview = normalized[0]["content"] if normalized and "content" in normalized[0] else str(normalized)
        print(f"[DEBUG] {getattr(agent_callable, '__class__', agent_callable)} output → {preview[:200]}...")
    except Exception:
        pass

    # Return the normalized chunk for LangGraph
    return {"messages": normalized}

# ----------------------------
# Worker wrappers that mark completion
# ----------------------------
def run_ideation(state: AgentState):
    out = run_agent_node(ideation_agent, state)
    state.setdefault("completed_stages", [])
    if AgentName.IDEATION.value not in state["completed_stages"]:
        state["completed_stages"].append(AgentName.IDEATION.value)
    state.pop("next_agent", None)
    return out

def run_research_planning(state: AgentState):
    out = run_agent_node(research_planning_agent, state)
    state.setdefault("completed_stages", [])
    if AgentName.RESEARCH_PLANNING.value not in state["completed_stages"]:
        state["completed_stages"].append(AgentName.RESEARCH_PLANNING.value)
    state.pop("next_agent", None)
    return out

def run_coding(state: AgentState):
    out = run_agent_node(coding_agent, state)
    state.setdefault("completed_stages", [])
    if AgentName.CODING.value not in state["completed_stages"]:
        state["completed_stages"].append(AgentName.CODING.value)
    state.pop("next_agent", None)
    return out

def run_deployment(state: AgentState):
    out = run_agent_node(deployment_agent, state)
    state.setdefault("completed_stages", [])
    if AgentName.DEPLOYMENT.value not in state["completed_stages"]:
        state["completed_stages"].append(AgentName.DEPLOYMENT.value)
    state.pop("next_agent", None)
    return out

def run_presentation(state: AgentState):
    out = run_agent_node(presentation_agent, state)
    state.setdefault("completed_stages", [])
    if AgentName.PRESENTATION.value not in state["completed_stages"]:
        state["completed_stages"].append(AgentName.PRESENTATION.value)
    state.pop("next_agent", None)
    return out

# ----------------------------
# Supervisor node (robust)
# ----------------------------
def run_supervisor(state):
    # Simple deterministic progression based on step count
    supervisor_steps = state.get("supervisor_steps", 0)
    state["supervisor_steps"] = supervisor_steps + 1
    
    # Define the pipeline order
    pipeline = [
        AgentName.IDEATION.value,
        AgentName.RESEARCH_PLANNING.value, 
        AgentName.CODING.value,
        AgentName.DEPLOYMENT.value,
        AgentName.PRESENTATION.value,
        AgentName.FINISH.value
    ]
    normalized_msgs = normalize_messages_for_langchain(state.get("messages", []))
    completed = state.setdefault("completed_stages", [])

    # Invoke the structured supervisor chain
    raw_result = supervisor_chain.invoke({
        "messages": normalized_msgs,
        "agent_names": ", ".join(agent_names)
    })

    chosen_agent = None
    response_text = None

    # Extract structured SupervisorOutput if returned
    try:
        if isinstance(raw_result, SupervisorOutput):
            chosen_agent = getattr(raw_result.next_agent, "value", str(raw_result.next_agent))
            response_text = str(raw_result.response)
        elif isinstance(raw_result, dict):
            # fallback dictionary
            chosen_agent = raw_result.get("next_agent")
            response_text = raw_result.get("response", "")
        elif hasattr(raw_result, "content"):
            # try parsing content as JSON
            content = raw_result.content
            try:
                parsed = json.loads(content)
                chosen_agent = parsed.get("next_agent")
                response_text = parsed.get("response", content)
            except Exception:
                response_text = str(content)
        elif isinstance(raw_result, str):
            try:
                parsed = json.loads(raw_result)
                chosen_agent = parsed.get("next_agent")
                response_text = parsed.get("response", raw_result)
            except Exception:
                response_text = raw_result
    except Exception as e:
        response_text = f"Supervisor parsing error: {e}"

    # Normalize if Enum-like
    if hasattr(chosen_agent, "value"):
        chosen_agent = chosen_agent.value

    # Validate and enforce canonical progression
    last_completed = completed[-1] if completed else None

    if not _is_valid_agent_name(chosen_agent):
        fallback = _next_pipeline_stage(completed)
        print(f"[SUPERVISOR DEBUG] invalid next_agent ({chosen_agent}). Falling back -> {fallback}")
        chosen_agent = fallback
    else:
        # Prevent repeating the same stage twice in a row
        if last_completed and chosen_agent == last_completed:
            fallback = _next_pipeline_stage(completed)
            print(f"[SUPERVISOR DEBUG] model picked already-completed stage ({chosen_agent}). Forcing -> {fallback}")
            chosen_agent = fallback

    # If chosen agent is earlier than desired canonical stage, force the desired one
    desired = _next_pipeline_stage(completed)
    if chosen_agent not in (AgentName.HUMAN_IN_THE_LOOP.value, AgentName.FINISH.value) and chosen_agent != desired:
        print(f"[SUPERVISOR DEBUG] chosen_agent ({chosen_agent}) != desired next ({desired}). Forcing -> {desired}")
        chosen_agent = desired

    # Persist next_agent decision and append assistant message
    state["next_agent"] = chosen_agent
    assistant_message = {"role": "assistant", "content": (response_text or f"Routing to {chosen_agent}")}
    state.setdefault("messages", []).append(assistant_message)

    print(f"[SUPERVISOR] → Next agent: {chosen_agent}")
    print(f"[SUPERVISOR] → Response: {assistant_message['content'][:240]}")

    return {"messages": [assistant_message]}

# ----------------------------
# Routing function used by StateGraph
# ----------------------------
def route_supervisor(state: AgentState):
    next_agent = state.get("next_agent")
    if _is_valid_agent_name(next_agent):
        return next_agent
    return AgentName.FINISH.value

# ----------------------------
# Build the workflow graph
# ----------------------------
workflow = StateGraph(AgentState)
workflow.add_node(AgentName.SUPERVISOR.value, run_supervisor)
workflow.add_node(AgentName.IDEATION.value, run_ideation)
workflow.add_node(AgentName.RESEARCH_PLANNING.value, run_research_planning)
workflow.add_node(AgentName.CODING.value, run_coding)
workflow.add_node(AgentName.DEPLOYMENT.value, run_deployment)
workflow.add_node(AgentName.PRESENTATION.value, run_presentation)
workflow.add_node(AgentName.HUMAN_IN_THE_LOOP.value, human_in_the_loop_node)
workflow.set_entry_point(AgentName.SUPERVISOR.value)

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

workflow.add_edge(AgentName.IDEATION.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.RESEARCH_PLANNING.value, AgentName.HUMAN_IN_THE_LOOP.value)
workflow.add_edge(AgentName.CODING.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.DEPLOYMENT.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.PRESENTATION.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.HUMAN_IN_THE_LOOP.value, AgentName.SUPERVISOR.value)

# ----------------------------
# Persistence & compile
# ----------------------------
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)

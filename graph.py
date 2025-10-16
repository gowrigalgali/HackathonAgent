import operator
from typing import Annotated
from langgraph.graph import StateGraph, END
from langgraph.checkpoint import MemorySaver
from langchain_core.messages import BaseMessage

# Import the agents and state definition
from agents import (
    ideation_agent,
    research_planning_agent,
    coding_agent,
    deployment_agent,
    presentation_agent,
    supervisor_chain,
    AgentName
)
from state import AgentState

# Define helper to run an agent node
def run_agent_node(agent, state: AgentState):
    result = agent.invoke({"messages": state["messages"]})
    return {"messages": [result]}

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
def run_supervisor(state: AgentState):
    response = supervisor_chain.invoke({"messages": state["messages"]})
    return {"next_agent": response.next_agent.value}

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
        AgentName.FINISH.value: END,
    }
)

# After each worker, route back to the supervisor
workflow.add_edge(AgentName.IDEATION.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.RESEARCH_PLANNING.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.CODING.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.DEPLOYMENT.value, AgentName.SUPERVISOR.value)
workflow.add_edge(AgentName.PRESENTATION.value, AgentName.SUPERVISOR.value)

# Add persistence and compile
memory = MemorySaver()
app = workflow.compile(checkpointer=memory)


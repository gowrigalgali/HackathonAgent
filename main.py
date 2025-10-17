import os
import uuid
from dotenv import load_dotenv

from state import get_initial_state
from graph import app  # Assuming your compiled graph is named 'app'

load_dotenv()

# Create a unique thread_id for this session to ensure persistence
# This is essential for checkpointing and human-in-the-loop
thread_id = str(uuid.uuid4())
config = {
    "configurable": {
        "thread_id": thread_id
    },
    "recursion_limit": 100
}

# Main application loop
def main():
    print("Hackathon-Mate is ready! Type your project idea or 'quit' to exit.")
    while True:
        user_input = input("\nYou: ")
        if user_input.lower() == 'quit':
            print("Exiting Hackathon-Mate. Goodbye!")
            break

        # Initialize state with user input
        state = get_initial_state(user_input)

        # Stream the output from the graph
        print("🧩 Starting workflow...\n")
        
        # Stream the workflow execution to see what's happening
        for s in app.stream(state, config=config):
            print("🧩 Workflow step...\n")
            
            # Print each step
            for key, value in s.items():
                if key != '__end__':
                    print(f"[{key}]: {value}")
                    print("-" * 40)
        
        print("\n🎉 Workflow completed!")
        print("=" * 50)

if __name__ == "__main__":
    # Optional: Enable LangSmith for enhanced debugging
    if os.getenv("LANGSMITH_API_KEY"):
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "Hackathon-Mate")

    main()

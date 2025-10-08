# Sudar Agent Service# SudarAgent Crew



An intelligent educational AI agent service built with CrewAI, featuring multi-agent flows for worksheet generation and doubt clearance.Welcome to the SudarAgent Crew project, powered by [crewAI](https://crewai.com). This template is designed to help you set up a multi-agent AI system with ease, leveraging the powerful and flexible framework provided by crewAI. Our goal is to enable your agents to collaborate effectively on complex tasks, maximizing their collective intelligence and capabilities.



## Architecture## Installation



The service uses a hierarchical architecture with:Ensure you have Python >=3.10 <3.14 installed on your system. This project uses [UV](https://docs.astral.sh/uv/) for dependency management and package handling, offering a seamless setup and execution experience.



1. **Router Crew**: Analyzes queries and routes to appropriate flowsFirst, if you haven't already, install uv:

2. **Worksheet Generator Flow**: Two-agent flow (Content Researcher → Worksheet Generator)

3. **Doubt Clearance Flow**: Single-agent flow for direct question answering```bash

pip install uv

## Features```



- 🤖 Multi-agent system using CrewAINext, navigate to your project directory and install the dependencies:

- 📚 Document retrieval from RAG service

- 🔍 Web search and website scraping via MCP tools(Optional) Lock the dependencies and install them by using the CLI command:

- 💾 Chat history in MongoDB```bash

- 🧠 Semantic memory with Qdrantcrewai install

- 🔄 SSE streaming responses```

- 🐳 Docker support### Customizing



## Installation**Add your `OPENAI_API_KEY` into the `.env` file**



### Using UV (Recommended)- Modify `src/sudar_agent/config/agents.yaml` to define your agents

- Modify `src/sudar_agent/config/tasks.yaml` to define your tasks

```bash- Modify `src/sudar_agent/crew.py` to add your own logic, tools and specific args

# Install dependencies- Modify `src/sudar_agent/main.py` to add custom inputs for your agents and tasks

uv pip install -e .

## Running the Project

# Or using sync

uv syncTo kickstart your crew of AI agents and begin task execution, run this from the root folder of your project:

```

```bash

### Configuration$ crewai run

```

Configure `.env` file:

This command initializes the sudar-agent Crew, assembling the agents and assigning them tasks as defined in your configuration.

```bash

# LLM ConfigurationThis example, unmodified, will run the create a `report.md` file with the output of a research on LLMs in the root folder.

MODEL_PROVIDER=google  # Options: google, groq, ollama

GOOGLE_API_KEY=your_api_key_here## Understanding Your Crew



# Service URLsThe sudar-agent Crew is composed of multiple AI agents, each with unique roles, goals, and tools. These agents collaborate on a series of tasks, defined in `config/tasks.yaml`, leveraging their collective skills to achieve complex objectives. The `config/agents.yaml` file outlines the capabilities and configurations of each agent in your crew.

RAG_SERVICE_URL=http://localhost:8001

MCP_TOOLS_URL=http://localhost:3002## Support



# MongoDBFor support, questions, or feedback regarding the SudarAgent Crew or crewAI.

MONGODB_URL=mongodb://localhost:27017- Visit our [documentation](https://docs.crewai.com)

MONGODB_DATABASE=sudar_db- Reach out to us through our [GitHub repository](https://github.com/joaomdmoura/crewai)

MONGODB_COLLECTION=chats- [Join our Discord](https://discord.com/invite/X4JWnZnxPb)

- [Chat with our docs](https://chatg.pt/DWjSBZn)

# Qdrant

QDRANT_HOST=localhostLet's create wonders together with the power and simplicity of crewAI.

QDRANT_PORT=6333

# Ollama (for embeddings)
OLLAMA_BASE_URL=http://localhost:11434
EMBEDDING_MODEL_NAME=embeddinggemma:300m
EMBEDDING_DIMENSION=768

# Server
HOST=0.0.0.0
PORT=3005
```

## Usage

### Running the Server

```bash
# Using UV
uv run serve

# Or directly with Python
python -m sudar_agent.main
```

### API Endpoints

#### POST `/api/chat` (SSE Streaming)

Streams the agent's response using Server-Sent Events.

#### POST `/api/chat/sync` (Synchronous)

Returns the complete response at once.

## Document References

Use `@filename.ext` syntax in queries to reference ingested documents:

```
"Explain photosynthesis from @biology.pdf and @science.docx"
```

## License

Part of the Sudar AI Platform

[![](https://img.shields.io/badge/shirts_1.0.0-passing-green)](https://github.com/gongahkia/shirts/releases/tag/1.0.0)

# `Shirts`

AI Agent-based Legal Workflow Assistant that automates legal processes through intelligent [multi-agent coordination](#multi-agent-interaction-diagram) and [RAG](#architecture) technology.

## Stack

* *Frontend*: [React](https://react.dev/), [Vite](https://vite.dev/), [React Query](https://tanstack.com/query/v3), [Framer Motion](https://www.framer.com/motion/), [Headless UI](https://headlessui.com/), [Tailwind CSS](https://tailwindcss.com/), [TypeScript](https://www.typescriptlang.org/)
* *Backend*: [Node.js](https://nodejs.org/en), [Express.js](https://expressjs.com/), [Socket.io](https://socket.io/), [TypeScript](https://www.typescriptlang.org/)
* *AI*: [Gemini 2 API](https://ai.google.dev/), [OpenAI](https://openai.com/), [Vector Database](https://github.com/lancedb/vectordb), [HNSWLIB](https://github.com/nmslib/hnswlib)
* *Document Processing*: [PDF-lib](https://pdf-lib.js.org/), [DOCX](https://docx.js.org/)
* *Caching*: [Redis](https://redis.io/)
* *Package*: [Docker](https://www.docker.com/)

## Usage

> [!IMPORTANT]
> Please read the [legal disclaimer](#legal) before using `Shirts`.

The below instructions are for locally hosting `Shirts`.

1. First execute the below.

```console
$ git clone https://github.com/gongahkia/shirts && cd shirts
```

2. Then create a `.env` file at the project root with the following content.

```env
GEMINI_API_KEY="your_gemini_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
JWT_SECRET="your_super_secure_jwt_secret_here"
API_RATE_LIMIT=100
POSTGRES_PASSWORD="your_postgres_password_here"
GRAFANA_PASSWORD="your_grafana_admin_password_here"
```

3. Finally run the below.

```console
$ npm install && npm run build
```

4. You can then use any of the following commands to run `Shirts`.

```console
$ npm run dev
$ npm run docker:up
$ docker-compose up --build
```

## Architecture

`Shirts` is structured as a monorepo comprising a sophisticated backend implementing agentic workflows, a React frontend, and advanced AI services for legal document processing.

### System Context Diagram

```mermaid
C4Context
    title System Context Diagram for Shirts Legal Workflow

    Person(user, "Legal Professional", "Manages cases and workflows through the web application")

    System(web_app, "Web Application", "React-based interface for case management and workflow monitoring")
    System(backend_api, "Backend API", "Node.js/Express server with agentic workflow orchestration")
    System(redis_cache, "Redis Cache", "Caching layer for workflow state and session management")
    System_Ext(gemini_service, "Gemini 2 API", "AI service for legal reasoning and document generation")
    System_Ext(openai_service, "OpenAI API", "Embedding service for semantic search capabilities")

    Rel(user, web_app, "Manages legal cases via")
    Rel(web_app, backend_api, "Communicates with", "HTTP/S, WebSockets")
    Rel(backend_api, redis_cache, "Caches workflow state", "Redis Protocol")
    Rel(backend_api, gemini_service, "Sends legal prompts to", "HTTPS")
    Rel(backend_api, openai_service, "Generates embeddings via", "HTTPS")
```

### Container Diagram

```mermaid
C4Container
    title Container Diagram for Shirts Legal Workflow

    Person(user, "Legal Professional")

    Container_Boundary(shirts_system, "Shirts System") {
        Container(frontend_container, "Frontend Web App", "React, Vite, TypeScript", "Serves the legal workflow interface")
        Container(backend_container, "Backend API", "Node.js, Express, Socket.io", "Orchestrates agentic workflows and API endpoints")
        Container(agent_system, "Agent System", "TypeScript", "Multi-agent coordination for legal processes")
        Container(rag_system, "RAG System", "Vector DB, HNSWLIB", "Retrieval-augmented generation for legal documents")
        ContainerDb(redis_container, "Redis Cache", "In-memory Database", "Stores workflow state and session data")
    }

    System_Ext(gemini_api, "Gemini 2 API", "Google AI service for legal reasoning")
    System_Ext(openai_api, "OpenAI API", "Embedding and AI services")

    Rel(user, frontend_container, "Accesses via", "HTTPS")
    Rel(frontend_container, backend_container, "Makes API calls", "HTTP/S, WSS")
    Rel(backend_container, agent_system, "Orchestrates agents")
    Rel(agent_system, rag_system, "Retrieves legal documents")
    Rel(backend_container, redis_container, "Caches data", "Redis Protocol")
    Rel(agent_system, gemini_api, "Sends prompts to", "HTTPS")
    Rel(rag_system, openai_api, "Generates embeddings", "HTTPS")
```

### Multi-Agent Interaction Diagram

```mermaid
C4Component
    title Multi-Agent Interaction Diagram for Shirts Legal Workflow

    Person(user, "Legal Professional", "Initiates legal workflows and cases")

    Container_Boundary(agent_orchestrator, "Agent Orchestration System") {
        Component(workflow_manager, "Workflow Manager", "TypeScript", "Coordinates multi-agent workflows and task distribution")
        Component(task_scheduler, "Task Scheduler", "TypeScript", "Manages agent task queues and execution order")
        Component(state_manager, "State Manager", "TypeScript", "Tracks workflow state and agent coordination")
    }

    Container_Boundary(specialized_agents, "Specialized Legal Agents") {
        Component(document_agent, "Document Analysis Agent", "AI/TypeScript", "Analyzes legal documents, extracts key information")
        Component(research_agent, "Legal Research Agent", "AI/TypeScript", "Conducts legal research and precedent analysis")
        Component(drafting_agent, "Document Drafting Agent", "AI/TypeScript", "Generates legal documents and contracts")
        Component(review_agent, "Review & Compliance Agent", "AI/TypeScript", "Reviews documents for compliance and accuracy")
        Component(case_agent, "Case Management Agent", "AI/TypeScript", "Manages case timelines and deadlines")
    }

    Container_Boundary(support_systems, "Support Systems") {
        ComponentDb(vector_store, "Vector Store", "Vector Database", "Stores legal document embeddings and knowledge base")
        ComponentDb(workflow_state, "Workflow State Store", "Redis", "Maintains agent coordination state and task queues")
        Component(communication_hub, "Inter-Agent Communication", "Socket.io", "Facilitates real-time agent-to-agent communication")
    }

    System_Ext(ai_services, "AI Services", "Gemini 2 & OpenAI APIs for agent reasoning")

    Rel(user, workflow_manager, "Initiates workflows", "HTTPS")
    Rel(workflow_manager, task_scheduler, "Distributes tasks")
    Rel(task_scheduler, state_manager, "Updates coordination state")

    Rel(workflow_manager, document_agent, "Assigns document tasks")
    Rel(workflow_manager, research_agent, "Assigns research tasks")
    Rel(workflow_manager, drafting_agent, "Assigns drafting tasks")
    Rel(workflow_manager, review_agent, "Assigns review tasks")
    Rel(workflow_manager, case_agent, "Assigns case management tasks")

    Rel(document_agent, research_agent, "Shares extracted insights", "via Communication Hub")
    Rel(research_agent, drafting_agent, "Provides legal precedents", "via Communication Hub")
    Rel(drafting_agent, review_agent, "Submits drafts for review", "via Communication Hub")
    Rel(review_agent, case_agent, "Updates case status", "via Communication Hub")

    Rel(document_agent, vector_store, "Queries legal knowledge", "Vector Search")
    Rel(research_agent, vector_store, "Retrieves precedents", "Vector Search")
    Rel(drafting_agent, vector_store, "Accesses templates", "Vector Search")

    Rel(state_manager, workflow_state, "Persists agent state", "Redis Protocol")
    Rel(communication_hub, workflow_state, "Manages message queues", "Redis Protocol")

    Rel(document_agent, ai_services, "Legal analysis requests", "HTTPS")
    Rel(research_agent, ai_services, "Research queries", "HTTPS")
    Rel(drafting_agent, ai_services, "Document generation", "HTTPS")
    Rel(review_agent, ai_services, "Compliance checking", "HTTPS")
    Rel(case_agent, ai_services, "Timeline analysis", "HTTPS")
```

## Support

`Shirts` is designed to work across multiple platforms:

-   **Web Browsers**: Modern browsers supporting ES2020+ features
-   **Desktop**: Via web application in Chrome, Firefox, Safari, Edge
-   **Development**: Node.js 20+, npm 10+, Docker for containerization
-   **Production**: Docker Compose orchestration with Redis caching

For support, please [open an issue](https://github.com/gongahkia/shirts/issues) on GitHub.

## Legal

### Disclaimer

This software is provided "as is" without warranty of any kind, express or implied. The developers make no representations or warranties regarding the accuracy, reliability, or completeness of the software. Users assume all risks associated with the use of this application, including but not limited to data loss, security vulnerabilities, or unintended automation of legal processes.

**Important**: This application is for educational and research purposes. Any legal documents or advice generated should be reviewed by qualified legal professionals before use in actual legal proceedings.

## Reference

The name `Shirts` is in reference to the legal drama TV series [Suits](https://suits.fandom.com/wiki/Suits_Wiki), which follows talented college dropout [Mike Ross](https://suits.fandom.com/wiki/Mike_Ross) who starts working as a law associate for [Harvey Specter](https://suits.fandom.com/wiki/Harvey_Specter) despite never attending law school.

<div align="center">
    <img src="./asset/logo/suits.png" width="75%">
</div>

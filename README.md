# Rag PDF Project

## Project Overview

A scalable Node.js backend service that enables users to upload PDF files, processes them asynchronously, stores semantic embeddings in a vector database, and delivers AI-powered conversational responses grounded in the PDF content.

## Project Features

- **PDF Upload:** Users upload PDF files via an API.
- **Asynchronous Processing:** Background worker processes PDFs using BullMQ queue.
- **Vector Database:** Embeddings stored in Qdrant vector store.
- **AI Chat:** GPT-4.1 model answers user queries based on vector search context.
- **REST API:** Endpoints for file upload and chat interaction.

---

## Technology Stack & Libraries

- Node.js & Express.js — API server
- Multer — File upload handling
- BullMQ + Valkey — Background job queue (Valkey is Redis-compatible)
- Qdrant — Vector database for semantic search
- OpenAI API — GPT-4.1 for AI chat completion
- LangChain & LangChain OpenAI Embeddings — Embeddings and vector store integration
- CORS — Cross-origin resource sharing

---

## Features & Workflow

### 1. PDF Upload & Queueing

- Upload PDFs via `POST /upload/pdf` (field name: `pdf`).
- Files saved locally under `uploads/`.
- Metadata enqueued into BullMQ queue (`file-upload-queue`) for background processing.

### 2. Background Worker Processing

- Worker listens to the queue.
- Loads PDF, extracts text content.
- Generates embeddings using OpenAI's embedding model.
- Adds document embeddings to an existing Qdrant collection.

### 3. AI Chat Endpoint

- Query AI via `GET /chat?message=your_query`.
- Uses LangChain retriever to fetch top relevant docs from Qdrant.
- Constructs prompt including context and user query.
- Calls OpenAI GPT-4.1 chat completion.
- Returns AI response plus related documents.

---

## Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Clerk API keys (if applicable)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key_here

# Valkey (Redis-compatible queue) connection
VALKEY_HOST=localhost
VALKEY_PORT=6379

# Qdrant vector database URL and collection name
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=langchainjs-testing
```

## Run this project locally

### Must run the Docker Engine at first on the root folder

```
docker compose up -d
```

### Frontend

```
cd client
npm run dev
```

### Server

```
cd server
npm run dev
npm run dev:worker
```

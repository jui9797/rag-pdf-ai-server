import dotenv from "dotenv";
import { Worker } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";

dotenv.config();

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    const data = JSON.parse(job.data);
    console.log("Job data path:", data.path);

    // Load the PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    // Split into chunks
    const splitter = new CharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    console.log("Total Chunks:", splitDocs.length);

    // OpenAI Embeddings
    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create collection first time
    try {
      const vectorStore = await QdrantVectorStore.fromDocuments(
        splitDocs,
        embeddings,
        {
          url: "http://localhost:6333",
          collectionName: "langchainjs-testing",
        }
      );
      console.log(`All docs are added to vector store`); //here a collection is made in qadrent db names  langchainjs-testing
    } catch (err) {
      console.error("❌ Qdrant error:", err);
    }
  },
  {
    concurrency: 100,
    connection: {
      host: "localhost",
      port: "6379",
    },
  }
);

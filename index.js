import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { Queue } from "bullmq";
import OpenAI from "openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
// import { json } from "stream/consumers";

dotenv.config();

// OpenAI client initialize
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());

//upload a pdf file functionality
app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      fileName: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  return res.json({ message: "File uploaded successfully!" });
});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.message;
  console.log("userQuery:", userQuery);

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "langchainjs-testing",
    }
  );

  const ret = vectorStore.asRetriever({
    k: 2,
  });
  const result = await ret.invoke(userQuery);

  const SYSTEM_PROMPT = `
  You are helfull AI Assistant who answeres the user query based on the available context from PDF File.
  Context:
  ${JSON.stringify(result)}
  `;

  const chatResult = await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userQuery },
    ],
  });

  return res.json({
    message: chatResult.choices[0].message.content,
    docs: result,
  });

  /**
 * $ curl "http://localhost:8000/chat?message=hello"
{"message":"Hello! How can I assist you today? If you have any questions about the PDF document or need help with something else, just let me know!","docs":[{"pageContent":"content which is inside the provided pdf file","metadata":{"source":"uploads/1697043039273-123sample.pdf","page":0}},{"pageContent":"more content which is inside the provided pdf file","metadata":{"source":"uploads/1697043039273-123sample.pdf","page":1}}]}
 */
});

app.get("/", (req, res) => {
  return res.json({ status: "All Good!" });
});

app.listen(8000, () => console.log(`Server started on PORT:${8000}`));

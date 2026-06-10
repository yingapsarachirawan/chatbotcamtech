/* global process */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";

/* =========================
   Setup
========================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env"),
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })
  : null;

const KNOWLEDGE_FOLDER = path.join(__dirname, "knowledge");

let knowledgeChunks = [];
let embeddedChunks = [];
let loadedPdfName = null;
let semanticSearchReady = false;

/*
  Simple in-memory conversation memory.
  This resets when Render restarts, which is okay for demo.
*/
const conversationMemory = new Map();

/* =========================
   Load PDF Knowledge
========================= */

function getKnowledgePdfPath() {
  if (!fs.existsSync(KNOWLEDGE_FOLDER)) {
    fs.mkdirSync(KNOWLEDGE_FOLDER, { recursive: true });
  }

  const files = fs.readdirSync(KNOWLEDGE_FOLDER);
  const pdfFile = files.find((file) => file.toLowerCase().endsWith(".pdf"));

  if (!pdfFile) {
    return null;
  }

  loadedPdfName = pdfFile;
  return path.join(KNOWLEDGE_FOLDER, pdfFile);
}

async function loadKnowledgePdf() {
  try {
    const pdfPath = getKnowledgePdfPath();

    if (!pdfPath) {
      console.warn("No school information PDF found.");
      knowledgeChunks = [];
      embeddedChunks = [];
      semanticSearchReady = false;
      return;
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();

    knowledgeChunks = splitTextIntoChunks(result.text);

    console.log(`School information loaded: ${loadedPdfName}`);
    console.log(`Total chunks created: ${knowledgeChunks.length}`);

    await buildSemanticIndex();
  } catch (error) {
    console.error("Failed to load school information:", error.message);
    knowledgeChunks = [];
    embeddedChunks = [];
    semanticSearchReady = false;
  }
}

/* =========================
   Text Helpers
========================= */

function splitTextIntoChunks(text, chunkSize = 1100, overlap = 150) {
  const cleanedText = text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const chunks = [];
  let start = 0;

  while (start < cleanedText.length) {
    const end = start + chunkSize;
    const chunk = cleanedText.slice(start, end);

    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

// eslint-disable-next-line no-unused-vars
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanAnswer(answer) {
  return answer
    .replace(/CamTech document/gi, "school information")
    .replace(/the document/gi, "the information")
    .replace(/document context/gi, "school information")
    .replace(/PDF/gi, "information")
    .replace(/knowledge base/gi, "information")
    .replace(/source/gi, "information")
    .replace(/retrieved information/gi, "information")
    .replace(/context/gi, "information")
    .replace(/Q:\s*/gi, "")
    .replace(/A:\s*/gi, "")
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/_{5,}/g, "")
    .replace(/={3,}/g, "")
    .replace(/-{3,}/g, "")
    .replace(/\*{3,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isBadChunk(chunk) {
  const text = chunk.toLowerCase();

  return (
    text.includes("table of contents") ||
    text.includes("official knowledge base") ||
    text.includes("option 1: single optimized pdf") ||
    text.includes("page 2") ||
    text.includes("page 5")
  );
}

/* =========================
   Embedding + Semantic Search
========================= */

function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text) {
  if (!ai) {
    return null;
  }

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  const embedding =
    response.embeddings?.[0]?.values || response.embedding?.values;

  if (!embedding) {
    throw new Error("Embedding response was empty.");
  }

  return embedding;
}

async function buildSemanticIndex() {
  embeddedChunks = [];
  semanticSearchReady = false;

  if (!ai || knowledgeChunks.length === 0) {
    console.log("Semantic search skipped.");
    return;
  }

  try {
    console.log("Building semantic search index...");

    for (let i = 0; i < knowledgeChunks.length; i += 1) {
      const chunk = knowledgeChunks[i];

      if (isBadChunk(chunk)) {
        continue;
      }

      const embedding = await getEmbedding(chunk);

      embeddedChunks.push({
        text: chunk,
        embedding,
      });

      console.log(`Embedded chunk ${i + 1}/${knowledgeChunks.length}`);
    }

    semanticSearchReady = embeddedChunks.length > 0;

    console.log(`Semantic search ready: ${semanticSearchReady ? "YES" : "NO"}`);
  } catch (error) {
    console.error("Semantic search setup failed:", error.message);
    embeddedChunks = [];
    semanticSearchReady = false;
  }
}

async function findSemanticChunks(question, memory) {
  if (!semanticSearchReady || embeddedChunks.length === 0 || !ai) {
    return [];
  }

  try {
    const searchQuery = `
Current question: ${question}

Previous conversation:
${memory.history
  .slice(-4)
  .map((item) => `${item.role}: ${item.text}`)
  .join("\n")}
`;

    const questionEmbedding = await getEmbedding(searchQuery);

    return embeddedChunks
      .map((chunk) => ({
        text: chunk.text,
        score: cosineSimilarity(questionEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .filter((item) => item.score > 0.35)
      .map((item) => item.text);
  } catch (error) {
    console.error("Semantic search failed:", error.message);
    return [];
  }
}

/* =========================
   AI-First Answer Generation
========================= */

async function generateSmartAnswer(question, relevantChunks, memory) {
  if (!ai) {
    return "Sorry, the AI service is not available right now. Please contact the school office for confirmation.";
  }

  const schoolInformation =
    relevantChunks.length > 0
      ? relevantChunks.join("\n\n---\n\n")
      : "No strongly related school information was found.";

  const recentConversation = memory.history
    .slice(-6)
    .map((item) => `${item.role}: ${item.text}`)
    .join("\n");

  const prompt = `
You are CamTech Chatbot, a smart and friendly school information assistant.

Your job:
- Understand the student's message naturally.
- Use the previous conversation to understand follow-up questions.
- Use the school information to answer school-related questions.
- If the message is casual, reply naturally and briefly.
- If the student asks a follow-up like "what about master?", "how much?", "and scholarship?", understand it from the previous conversation.
- Do not act like a keyword bot.
- Do not reveal internal system details.

Very important rules:
- Do not mention PDF, document, source, context, chunks, embeddings, semantic search, or knowledge base.
- Do not show page numbers.
- Do not show raw Q/A format.
- Do not invent exact information if it is not available.
- If exact information is not available, say that the student should contact the school office for confirmation.
- Keep answers natural, helpful, and not too long.
- Use bullet points only when useful.
- If the question is unclear, ask a helpful follow-up question.

Previous conversation:
${recentConversation || "No previous conversation yet."}

School information:
${schoolInformation}

Student message:
${question}

Reply as CamTech Chatbot:
`;

  try {
    console.log("Trying Gemini model: gemini-2.0-flash");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    return cleanAnswer(response.text);
  } catch (error) {
    console.error("Gemini error:", error.message);

    return "Sorry, I could not answer that clearly right now. Please try again or contact the school office for confirmation.";
  }
}

/* =========================
   Suggested Questions
========================= */

function getSuggestedQuestions() {
  return [
    "What are the admission requirements?",
    "I want to know about tuition fee",
    "What are the English requirements?",
  ];
}

/* =========================
   Memory Helpers
========================= */

function getSessionId(req) {
  return (
    req.body.sessionId ||
    req.headers["x-session-id"] ||
    req.ip ||
    "default-session"
  );
}

function getMemory(sessionId) {
  if (!conversationMemory.has(sessionId)) {
    conversationMemory.set(sessionId, {
      history: [],
    });
  }

  return conversationMemory.get(sessionId);
}

function updateMemory(memory, role, text) {
  memory.history.push({
    role,
    text,
  });

  if (memory.history.length > 10) {
    memory.history = memory.history.slice(-10);
  }
}

/* =========================
   Routes
========================= */

app.get("/", (req, res) => {
  res.json({
    message: "CamTech Chatbot API is running",
    status: "OK",
    aiProvider: ai ? "Google Gemini" : "No Gemini API key",
    ready: knowledgeChunks.length > 0,
    semanticSearchReady,
    faqCount: 0,
    mode: "AI-first RAG with memory",
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    apiRunning: true,
    aiProvider: ai ? "Google Gemini" : "No Gemini API key",
    ready: knowledgeChunks.length > 0,
    semanticSearchReady,
    faqCount: 0,
    mode: "AI-first RAG with memory",
  });
});

app.post("/api/reload-knowledge", async (req, res) => {
  await loadKnowledgePdf();

  res.json({
    message: "School information reloaded",
    ready: knowledgeChunks.length > 0,
    semanticSearchReady,
    mode: "AI-first RAG with memory",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Question is required.",
      });
    }

    if (knowledgeChunks.length === 0) {
      return res.json({
        answer:
          "Sorry, the chatbot is not ready yet. Please contact the school office for confirmation.",
        suggestedQuestions: [],
      });
    }

    const sessionId = getSessionId(req);
    const memory = getMemory(sessionId);

    updateMemory(memory, "student", question);

    const relevantChunks = await findSemanticChunks(question, memory);
    const answer = await generateSmartAnswer(question, relevantChunks, memory);

    updateMemory(memory, "assistant", answer);

    return res.json({
      answer,
      suggestedQuestions: getSuggestedQuestions(),
    });
  } catch (error) {
    console.error("Chat error:", error.message);

    return res.status(500).json({
      error: "Sorry, something went wrong. Please try again later.",
    });
  }
});

/* =========================
   Start Server
========================= */

app.listen(PORT, async () => {
  await loadKnowledgePdf();

  console.log(`CamTech Chatbot API running on port ${PORT}`);
});
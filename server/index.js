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

console.log("ENV file path:", path.join(__dirname, ".env"));
console.log("Gemini key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

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
const EMBEDDING_CACHE_PATH = path.join(
  KNOWLEDGE_FOLDER,
  "embeddings-cache.json"
);

const ENABLE_GEMINI_EMBEDDINGS =
  process.env.ENABLE_GEMINI_EMBEDDINGS === "true";

let knowledgeChunks = [];
let embeddedChunks = [];
let loadedPdfName = null;
let semanticSearchReady = false;
let embeddingStatus = "not used";

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

  if (!pdfFile) return null;

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

    await prepareEmbeddings();
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

function splitTextIntoChunks(text, chunkSize = 900, overlap = 100) {
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

    if (chunk.trim()) chunks.push(chunk.trim());

    start += chunkSize - overlap;
  }

  return chunks;
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanAnswer(answer) {
  if (!answer) return "";

  return answer
    .replace(/CamTech document/gi, "school information")
    .replace(/the document/gi, "the information")
    .replace(/document context/gi, "school information")
    .replace(/PDF/gi, "information")
    .replace(/knowledge base/gi, "information")
    .replace(/source/gi, "information")
    .replace(/retrieved information/gi, "information")
    .replace(/context/gi, "information")
    .replace(/chunks/gi, "information")
    .replace(/embeddings/gi, "information")
    .replace(/semantic search/gi, "search")
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

function cleanPdfLine(line) {
  return line
    .replace(/Q:\s*/gi, "")
    .replace(/A:\s*/gi, "")
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/_{5,}/g, "")
    .replace(/={3,}/g, "")
    .replace(/-{3,}/g, "")
    .replace(/\.+\s*Page\s*\d+/gi, "")
    .replace(/Page\s*\d+/gi, "")
    .replace(/\s+/g, " ")
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
   Gemini Embedding Search
========================= */

function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbedding(text) {
  if (!ai) return null;

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

function loadEmbeddingCache() {
  try {
    if (!fs.existsSync(EMBEDDING_CACHE_PATH)) return false;

    const cache = JSON.parse(fs.readFileSync(EMBEDDING_CACHE_PATH, "utf8"));

    if (!Array.isArray(cache.embeddedChunks)) return false;

    embeddedChunks = cache.embeddedChunks;
    semanticSearchReady = embeddedChunks.length > 0;
    embeddingStatus = "loaded from cache";

    console.log(`Embedding cache loaded: ${embeddedChunks.length} chunks`);
    return true;
  } catch (error) {
    console.error("Failed to load embedding cache:", error.message);
    return false;
  }
}

function saveEmbeddingCache() {
  try {
    const cache = {
      pdfName: loadedPdfName,
      createdAt: new Date().toISOString(),
      embeddedChunks,
    };

    fs.writeFileSync(EMBEDDING_CACHE_PATH, JSON.stringify(cache, null, 2));
    console.log("Embedding cache saved.");
  } catch (error) {
    console.error("Failed to save embedding cache:", error.message);
  }
}

async function prepareEmbeddings() {
  embeddedChunks = [];
  semanticSearchReady = false;
  embeddingStatus = "not used";

  const cacheLoaded = loadEmbeddingCache();

  if (cacheLoaded) {
    return;
  }

  if (!ENABLE_GEMINI_EMBEDDINGS) {
    embeddingStatus = "disabled, using normal search";
    console.log("Gemini embeddings disabled. Using normal PDF search.");
    return;
  }

  if (!ai || knowledgeChunks.length === 0) {
    embeddingStatus = "unavailable";
    return;
  }

  try {
    console.log("Building Gemini embedding cache...");

    for (let i = 0; i < knowledgeChunks.length; i += 1) {
      const chunk = knowledgeChunks[i];

      if (isBadChunk(chunk)) continue;

      const embedding = await getEmbedding(chunk);

      embeddedChunks.push({
        text: chunk,
        embedding,
      });

      console.log(`Embedded chunk ${i + 1}/${knowledgeChunks.length}`);
    }

    semanticSearchReady = embeddedChunks.length > 0;
    embeddingStatus = semanticSearchReady
      ? "built with Gemini"
      : "not available";

    if (semanticSearchReady) {
      saveEmbeddingCache();
    }
  } catch (error) {
    console.error("Embedding quota/error:", error.message);

    embeddedChunks = [];
    semanticSearchReady = false;
    embeddingStatus = "failed, using normal search";
  }
}

async function findSemanticChunks(question, memory) {
  if (!semanticSearchReady || embeddedChunks.length === 0 || !ai) {
    return [];
  }

  try {
    const searchQuery = `
Current student message:
${question}

Recent conversation:
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
      .filter((item) => item.score > 0.32)
      .map((item) => item.text);
  } catch (error) {
    console.error("Semantic search failed, using normal search:", error.message);
    return [];
  }
}

/* =========================
   Normal PDF Search Backup
========================= */

function getQuestionWords(question, memory) {
  const recentConversation = memory.history
    .slice(-4)
    .map((item) => item.text)
    .join(" ");

  const combinedText = `${question} ${recentConversation}`;

  const stopWords = [
    "i",
    "me",
    "my",
    "you",
    "your",
    "we",
    "they",
    "it",
    "is",
    "are",
    "was",
    "were",
    "do",
    "does",
    "did",
    "can",
    "could",
    "would",
    "should",
    "the",
    "a",
    "an",
    "to",
    "of",
    "for",
    "in",
    "on",
    "at",
    "and",
    "or",
    "but",
    "so",
    "with",
    "about",
    "what",
    "how",
    "when",
    "where",
    "why",
    "which",
    "please",
    "tell",
    "know",
    "want",
    "need",
    "give",
    "more",
    "then",
    "also",
    "again",
  ];

  const words = normalizeText(combinedText)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  const expanded = [...words];
  const text = normalizeText(combinedText);

  if (
    text.includes("pay") ||
    text.includes("fee") ||
    text.includes("cost") ||
    text.includes("tuition") ||
    text.includes("price") ||
    text.includes("expensive")
  ) {
    expanded.push("tuition", "fee", "fees", "cost", "payment");
  }

  if (
    text.includes("apply") ||
    text.includes("admission") ||
    text.includes("requirement") ||
    text.includes("document") ||
    text.includes("paper") ||
    text.includes("enroll") ||
    text.includes("enrol")
  ) {
    expanded.push(
      "admission",
      "application",
      "requirement",
      "requirements",
      "documents",
      "certificate",
      "transcript"
    );
  }

  if (
    text.includes("english") ||
    text.includes("ielts") ||
    text.includes("toefl") ||
    text.includes("language")
  ) {
    expanded.push("english", "ielts", "toefl", "proficiency", "language");
  }

  if (
    text.includes("scholarship") ||
    text.includes("discount") ||
    text.includes("financial") ||
    text.includes("support")
  ) {
    expanded.push("scholarship", "financial", "support", "discount");
  }

  if (
    text.includes("contact") ||
    text.includes("phone") ||
    text.includes("email") ||
    text.includes("office") ||
    text.includes("location") ||
    text.includes("address")
  ) {
    expanded.push("contact", "phone", "email", "office", "location", "address");
  }

  if (text.includes("master") || text.includes("masters")) {
    expanded.push("master", "graduate");
  }

  if (text.includes("bachelor")) {
    expanded.push("bachelor", "undergraduate");
  }

  if (
    text.includes("phd") ||
    text.includes("doctoral") ||
    text.includes("doctorate")
  ) {
    expanded.push("phd", "doctoral", "doctorate");
  }

  return [...new Set(expanded)];
}

function findNormalChunks(question, memory) {
  const words = getQuestionWords(question, memory);

  if (words.length === 0) {
    return knowledgeChunks.filter((chunk) => !isBadChunk(chunk)).slice(0, 2);
  }

  const scoredChunks = knowledgeChunks.map((chunk) => {
    const chunkText = normalizeText(chunk);
    let score = 0;

    for (const word of words) {
      if (chunkText.includes(word)) {
        score += 2;
      }
    }

    if (isBadChunk(chunk)) {
      score -= 20;
    }

    return {
      text: chunk,
      score,
    };
  });

  return scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.text);
}

async function findBestChunks(question, memory) {
  const semanticChunks = await findSemanticChunks(question, memory);

  if (semanticChunks.length > 0) {
    return {
      chunks: semanticChunks,
      searchUsed: "Gemini embedding search",
    };
  }

  return {
    chunks: findNormalChunks(question, memory),
    searchUsed: "normal PDF search",
  };
}

/* =========================
   Clean Fallback Answer
========================= */

function createCleanFallbackAnswer(question, relevantChunks) {
  if (relevantChunks.length === 0) {
    return "I could not find enough information for that. Please ask about admission, tuition fees, scholarships, English requirements, programs, or contact information.";
  }

  const text = relevantChunks.join("\n");
  const normalizedQuestion = normalizeText(question);

  if (
    normalizedQuestion.includes("tuition") ||
    normalizedQuestion.includes("fee") ||
    normalizedQuestion.includes("cost") ||
    normalizedQuestion.includes("pay") ||
    normalizedQuestion.includes("price")
  ) {
    return "For tuition fee information, please contact the admissions office for the latest and most accurate fee details. Tuition fees may depend on the program and study level.";
  }

  if (
    normalizedQuestion.includes("admission") ||
    normalizedQuestion.includes("apply") ||
    normalizedQuestion.includes("requirement") ||
    normalizedQuestion.includes("document") ||
    normalizedQuestion.includes("paper")
  ) {
    return "For admission, students may need to prepare academic records, application information, and supporting documents depending on the program level. Please contact the school office for confirmation of the exact requirements.";
  }

  if (
    normalizedQuestion.includes("english") ||
    normalizedQuestion.includes("ielts") ||
    normalizedQuestion.includes("toefl")
  ) {
    return "English requirements depend on the program level. Accepted English proficiency tests may include IELTS, TOEFL, or equivalent results. Please confirm the exact requirement with the school office.";
  }

  const lines = text
    .split(/\n+/)
    .map(cleanPdfLine)
    .filter((line) => line.length > 20)
    .filter((line) => !line.toLowerCase().includes("table of contents"))
    .filter((line) => !line.toLowerCase().includes("official knowledge base"))
    .filter((line) => !line.toLowerCase().includes("option 1"))
    .filter((line) => !line.match(/^page\s*\d+$/i));

  const uniqueLines = [...new Set(lines)].slice(0, 4);

  if (uniqueLines.length === 0) {
    return "I found some related information, but I need a more specific question to answer clearly.";
  }

  return cleanAnswer(
    `${uniqueLines
      .map((line) => `- ${line}`)
      .join("\n")}\n\nPlease verify important information with the school office.`
  );
}

/* =========================
   Gemini Answer Generation
========================= */

function extractGeminiText(response) {
  if (!response) return "";

  if (typeof response.text === "string") {
    return response.text;
  }

  if (typeof response.text === "function") {
    return response.text();
  }

  const candidateText =
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

  return candidateText;
}

async function callGemini(model, prompt) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const answer = extractGeminiText(response);

  if (!answer || !answer.trim()) {
    throw new Error("Gemini returned an empty answer.");
  }

  return answer;
}

async function generateSmartAnswer(question, relevantChunks, memory, searchUsed) {
  if (!ai) {
    return createCleanFallbackAnswer(question, relevantChunks);
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
You are CamTech Chatbot, a helpful school information assistant.

Behave like a normal AI assistant, not a keyword bot.

Use the recent conversation to understand follow-up questions.
Use the school information to answer CamTech-related questions.
If the message is casual, reply naturally and briefly.

Rules:
- Do not mention PDF, document, source, context, chunks, embeddings, semantic search, search method, or knowledge base.
- Do not show page numbers.
- Do not show raw Q/A format.
- Do not invent exact details if they are not available.
- If exact details are not available, tell the student to contact the school office for confirmation.
- Keep the answer clear, helpful, and not too long.
- Use bullet points only when useful.
- If the question is unclear, ask a helpful follow-up question.

Recent conversation:
${recentConversation || "No previous conversation yet."}

School information:
${schoolInformation}

Student message:
${question}

Reply as CamTech Chatbot:
`;

  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.5-flash",
  ];

  for (const model of models) {
    try {
      console.log(`Trying Gemini answer model: ${model}`);
      const answer = await callGemini(model, prompt);
      return cleanAnswer(answer);
    } catch (error) {
      console.error(`${model} answer error:`, error.message);
    }
  }

  console.log(`Gemini answer failed. Fallback used after ${searchUsed}.`);
  return createCleanFallbackAnswer(question, relevantChunks);
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
    embeddingStatus,
    answerMode: "Gemini with normal fallback",
    note:
      "Gemini is used when quota is available. Normal PDF fallback is used when quota fails.",
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    apiRunning: true,
    aiProvider: ai ? "Google Gemini" : "No Gemini API key",
    ready: knowledgeChunks.length > 0,
    semanticSearchReady,
    embeddingStatus,
    answerMode: "Gemini with normal fallback",
  });
});

app.post("/api/reload-knowledge", async (req, res) => {
  await loadKnowledgePdf();

  res.json({
    message: "School information reloaded",
    ready: knowledgeChunks.length > 0,
    semanticSearchReady,
    embeddingStatus,
    answerMode: "Gemini with normal fallback",
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

    const { chunks, searchUsed } = await findBestChunks(question, memory);
    const answer = await generateSmartAnswer(
      question,
      chunks,
      memory,
      searchUsed
    );

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
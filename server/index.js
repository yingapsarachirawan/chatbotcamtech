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

let knowledgeChunks = [];
let embeddedChunks = [];
let loadedPdfName = null;
let semanticSearchReady = false;

/* =========================
   FAQ Knowledge
========================= */

const faqKnowledge = [
  {
    category: "Admission",
    questions: [
      "admission",
      "admission requirements",
      "how to apply",
      "application process",
      "entry requirement",
      "what documents are required",
      "documents for admission",
      "required documents",
      "what papers do i need",
      "what should i prepare",
      "how can i join",
      "how do i apply",
      "enroll",
      "enrol",
      "registration",
    ],
    answer:
      "For admission, students may need to prepare academic records, application information, and supporting documents depending on the program level. Please specify Bachelor’s, Master’s, or PhD if you want more specific requirements.",
  },
  {
    category: "Tuition",
    questions: [
      "tuition",
      "tuition fee",
      "school fee",
      "how much is the fee",
      "payment information",
      "program fee",
      "cost of study",
      "study cost",
      "how much do i need to pay",
      "how much does it cost",
      "price",
      "payment",
      "pay",
      "fee",
      "expensive",
    ],
    answer:
      "For tuition fees, please contact the admissions office for the latest fee information. Tuition fees may depend on the program and study level.",
  },
  {
    category: "Scholarship",
    questions: [
      "scholarship",
      "financial aid",
      "discount",
      "scholarship eligibility",
      "scholarship deadline",
      "scholarship application",
      "can i get discount",
      "can i get support",
      "study support",
      "fee discount",
      "funding",
    ],
    answer:
      "Scholarship information may depend on eligibility, program level, application period, and required documents. Please contact the school office for the latest scholarship details.",
  },
  {
    category: "Programs",
    questions: [
      "programs",
      "courses",
      "major",
      "degree programs",
      "what can i study",
      "available programs",
      "academic programs",
      "what majors are available",
      "what course do you have",
      "field of study",
      "study options",
    ],
    answer:
      "CamTech offers different academic programs, including Bachelor’s, Master’s, PhD, Professional Diploma, and preparatory programs. You can ask about a specific level or field for a clearer answer.",
  },
  {
    category: "English Requirement",
    questions: [
      "english requirement",
      "ielts",
      "toefl",
      "english proficiency",
      "minimum ielts",
      "minimum toefl",
      "english score",
      "language requirement",
      "do i need ielts",
      "english test",
    ],
    answer:
      "English requirements depend on the program level. Accepted English proficiency tests may include IELTS, TOEFL, or equivalent results.",
  },
  {
    category: "Contact",
    questions: [
      "contact",
      "phone number",
      "email",
      "office",
      "location",
      "school address",
      "how to contact",
      "contact office",
      "where is the school",
      "how can i reach",
      "call",
      "address",
      "map",
    ],
    answer:
      "For official contact information, please contact the school office directly for the most accurate phone number, email, or office support details.",
  },
  {
    category: "Class Schedule",
    questions: [
      "class schedule",
      "timetable",
      "study time",
      "class time",
      "when is class",
      "schedule",
      "study schedule",
      "lesson time",
      "what time is class",
    ],
    answer:
      "Class schedule information depends on the program, intake, and study level. Please provide the program name or study level so I can help you more accurately.",
  },
];

/* =========================
   Load School Information
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
      console.warn("No school information file found.");
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

function splitTextIntoChunks(text, chunkSize = 1300, overlap = 180) {
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

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGreeting(question) {
  const text = normalizeText(question);

  return [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "morning",
    "afternoon",
    "evening",
  ].includes(text);
}

function isThanks(question) {
  const text = normalizeText(question);

  return [
    "thanks",
    "thank you",
    "thank",
    "thank u",
    "ty",
    "okay thanks",
    "ok thanks",
    "cool thanks",
  ].includes(text);
}

function isAcknowledgement(question) {
  const text = normalizeText(question);

  return [
    "ok",
    "okay",
    "oh",
    "ohh",
    "oh i see",
    "i see",
    "got it",
    "alright",
    "sure",
    "cool",
    "nice",
    "yes",
    "yep",
    "yeah",
    "understood",
  ].includes(text);
}

function isVagueFollowUp(question) {
  const text = normalizeText(question);

  return [
    "and",
    "then",
    "more",
    "what else",
    "also",
    "continue",
    "next",
    "what about",
    "how about",
    "and then",
  ].includes(text);
}

function isGeneralHelpQuestion(question) {
  const text = normalizeText(question);

  return (
    text.includes("what can you do") ||
    text.includes("help me") ||
    text.includes("how can you help") ||
    text.includes("who are you") ||
    text.includes("faq") ||
    text.includes("common question")
  );
}

function getQuestionKeywords(question) {
  const stopWords = [
    "i",
    "want",
    "to",
    "know",
    "about",
    "the",
    "a",
    "an",
    "is",
    "are",
    "for",
    "of",
    "and",
    "or",
    "what",
    "how",
    "can",
    "you",
    "me",
    "please",
    "tell",
    "give",
    "with",
    "need",
    "oh",
    "ok",
    "okay",
    "this",
    "that",
    "there",
    "then",
    "also",
    "again",
  ];

  const words = normalizeText(question)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  const expandedWords = [...words];

  if (
    words.includes("fee") ||
    words.includes("fees") ||
    words.includes("tuition") ||
    words.includes("pay") ||
    words.includes("price") ||
    words.includes("cost") ||
    words.includes("much") ||
    words.includes("expensive")
  ) {
    expandedWords.push("tuition", "fee", "fees", "cost", "payment");
  }

  if (
    words.includes("admission") ||
    words.includes("requirements") ||
    words.includes("apply") ||
    words.includes("enroll") ||
    words.includes("enrol") ||
    words.includes("paper") ||
    words.includes("papers")
  ) {
    expandedWords.push(
      "admission",
      "requirement",
      "requirements",
      "application",
      "documents",
      "transcript",
      "certificate"
    );
  }

  if (words.includes("master") || words.includes("masters")) {
    expandedWords.push("master", "masters", "graduate");
  }

  if (words.includes("bachelor")) {
    expandedWords.push("bachelor", "undergraduate");
  }

  if (words.includes("phd") || words.includes("doctoral") || words.includes("doctorate")) {
    expandedWords.push("phd", "doctoral", "doctorate");
  }

  if (
    words.includes("english") ||
    words.includes("ielts") ||
    words.includes("toefl") ||
    words.includes("language")
  ) {
    expandedWords.push("english", "ielts", "toefl", "proficiency", "score");
  }

  if (
    words.includes("contact") ||
    words.includes("office") ||
    words.includes("phone") ||
    words.includes("email") ||
    words.includes("address") ||
    words.includes("where")
  ) {
    expandedWords.push("contact", "phone", "email", "office", "address", "location");
  }

  return [...new Set(expandedWords)];
}

function getFaqAnswer(question) {
  const questionText = normalizeText(question);

  let bestMatch = null;
  let bestScore = 0;

  for (const faq of faqKnowledge) {
    let score = 0;

    for (const phrase of faq.questions) {
      const phraseText = normalizeText(phrase);

      if (questionText.includes(phraseText)) {
        score += 5;
      }

      const phraseWords = phraseText.split(/\s+/);

      for (const word of phraseWords) {
        if (word.length > 2 && questionText.includes(word)) {
          score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  if (!bestMatch || bestScore < 3) {
    return null;
  }

  return {
    category: bestMatch.category,
    answer: bestMatch.answer,
  };
}

function isTableOfContentsChunk(chunk) {
  const text = chunk.toLowerCase();

  return (
    text.includes("table of contents") ||
    text.includes("official knowledge base") ||
    text.includes("option 1: single optimized pdf") ||
    text.includes("page 2") ||
    text.includes("page 5")
  );
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

/* =========================
   Semantic RAG Helpers
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

  const embedding = response.embeddings?.[0]?.values || response.embedding?.values;

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

      if (isTableOfContentsChunk(chunk)) {
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

async function findSemanticChunks(question) {
  if (!semanticSearchReady || embeddedChunks.length === 0 || !ai) {
    return [];
  }

  try {
    const questionEmbedding = await getEmbedding(question);

    return embeddedChunks
      .map((chunk) => ({
        text: chunk.text,
        score: cosineSimilarity(questionEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .filter((item) => item.score > 0.42)
      .map((item) => item.text);
  } catch (error) {
    console.error("Semantic search failed:", error.message);
    return [];
  }
}

/* =========================
   Keyword Fallback Search
========================= */

function findKeywordChunks(question, chunks) {
  const questionText = normalizeText(question);
  const keywords = getQuestionKeywords(question);

  const importantPhrases = [
    "tuition fee",
    "tuition fees",
    "admission requirements",
    "application requirements",
    "english proficiency",
    "master degree",
    "bachelor degree",
    "doctoral degree",
    "phd programs",
    "scholarship",
    "contact information",
    "academic programs",
    "class schedule",
    "required documents",
  ];

  const scoredChunks = chunks.map((chunk) => {
    const chunkText = normalizeText(chunk);
    let score = 0;

    for (const keyword of keywords) {
      if (chunkText.includes(keyword)) {
        score += 2;
      }
    }

    for (const phrase of importantPhrases) {
      if (questionText.includes(phrase) && chunkText.includes(phrase)) {
        score += 8;
      }
    }

    if (isTableOfContentsChunk(chunk)) {
      score -= 25;
    }

    return {
      text: chunk,
      score,
    };
  });

  return scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.text);
}

async function findBestChunks(question) {
  const semanticChunks = await findSemanticChunks(question);

  if (semanticChunks.length > 0) {
    return semanticChunks;
  }

  return findKeywordChunks(question, knowledgeChunks);
}

/* =========================
   Clean Fallback Answer
========================= */

function fallbackAnswer(question, relevantChunks, faqAnswer = null) {
  if (faqAnswer) {
    return cleanAnswer(faqAnswer.answer);
  }

  if (relevantChunks.length === 0) {
    return "Could you please be a bit more specific? You can ask about admission, tuition fees, scholarships, programs, class schedules, English requirements, or contact information.";
  }

  const text = relevantChunks.join("\n");
  const normalizedQuestion = normalizeText(question);

  if (
    normalizedQuestion.includes("tuition") ||
    normalizedQuestion.includes("fee") ||
    normalizedQuestion.includes("cost") ||
    normalizedQuestion.includes("pay") ||
    normalizedQuestion.includes("much") ||
    normalizedQuestion.includes("expensive")
  ) {
    return "For tuition fees, please contact the admissions office for the latest fee information. Tuition fees may depend on the program and study level.";
  }

  if (
    normalizedQuestion.includes("admission") ||
    normalizedQuestion.includes("apply") ||
    normalizedQuestion.includes("requirement") ||
    normalizedQuestion.includes("document") ||
    normalizedQuestion.includes("paper")
  ) {
    return "For admission, students may need to prepare academic records, application information, and supporting documents depending on the program level. Please specify Bachelor’s, Master’s, or PhD if you want more specific requirements.";
  }

  if (
    normalizedQuestion.includes("english") ||
    normalizedQuestion.includes("ielts") ||
    normalizedQuestion.includes("toefl") ||
    normalizedQuestion.includes("language")
  ) {
    return "English requirements depend on the program level. Accepted English proficiency tests may include IELTS, TOEFL, or equivalent results.";
  }

  if (
    normalizedQuestion.includes("scholarship") ||
    normalizedQuestion.includes("discount") ||
    normalizedQuestion.includes("financial")
  ) {
    return "Scholarship information may depend on eligibility, program level, application period, and required documents. Please contact the school office for the latest scholarship details.";
  }

  if (
    normalizedQuestion.includes("contact") ||
    normalizedQuestion.includes("phone") ||
    normalizedQuestion.includes("email") ||
    normalizedQuestion.includes("office") ||
    normalizedQuestion.includes("call")
  ) {
    return "For official contact information, please contact the school office directly for the most accurate phone number, email, or office support details.";
  }

  const qaMatch = text.match(/Q:\s*(.*?)\s*A:\s*(.*?)(?:\n|$)/is);

  if (qaMatch?.[2]) {
    return cleanAnswer(qaMatch[2]);
  }

  const keywords = getQuestionKeywords(question);
  const lines = text
    .split(/\n+/)
    .map(cleanPdfLine)
    .filter((line) => line.length > 8)
    .filter((line) => !line.toLowerCase().includes("table of contents"))
    .filter((line) => !line.toLowerCase().includes("official knowledge base"))
    .filter((line) => !line.toLowerCase().includes("option 1"))
    .filter((line) => !line.match(/^page\s*\d+$/i));

  const keywordLines = lines.filter((line) => {
    const lineText = normalizeText(line);
    return keywords.some((keyword) => lineText.includes(keyword));
  });

  const selectedLines = keywordLines.length > 0 ? keywordLines : lines;
  const uniqueLines = [...new Set(selectedLines)].slice(0, 4);

  if (uniqueLines.length === 0) {
    return "I found some related information, but I need a more specific question to answer clearly. You can ask about admission, tuition fees, scholarships, programs, class schedules, English requirements, or contact information.";
  }

  return cleanAnswer(
    `${uniqueLines.map((line) => `- ${line}`).join("\n")}\n\nPlease verify important information with the school office.`
  );
}

function getSuggestedQuestions(question) {
  const text = normalizeText(question);

  if (text.includes("admission") || text.includes("requirement") || text.includes("document")) {
    return [
      "What documents are required for admission?",
      "What are the English requirements?",
      "How can I contact the office?",
    ];
  }

  if (
    text.includes("tuition") ||
    text.includes("fee") ||
    text.includes("cost") ||
    text.includes("much") ||
    text.includes("pay")
  ) {
    return [
      "Are there any scholarships?",
      "What programs are available?",
      "How can I contact the office?",
    ];
  }

  if (text.includes("scholarship") || text.includes("discount")) {
    return [
      "What are the admission requirements?",
      "What documents are required?",
      "What is the tuition fee?",
    ];
  }

  if (text.includes("english") || text.includes("ielts") || text.includes("toefl")) {
    return [
      "What are the admission requirements?",
      "What programs are available?",
      "How can I contact the office?",
    ];
  }

  if (text.includes("contact") || text.includes("office") || text.includes("phone")) {
    return [
      "What are the admission requirements?",
      "What is the tuition fee?",
      "What programs are available?",
    ];
  }

  return [
    "What are the admission requirements?",
    "I want to know about tuition fee",
    "What are the English requirements?",
  ];
}

/* =========================
   AI Answer Generation
========================= */

async function callGeminiModel(model, prompt) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
}

async function generateGeminiAnswer(question, relevantChunks, faqAnswer = null) {
  if (!ai) {
    return fallbackAnswer(question, relevantChunks, faqAnswer);
  }

  const context = relevantChunks.join("\n\n---\n\n");

  const faqContext = faqAnswer
    ? `
Relevant school FAQ:
${faqAnswer.answer}
`
    : "";

  const prompt = `
You are CamTech Chatbot, a friendly and professional school information assistant.

Answer the student using ONLY the school information below.

Rules:
- Do not mention internal sources.
- Do not say "document", "PDF", "knowledge base", "context", "source", or "retrieved information".
- Do not explain where the information came from.
- Do not invent information.
- Do not show table of contents.
- Do not show page separators.
- Do not show raw Q/A format.
- Do not show page numbers.
- Reply naturally like a real school assistant.
- Keep the answer short but helpful.
- Use bullets only when useful.
- If the question is unclear, ask a helpful follow-up question instead of saying you cannot answer.
- If the answer is unavailable, say:
"Sorry, I could not find that information. Please contact the school office for confirmation."

${faqContext}

School information:
${context}

Student question:
${question}
`;

  const models = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-3-flash-preview",
  ];

  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      const answer = await callGeminiModel(model, prompt);
      return cleanAnswer(answer);
    } catch (error) {
      console.error(`${model} error:`, error.message);
    }
  }

  console.log("All AI models failed. Using fallback answer.");

  return fallbackAnswer(question, relevantChunks, faqAnswer);
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
    faqCount: faqKnowledge.length,
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    apiRunning: true,
    aiProvider: ai ? "Google Gemini" : "No Gemini API key",
    ready: knowledgeChunks.length > 0,
    semanticSearchReady,
    faqCount: faqKnowledge.length,
  });
});

app.post("/api/reload-knowledge", async (req, res) => {
  await loadKnowledgePdf();

  res.json({
    message: "School information reloaded",
    ready: knowledgeChunks.length > 0,
    semanticSearchReady,
    faqCount: faqKnowledge.length,
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

    if (isGreeting(question)) {
      return res.json({
        answer:
          "Hello! I’m CamTech Chatbot. You can ask me about admission requirements, tuition fees, scholarships, academic programs, class schedules, contact information, or general FAQs.",
        suggestedQuestions: [
          "What are the admission requirements?",
          "I want to know about tuition fee",
          "What are the English requirements?",
        ],
      });
    }

    if (isThanks(question)) {
      return res.json({
        answer: "You’re welcome! Is there anything else you would like to know?",
        suggestedQuestions: [
          "What programs are available?",
          "How can I contact the office?",
          "What is the tuition fee?",
        ],
      });
    }

    if (isAcknowledgement(question)) {
      return res.json({
        answer:
          "Sure. You can continue asking about admission, tuition fees, scholarships, programs, class schedules, English requirements, or contact information.",
        suggestedQuestions: [
          "What are the admission requirements?",
          "I want to know about tuition fee",
          "How can I contact the office?",
        ],
      });
    }

    if (isVagueFollowUp(question)) {
      return res.json({
        answer:
          "Sure — what would you like to know more about? You can ask about admission requirements, tuition fees, scholarships, programs, class schedules, English requirements, or contact information.",
        suggestedQuestions: [
          "I want to know about tuition fee",
          "What are the admission requirements?",
          "What are the English requirements?",
        ],
      });
    }

    if (isGeneralHelpQuestion(question)) {
      return res.json({
        answer:
          "I can help answer common CamTech questions, including:\n\n- Admission requirements\n- Tuition fees\n- Scholarship information\n- Available programs\n- English requirements\n- Class schedules\n- Contact information\n- General FAQs",
        suggestedQuestions: [
          "What are the admission requirements?",
          "I want to know about tuition fee",
          "Scholarship details",
        ],
      });
    }

    if (knowledgeChunks.length === 0) {
      return res.json({
        answer:
          "Sorry, the chatbot is not ready yet. Please contact the school office for confirmation.",
        suggestedQuestions: [],
      });
    }

    const faqAnswer = getFaqAnswer(question);
    const relevantChunks = await findBestChunks(question);
    const answer = await generateGeminiAnswer(question, relevantChunks, faqAnswer);

    return res.json({
      answer,
      suggestedQuestions: getSuggestedQuestions(question),
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
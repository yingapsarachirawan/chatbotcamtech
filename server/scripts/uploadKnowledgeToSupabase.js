/* global process */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverRoot = path.join(__dirname, "..");

dotenv.config({
  path: path.join(serverRoot, ".env"),
});

const KNOWLEDGE_FOLDER = path.join(serverRoot, "knowledge");

const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function getKnowledgePdfPath() {
  const files = fs.readdirSync(KNOWLEDGE_FOLDER);
  const pdfFile = files.find((file) => file.toLowerCase().endsWith(".pdf"));

  if (!pdfFile) {
    throw new Error("No PDF found inside server/knowledge.");
  }

  return {
    pdfName: pdfFile,
    pdfPath: path.join(KNOWLEDGE_FOLDER, pdfFile),
  };
}

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

    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

function normalizeVector(values) {
  const magnitude = Math.sqrt(
    values.reduce((sum, value) => sum + value * value, 0)
  );

  if (!magnitude) return values;

  return values.map((value) => value / magnitude);
}

async function getEmbedding(text) {
  const response = await ai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType: "RETRIEVAL_DOCUMENT",
    },
  });

  const values = response.embeddings?.[0]?.values || response.embedding?.values;

  if (!values) {
    throw new Error("Gemini returned empty embedding.");
  }

  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding dimension mismatch. Expected ${EMBEDDING_DIMENSIONS}, got ${values.length}.`
    );
  }

  return normalizeVector(values);
}

async function clearOldChunks(sourceName) {
  const { error } = await supabase
    .from("knowledge_chunks")
    .delete()
    .eq("source_name", sourceName);

  if (error) {
    throw error;
  }
}

async function uploadChunk({ content, sourceName, chunkIndex, embedding }) {
  const { error } = await supabase.from("knowledge_chunks").insert({
    content,
    source_name: sourceName,
    chunk_index: chunkIndex,
    embedding,
  });

  if (error) {
    throw error;
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in server/.env");
  }

  if (!process.env.SUPABASE_URL) {
    throw new Error("Missing SUPABASE_URL in server/.env");
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in server/.env");
  }

  const { pdfName, pdfPath } = getKnowledgePdfPath();

  console.log(`Reading PDF: ${pdfName}`);

  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();

  const chunks = splitTextIntoChunks(result.text);

  console.log(`Total chunks: ${chunks.length}`);
  console.log("Clearing old chunks...");

  await clearOldChunks(pdfName);

  for (let i = 0; i < chunks.length; i += 1) {
    const content = chunks[i];

    console.log(`Uploading chunk ${i + 1}/${chunks.length}`);

    const embedding = await getEmbedding(content);

    await uploadChunk({
      content,
      sourceName: pdfName,
      chunkIndex: i,
      embedding,
    });
  }

  console.log("Done. Knowledge uploaded to Supabase.");
}

main().catch((error) => {
  console.error("Upload failed:", error.message);
  process.exit(1);
});
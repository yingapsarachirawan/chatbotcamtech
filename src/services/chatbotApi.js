import { getSessionId } from "../utils/session";

const API_BASE_URL =
  "https://xrloyjpmkcnumyglobtc.supabase.co/functions/v1/chat";

function mapRecentMessages(messages = []) {
  return messages
    .filter((message) => message?.text && message.text !== "Thinking...")
    .slice(-8)
    .map((message) => ({
      role: message.sender === "user" ? "user" : "assistant",
      content: message.text,
    }));
}

export async function askChatbot(question, messages = []) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      sessionId: getSessionId(),
      history: mapRecentMessages(messages),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get chatbot answer");
  }

  return {
    answer:
      data.answer ||
      "Sorry, I could not find a clear answer. Please contact admissions for more support.",
    suggestedQuestions: data.suggestedQuestions || [],
  };
}

export async function getChatbotStatus() {
  const response = await fetch(API_BASE_URL, {
    method: "GET",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get chatbot status");
  }

  return {
    apiRunning: true,
    aiProvider: "Gemini via Supabase",
    ready: true,
    semanticSearchReady: true,
    mode: data.message || "Supabase Edge Function",
  };
}
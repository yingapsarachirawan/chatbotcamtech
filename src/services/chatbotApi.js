const API_BASE_URL =
  "https://xrloyjpmkcnumyglobtc.supabase.co/functions/v1/chat";

export async function askChatbot(question) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get chatbot answer");
  }

  return data;
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
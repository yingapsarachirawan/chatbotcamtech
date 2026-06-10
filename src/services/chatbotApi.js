const API_BASE_URL = "https://camtech-chatbot-api.onrender.com";

export async function askChatbot(question) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
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
  const response = await fetch(`${API_BASE_URL}/api/status`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get chatbot status");
  }

  return data;
}
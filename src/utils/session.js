const SESSION_ID_KEY = "camtech_chatbot_session_id";

export function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

export function resetSessionId() {
  localStorage.removeItem(SESSION_ID_KEY);
}
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
  loadOrCreateChatSession,
  saveChatMessage,
  startNewChatSession,
} from "../services/chatHistoryApi";

function mapDatabaseMessage(item) {
  return {
    id: item.id,
    sender: item.sender === "bot" ? "bot" : "user",
    text: item.message,
    suggestedQuestions: item.suggested_questions || [],
    createdAt: item.created_at,
  };
}

export function useChatbotHistory() {
  const [chatSessionId, setChatSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  async function loadHistory() {
    try {
      setIsLoadingHistory(true);
      setHistoryError("");

      const { session, messages: savedMessages } =
        await loadOrCreateChatSession();

      setChatSessionId(session.id);
      setMessages(savedMessages.map(mapDatabaseMessage));
    } catch (error) {
      console.error("Unable to load chatbot history:", error);
      setHistoryError(error.message || "Unable to load chat history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function startNewChat() {
    try {
      setHistoryError("");

      const { session } = await startNewChatSession();

      setChatSessionId(session.id);
      setMessages([]);
    } catch (error) {
      console.error("Unable to start new chat:", error);
      setHistoryError(error.message || "Unable to start new chat.");
    }
  }

  async function addUserMessage(text) {
    const cleanText = text.trim();

    if (!cleanText || !chatSessionId) return null;

    const tempMessage = {
      id: `temp-user-${Date.now()}`,
      sender: "user",
      text: cleanText,
      suggestedQuestions: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, tempMessage]);

    try {
      const savedMessage = await saveChatMessage({
        sessionId: chatSessionId,
        sender: "user",
        message: cleanText,
      });

      setMessages((current) =>
        current.map((item) =>
          item.id === tempMessage.id ? mapDatabaseMessage(savedMessage) : item
        )
      );

      return savedMessage;
    } catch (error) {
      console.error("Unable to save user message:", error);
      setHistoryError(error.message || "Unable to save message.");
      return null;
    }
  }

  async function addBotMessage(text, suggestedQuestions = []) {
    const cleanText = text.trim();

    if (!cleanText || !chatSessionId) return null;

    const tempMessage = {
      id: `temp-bot-${Date.now()}`,
      sender: "bot",
      text: cleanText,
      suggestedQuestions,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, tempMessage]);

    try {
      const savedMessage = await saveChatMessage({
        sessionId: chatSessionId,
        sender: "bot",
        message: cleanText,
        suggestedQuestions,
      });

      setMessages((current) =>
        current.map((item) =>
          item.id === tempMessage.id ? mapDatabaseMessage(savedMessage) : item
        )
      );

      return savedMessage;
    } catch (error) {
      console.error("Unable to save bot message:", error);
      setHistoryError(error.message || "Unable to save bot reply.");
      return null;
    }
  }

  return {
    chatSessionId,
    messages,
    setMessages,
    isLoadingHistory,
    historyError,
    loadHistory,
    startNewChat,
    addUserMessage,
    addBotMessage,
  };
}
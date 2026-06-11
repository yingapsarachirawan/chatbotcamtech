import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import EmptyState from "./components/EmptyState";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import EnquiryForm from "./components/EnquiryForm";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { askChatbot, getChatbotStatus } from "./services/chatbotApi";
import {
  getStudentEnquiry,
  sendStudentMessage,
} from "./services/enquiryApi";
import { supabase } from "./lib/supabaseClient";

const AI_CHAT_HISTORY_KEY = "camtech_ai_chat_history";

function getCurrentPage() {
  return window.location.pathname === "/admin" ? "admin" : "chat";
}

function loadAiChatHistory() {
  try {
    const saved = localStorage.getItem(AI_CHAT_HISTORY_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        item.id &&
        item.title &&
        Array.isArray(item.messages)
    );
  } catch {
    return [];
  }
}

function makeChatTitle(text) {
  const cleanText = String(text || "").trim();

  if (!cleanText) return "New AI Chat";

  return cleanText.length > 42
    ? `${cleanText.slice(0, 42)}...`
    : cleanText;
}

function mapSupportMessages(items = []) {
  return items.map((item) => ({
    id: `support-${item.id}`,
    sender: item.sender === "student" ? "user" : "admin",
    text: item.message,
    createdAt: item.created_at,
  }));
}

export default function App() {
  const [initialAiState] = useState(() => {
    const sessions = loadAiChatHistory();
    const latestSession = sessions[0];

    return {
      sessions,
      activeId: latestSession?.id || null,
      messages: latestSession?.messages || [],
    };
  });

  const [page, setPage] = useState(getCurrentPage);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(initialAiState.messages);
  const [aiChatSessions, setAiChatSessions] = useState(
    initialAiState.sessions
  );
  const [activeAiChatId, setActiveAiChatId] = useState(
    initialAiState.activeId
  );

  const [supportEnquiry, setSupportEnquiry] = useState(null);
  const [isSupportMode, setIsSupportMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const [systemStatus, setSystemStatus] = useState({
    apiRunning: false,
    aiProvider: "Checking...",
    ready: false,
    semanticSearchReady: false,
  });

  useEffect(() => {
    localStorage.setItem(
      AI_CHAT_HISTORY_KEY,
      JSON.stringify(aiChatSessions)
    );
  }, [aiChatSessions]);

  useEffect(() => {
    function handleBrowserNavigation() {
      setPage(getCurrentPage());
    }

    window.addEventListener("popstate", handleBrowserNavigation);

    return () => {
      window.removeEventListener("popstate", handleBrowserNavigation);
    };
  }, []);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsAdminLoggedIn(!!session);
    }

    checkSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdminLoggedIn(!!session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function loadStatus() {
      try {
        const status = await getChatbotStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error(error);
        setSystemStatus({
          apiRunning: false,
          aiProvider: "Backend offline",
          ready: false,
          semanticSearchReady: false,
        });
      }
    }

    loadStatus();
  }, []);

  useEffect(() => {
    async function loadExistingSupport() {
      try {
        const data = await getStudentEnquiry();

        if (data.enquiry && data.enquiry.status !== "Closed") {
          setSupportEnquiry(data.enquiry);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadExistingSupport();
  }, []);

  useEffect(() => {
    if (!isSupportMode || !supportEnquiry?.id) return;

    const timer = setInterval(() => {
      loadSupportConversation(false);
    }, 8000);

    return () => clearInterval(timer);
  }, [isSupportMode, supportEnquiry?.id]);

  function goToChat() {
    window.history.pushState({}, "", "/");
    setPage("chat");
  }

  function goToAdmin() {
    window.history.pushState({}, "", "/admin");
    setPage("admin");
  }

  function openEnquiryForm() {
    setShowEnquiryForm(true);
  }

  function getAiMessagesById(chatId) {
    if (!chatId) return [];

    return (
      aiChatSessions.find((session) => session.id === chatId)?.messages || []
    );
  }

  function saveAiChatSession(chatId, finalMessages, firstUserText) {
    const now = new Date().toISOString();

    setAiChatSessions((current) => {
      const existing = current.find((session) => session.id === chatId);

      const updatedSession = {
        id: chatId,
        title: existing?.title || makeChatTitle(firstUserText),
        messages: finalMessages,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };

      return [
        updatedSession,
        ...current.filter((session) => session.id !== chatId),
      ].slice(0, 20);
    });
  }

  function handleSelectAiChat(chatId) {
    const selected = aiChatSessions.find((session) => session.id === chatId);

    if (!selected) return;

    setIsSupportMode(false);
    setActiveAiChatId(selected.id);
    setMessages(selected.messages || []);
    setInputValue("");
  }

  function handleDeleteAiChat(chatId) {
    setAiChatSessions((current) => {
      const remaining = current.filter((session) => session.id !== chatId);

      if (activeAiChatId === chatId && !isSupportMode) {
        const nextSession = remaining[0];

        setActiveAiChatId(nextSession?.id || null);
        setMessages(nextSession?.messages || []);
      }

      return remaining;
    });
  }

  async function loadSupportConversation(showLoading = true) {
    if (showLoading) setIsLoading(true);

    try {
      const data = await getStudentEnquiry();

      if (data.enquiry) {
        setSupportEnquiry(data.enquiry);
        setIsSupportMode(true);
        setMessages(mapSupportMessages(data.messages));
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }

  async function sendAiMessage(text) {
    const cleanText = String(text || "").trim();

    if (!cleanText) return;

    const chatId = activeAiChatId || crypto.randomUUID();
    const baseMessages = isSupportMode
      ? getAiMessagesById(activeAiChatId)
      : messages;

    const userMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: cleanText,
      createdAt: new Date().toISOString(),
    };

    const loadingMessage = {
      id: crypto.randomUUID(),
      sender: "bot",
      text: "Thinking...",
      createdAt: new Date().toISOString(),
    };

    setIsSupportMode(false);
    setActiveAiChatId(chatId);
    setMessages([...baseMessages, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const data = await askChatbot(cleanText, [...baseMessages, userMessage]);

      const botMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data.answer,
        suggestedQuestions: data.suggestedQuestions || [],
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...baseMessages, userMessage, botMessage];

      setMessages(finalMessages);
      saveAiChatSession(chatId, finalMessages, cleanText);
    } catch (error) {
      console.error(error);

      const errorMessage = {
        id: crypto.randomUUID(),
        sender: "bot",
        text:
          error.message ||
          "Sorry, something went wrong. Please try again later.",
        suggestedQuestions: [],
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...baseMessages, userMessage, errorMessage];

      setMessages(finalMessages);
      saveAiChatSession(chatId, finalMessages, cleanText);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendSupportMessage(text) {
    if (!supportEnquiry?.id) {
      openEnquiryForm();
      return;
    }

    const temporaryMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, temporaryMessage]);
    setIsLoading(true);

    try {
      await sendStudentMessage(supportEnquiry.id, text);
      await loadSupportConversation(false);
    } catch (error) {
      console.error(error);

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: error.message || "Could not send message to admissions.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSend(event) {
    event.preventDefault();

    const text = inputValue.trim();

    if (!text || isLoading) return;

    setInputValue("");

    if (isSupportMode) {
      sendSupportMessage(text);
    } else {
      sendAiMessage(text);
    }
  }

  function handleQuickQuestion(question) {
    if (isLoading) return;

    sendAiMessage(question);
  }

  function handleNewChat() {
    setIsSupportMode(false);
    setActiveAiChatId(null);
    setMessages([]);
    setInputValue("");
  }

  async function handleSupportClick() {
    if (supportEnquiry?.id) {
      await loadSupportConversation(true);
    } else {
      openEnquiryForm();
    }
  }

  async function handleEnquirySubmitted() {
    await loadSupportConversation(true);
    setShowEnquiryForm(false);
  }

  if (page === "admin") {
    if (!isAdminLoggedIn) {
      return (
        <AdminLogin
          onLoginSuccess={goToAdmin}
          onBackToChat={goToChat}
        />
      );
    }

    return (
      <AdminDashboard
        onLogout={goToChat}
        onBackToChat={goToChat}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        onNewChat={handleNewChat}
        onQuickQuestion={handleQuickQuestion}
        onSupportClick={handleSupportClick}
        systemStatus={systemStatus}
        hasSupportThread={!!supportEnquiry}
        isSupportMode={isSupportMode}
        aiChatSessions={aiChatSessions}
        activeAiChatId={activeAiChatId}
        onSelectAiChat={handleSelectAiChat}
        onDeleteAiChat={handleDeleteAiChat}
      />

      <main className="chat-layout">
        <ChatHeader
          mode={isSupportMode ? "support" : "ai"}
          onOpenEnquiry={handleSupportClick}
          onBackToAI={handleNewChat}
        />

        <section className="chat-body">
          {messages.length === 0 ? (
            <EmptyState
              onQuickQuestion={handleQuickQuestion}
              onOpenEnquiry={handleSupportClick}
            />
          ) : (
            <ChatMessages
              messages={messages}
              onQuickQuestion={handleQuickQuestion}
            />
          )}

          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            disabled={isLoading}
            isSupportMode={isSupportMode}
            onQuickQuestion={handleQuickQuestion}
            onOpenEnquiry={handleSupportClick}
          />
        </section>
      </main>

      {showEnquiryForm && (
        <EnquiryForm
          onClose={() => setShowEnquiryForm(false)}
          onSubmitted={handleEnquirySubmitted}
        />
      )}
    </div>
  );
}
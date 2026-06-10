import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import EmptyState from "./components/EmptyState";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import { askChatbot, getChatbotStatus } from "./services/chatbotApi";

export default function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    apiRunning: false,
    aiProvider: "Checking...",
    ready: false,
    semanticSearchReady: false,
    faqCount: 0,
  });

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
          faqCount: 0,
        });
      }
    }

    loadStatus();
  }, []);

  async function addMessage(text) {
    const userMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
    };

    const loadingMessage = {
      id: crypto.randomUUID(),
      sender: "bot",
      text: "Thinking...",
    };

    setMessages((current) => [...current, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const data = await askChatbot(text);

      setMessages((current) =>
        current.map((message) =>
          message.id === loadingMessage.id
            ? {
                ...message,
                text: data.answer,
                suggestedQuestions: data.suggestedQuestions || [],
              }
            : message
        )
      );
    } catch (error) {
      console.error(error);

      setMessages((current) =>
        current.map((message) =>
          message.id === loadingMessage.id
            ? {
                ...message,
                text:
                  error.message ||
                  "Sorry, something went wrong. Please try again later.",
                suggestedQuestions: [],
              }
            : message
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSend(event) {
    event.preventDefault();

    const text = inputValue.trim();

    if (!text || isLoading) return;

    addMessage(text);
    setInputValue("");
  }

  function handleQuickQuestion(question) {
    if (isLoading) return;

    addMessage(question);
  }

  function handleNewChat() {
    setMessages([]);
    setInputValue("");
  }

  return (
    <div className="app-shell">
      <Sidebar onNewChat={handleNewChat} systemStatus={systemStatus} />

      <main className="chat-layout">
        <ChatHeader />

        <section className="chat-body">
          {messages.length === 0 ? (
            <EmptyState onQuickQuestion={handleQuickQuestion} />
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
            onQuickQuestion={handleQuickQuestion}
          />
        </section>
      </main>
    </div>
  );
}
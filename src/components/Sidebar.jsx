import { useState } from "react";
import {
  GraduationCap,
  Wallet,
  BadgePercent,
  Languages,
  Headphones,
  Trash2,
  Home,
  Clock3,
  X,
} from "lucide-react";
import logo from "../assets/logo.jpg";

const quickTopics = [
  {
    label: "Admission",
    question: "What are the admission requirements?",
    icon: GraduationCap,
  },
  {
    label: "Tuition Fees",
    question: "I want to know about tuition fee",
    icon: Wallet,
  },
  {
    label: "Scholarships",
    question: "Scholarship details",
    icon: BadgePercent,
  },
  {
    label: "English Requirement",
    question: "What are the English requirements?",
    icon: Languages,
  },
];

function formatHistoryTime(value) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Sidebar({
  onNewChat,
  onQuickQuestion,
  onSupportClick,
  systemStatus,
  hasSupportThread,
  isSupportMode,
  aiChatSessions = [],
  activeAiChatId = null,
  onSelectAiChat,
  onDeleteAiChat,
}) {
  const [showHistory, setShowHistory] = useState(false);

  function handleNewChat() {
    setShowHistory(false);
    onNewChat?.();
  }

  function handleSupportClick() {
    setShowHistory(false);
    onSupportClick?.();
  }

  function handleQuickTopic(question) {
    setShowHistory(false);
    onQuickQuestion?.(question);
  }

  return (
    <>
      <aside className="sidebar minimal-sidebar">
        <div className="minimal-sidebar-top">
          <button
            type="button"
            className="minimal-logo-button"
            onClick={handleNewChat}
            title="CamTech Assistant"
          >
            <img src={logo} alt="CamTech logo" />
          </button>

          <nav className="minimal-nav">
            <button
              type="button"
              onClick={handleNewChat}
              className={`minimal-nav-button ${!isSupportMode ? "active" : ""}`}
              title="Home"
            >
              <Home size={21} />
            </button>

            <button
              type="button"
              onClick={handleSupportClick}
              className={`minimal-nav-button ${isSupportMode ? "active" : ""}`}
              title={hasSupportThread ? "Admissions Chat" : "Contact Admissions"}
            >
              <Headphones size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowHistory((current) => !current)}
              className={`minimal-nav-button ${showHistory ? "active" : ""}`}
              title="Chat History"
            >
              <Clock3 size={20} />
            </button>
          </nav>

          <div className="minimal-topic-rail">
            {quickTopics.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className="minimal-topic-button"
                  onClick={() => handleQuickTopic(item.question)}
                  title={item.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="minimal-sidebar-bottom">
          <div
            className={`minimal-user-dot ${
              systemStatus?.ready ? "online" : "offline"
            }`}
            title={systemStatus?.ready ? "Assistant online" : "Checking system"}
          >
            <img src={logo} alt="Assistant status" />
            <span />
          </div>
        </div>
      </aside>

      {showHistory && (
        <aside className="history-drawer">
          <div className="history-drawer-header">
            <div>
              <h2>Chat History</h2>
              <p>{aiChatSessions.length} saved conversation</p>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory(false)}
              aria-label="Close history"
            >
              <X size={18} />
            </button>
          </div>

          {aiChatSessions.length > 0 ? (
            <div className="history-drawer-list">
              {aiChatSessions.map((chat) => (
                <div
                  key={chat.id}
                  className={`history-drawer-item ${
                    activeAiChatId === chat.id && !isSupportMode ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="history-drawer-main"
                    onClick={() => {
                      setShowHistory(false);
                      onSelectAiChat?.(chat.id);
                    }}
                  >
                    <strong>{chat.title || "New AI Chat"}</strong>
                    <span>{formatHistoryTime(chat.updatedAt)}</span>
                  </button>

                  <button
                    type="button"
                    className="history-drawer-delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteAiChat?.(chat.id);
                    }}
                    aria-label="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-drawer-empty">No AI chat history yet.</div>
          )}
        </aside>
      )}
    </>
  );
}
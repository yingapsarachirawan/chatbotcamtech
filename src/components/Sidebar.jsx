import {
  MessageCirclePlus,
  GraduationCap,
  Wallet,
  BadgePercent,
  Languages,
  Headphones,
  Trash2,
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
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <img src={logo} alt="CamTech logo" />
          </div>

          <div>
            <h1>CamTech</h1>
            <p>Smart Assistant</p>
          </div>
        </div>
      </div>

      <div className="sidebar-content">
        <button
          type="button"
          onClick={onNewChat}
          className={`new-chat-button ${!isSupportMode ? "active" : ""}`}
        >
          <MessageCirclePlus size={17} />
          <span>New AI Chat</span>
        </button>

        <button
          type="button"
          onClick={onSupportClick}
          className={`support-mode-button ${isSupportMode ? "active" : ""}`}
        >
          <Headphones size={17} />
          <span>
            {hasSupportThread ? "Admissions Chat" : "Contact Admissions"}
          </span>
        </button>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Chat History</p>

          {aiChatSessions.length > 0 ? (
            <div className="chat-history-list">
              {aiChatSessions.map((chat) => (
                <div
                  key={chat.id}
                  className={`chat-history-item ${
                    activeAiChatId === chat.id && !isSupportMode ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="chat-history-main"
                    onClick={() => onSelectAiChat?.(chat.id)}
                  >
                    <span>{chat.title || "New AI Chat"}</span>
                    <em>{formatHistoryTime(chat.updatedAt)}</em>
                  </button>

                  <button
                    type="button"
                    className="chat-history-delete"
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
            <div className="chat-history-empty">
              No AI chat history yet.
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <p className="sidebar-section-label">Quick Topics</p>

          <div className="sidebar-topic-list">
            {quickTopics.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className="sidebar-topic-button"
                  onClick={() => onQuickQuestion(item.question)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="system-status">
          <span
            className={`status-dot ${
              systemStatus?.ready ? "status-dot-online" : "status-dot-offline"
            }`}
          />
          <span>
            {systemStatus?.ready ? "Assistant online" : "Checking system"}
          </span>
        </div>
      </div>
    </aside>
  );
}
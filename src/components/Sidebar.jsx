import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  Menu,
  MessageCircle,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import logo from "../assets/logo.jpg";

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
  onSupportClick,
  hasSupportThread,
  isSupportMode,
  aiChatSessions = [],
  activeAiChatId = null,
  onSelectAiChat,
  onDeleteAiChat,
}) {
  const [historyOpen, setHistoryOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  function handleNewChat() {
    closeMobileSidebar();
    onNewChat?.();
  }

  function handleSupportClick() {
    closeMobileSidebar();
    onSupportClick?.();
  }

  function handleSelectChat(chatId) {
    closeMobileSidebar();
    onSelectAiChat?.(chatId);
  }

  return (
    <>
      <button
        type="button"
        className="camtech-mobile-sidebar-button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className="camtech-sidebar-overlay"
          onClick={closeMobileSidebar}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={`sidebar camtech-gpt-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="camtech-gpt-top">
          <div className="camtech-gpt-brand">
            <img src={logo} alt="CamTech logo" />

            <div>
              <strong>CamTech</strong>
              <span>Assistant</span>
            </div>
          </div>

          <button
            type="button"
            className="camtech-gpt-mobile-close"
            onClick={closeMobileSidebar}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="camtech-gpt-menu">
          <button
            type="button"
            className={`camtech-gpt-menu-item ${
              !isSupportMode ? "active" : ""
            }`}
            onClick={handleNewChat}
          >
            <SquarePen size={19} />
            <span>New chat</span>
          </button>

          <button
            type="button"
            className={`camtech-gpt-menu-item ${
              isSupportMode ? "active" : ""
            }`}
            onClick={handleSupportClick}
          >
            <Headphones size={19} />
            <span>
              {hasSupportThread ? "Admissions Chat" : "Contact Admissions"}
            </span>
          </button>

          <button
            type="button"
            className="camtech-gpt-menu-item"
            onClick={() => setHistoryOpen((current) => !current)}
          >
            <MessageCircle size={19} />
            <span>Chat History</span>

            {historyOpen ? (
              <ChevronDown className="camtech-gpt-chevron" size={17} />
            ) : (
              <ChevronRight className="camtech-gpt-chevron" size={17} />
            )}
          </button>
        </div>

        {historyOpen && (
          <div className="camtech-gpt-history">
            <p className="camtech-gpt-history-title">Chats</p>

            {aiChatSessions.length > 0 ? (
              <div className="camtech-gpt-chat-list">
                {aiChatSessions.map((chat) => (
                  <div
                    key={chat.id}
                    className={`camtech-gpt-chat-item ${
                      activeAiChatId === chat.id && !isSupportMode
                        ? "active"
                        : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="camtech-gpt-chat-main"
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <span>{chat.title || "New AI Chat"}</span>
                      <small>{formatHistoryTime(chat.updatedAt)}</small>
                    </button>

                    <button
                      type="button"
                      className="camtech-gpt-chat-delete"
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
              <div className="camtech-gpt-empty">No chat history yet.</div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
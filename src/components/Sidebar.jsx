import {
  MessageCirclePlus,
  GraduationCap,
  Wallet,
  BadgePercent,
  Languages,
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

export default function Sidebar({ onNewChat, onQuickQuestion, systemStatus }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <img src={logo} alt="CamTech logo" className="brand-logo-image" />

          <div>
            <h1>CamTech</h1>
            <p>School Assistant</p>
          </div>
        </div>
      </div>

      <div className="sidebar-content">
        <button type="button" onClick={onNewChat} className="new-chat-button">
          <MessageCirclePlus size={17} />
          <span>New Chat</span>
        </button>

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
                  onClick={() => onQuickQuestion?.(item.question)}
                >
                  <Icon size={15} />
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
            {systemStatus?.ready ? "Assistant online" : "Checking system..."}
          </span>
        </div>
      </div>
    </aside>
  );
}
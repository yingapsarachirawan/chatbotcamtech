import {
  Bot,
  Clock,
  Menu,
  MessageCirclePlus,
  School,
  GraduationCap,
  Wallet,
  BadgePercent,
  Phone,
} from "lucide-react";

const quickTopics = [
  {
    label: "Admission",
    icon: GraduationCap,
  },
  {
    label: "Tuition Fee",
    icon: Wallet,
  },
  {
    label: "Scholarship",
    icon: BadgePercent,
  },
  {
    label: "Contact Office",
    icon: Phone,
  },
];

const recentChats = [
  "Admission requirements",
  "Tuition fee information",
  "Scholarship details",
];

export default function Sidebar({ onNewChat }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <School size={22} />
          </div>

          <div>
            <h1>CamTech</h1>
            <p>School Chatbot</p>
          </div>
        </div>

        <button className="icon-button">
          <Menu size={19} />
        </button>
      </div>

      <div className="sidebar-content">
        <button onClick={onNewChat} className="new-chat-button">
          <MessageCirclePlus size={18} />
          New Chat
        </button>

        <div className="recent-section">
          <h2>Quick Topics</h2>

          <div className="recent-list">
            {quickTopics.map((item) => {
              const Icon = item.icon;

              return (
                <button key={item.label}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="recent-section">
          <h2>Recent Chats</h2>

          <div className="recent-list">
            {recentChats.map((item) => (
              <button key={item}>
                <Clock size={16} />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="assistant-card">
          <div className="assistant-card-title">
            <div>
              <Bot size={17} />
            </div>

            <strong>AI Assistant</strong>
          </div>

          <p>Ready to help with CamTech school information.</p>
        </div>
      </div>
    </aside>
  );
}
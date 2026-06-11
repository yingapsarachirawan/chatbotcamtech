export default function ChatHeader({ onOpenEnquiry }) {
  return (
    <header className="chat-header">
      <div className="chat-header-content">
        <p className="chat-header-kicker">CamTech Assistant</p>
        <h1>CamTech Chatbot</h1>
        <p className="chat-header-subtitle">
          Ask about admissions, programs, fees, scholarships, and student
          services.
        </p>
      </div>

      <button
        type="button"
        className="header-contact-button"
        onClick={onOpenEnquiry}
      >
        Contact Admissions
      </button>
    </header>
  );
}
export default function ChatHeader({ mode, onOpenEnquiry, onBackToAI }) {
  const isSupportMode = mode === "support";

  return (
    <header className="chat-header">
      <div>
        <p>{isSupportMode ? "Admissions support" : "CamTech assistant"}</p>
        <h1>{isSupportMode ? "Admissions Chat" : "CamTech Chatbot"}</h1>
        <span>
          {isSupportMode
            ? "You are now messaging CamTech admissions support."
            : "Ask about admissions, programs, fees, scholarships, and student services."}
        </span>
      </div>

      <div className="chat-header-actions">
        {isSupportMode && (
          <button type="button" className="secondary-pill" onClick={onBackToAI}>
            Back to AI
          </button>
        )}

        <button type="button" className="primary-pill" onClick={onOpenEnquiry}>
          {isSupportMode ? "Refresh Support" : "Contact Admissions"}
        </button>
      </div>
    </header>
  );
}
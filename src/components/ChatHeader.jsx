import { Headphones } from "lucide-react";

export default function ChatHeader({ mode, onOpenEnquiry, onBackToAI }) {
  const isSupportMode = mode === "support";

  return (
    <header className="chat-header clean-top-header">
      {isSupportMode ? (
        <button type="button" className="clean-back-button" onClick={onBackToAI}>
          Back to AI
        </button>
      ) : (
        <div />
      )}

      <button type="button" className="clean-admission-button" onClick={onOpenEnquiry}>
        <Headphones size={18} />
        <span>{isSupportMode ? "Refresh Support" : "Contact Admissions"}</span>
      </button>
    </header>
  );
}
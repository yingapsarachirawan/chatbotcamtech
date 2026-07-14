import { Headphones } from "lucide-react";

export default function ChatHeader({ mode, onOpenEnquiry }) {
  const isSupportMode = mode === "support";

  return (
    <div className="camtech-floating-contact">
      <button
        type="button"
        className="camtech-floating-contact-button"
        onClick={onOpenEnquiry}
      >
        <Headphones size={18} />
        <span>{isSupportMode ? "Refresh Support" : "Contact Admissions"}</span>
      </button>
    </div>
  );
}
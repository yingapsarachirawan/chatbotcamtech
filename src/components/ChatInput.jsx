import {
  // eslint-disable-next-line no-unused-vars
  CalendarDays,
  GraduationCap,
  Languages,
  Send,
  WalletCards,
  Paperclip,
  BadgePercent,
  Mic,
} from "lucide-react";
import { useEffect, useRef } from "react";

const faqPrompts = [
  {
    label: "Admission",
    icon: GraduationCap,
    question: "What are the admission requirements?",
  },
  {
    label: "Tuition Fees",
    icon: WalletCards,
    question: "I want to know about tuition fee",
  },
  {
    label: "Scholarships",
    icon: BadgePercent,
    question: "Scholarship details",
  },
  {
    label: "English Requirement",
    icon: Languages,
    question: "What are the English requirements?",
  },
];

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  isSupportMode,
  onQuickQuestion,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (!disabled && value.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  }

  return (
    <div className="chat-input-area minimal-chat-input-area">
      <form className="chat-input-form minimal-chat-input-form" onSubmit={onSend}>
        <div className="chat-input-shell minimal-input-shell">
          <button type="button" className="minimal-input-icon" disabled>
            <Paperclip size={21} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isSupportMode
                ? "Write a message to admissions..."
                : "Message CamTech Assistant..."
            }
            rows={1}
            disabled={disabled}
          />

          <button type="button" className="minimal-input-icon" disabled>
            <Mic size={21} />
          </button>

          <button
            type="submit"
            className="send-button minimal-send-button"
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            <Send size={21} />
          </button>
        </div>
      </form>

      {!isSupportMode && (
        <div className="faq-button-row minimal-faq-row">
          {faqPrompts.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className="faq-chip minimal-faq-chip"
                onClick={() => onQuickQuestion(item.question)}
                disabled={disabled}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
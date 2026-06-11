import {
  CalendarDays,
  GraduationCap,
  Languages,
  Send,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef } from "react";

const faqPrompts = [
  {
    label: "Admission",
    icon: GraduationCap,
    question: "What are the admission requirements?",
  },
  {
    label: "Tuition Fee",
    icon: WalletCards,
    question: "I want to know about tuition fee",
  },
  {
    label: "Schedule",
    icon: CalendarDays,
    question: "What is the study schedule?",
  },
  {
    label: "English",
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
    <div className="chat-input-area">
      {!isSupportMode && (
        <div className="faq-button-row">
          {faqPrompts.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                className="faq-chip"
                onClick={() => onQuickQuestion(item.question)}
                disabled={disabled}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <form className="chat-input-form" onSubmit={onSend}>
        <div className="chat-input-shell multiline no-left-action">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isSupportMode
                ? "Write a message to admissions... Shift + Enter for new line"
                : "Ask about CamTech admissions, programs, or fees... Shift + Enter for new line"
            }
            rows={1}
            disabled={disabled}
          />

          <button
            type="submit"
            className="send-button"
            disabled={disabled || !value.trim()}
            aria-label="Send message"
          >
            <Send size={19} />
          </button>
        </div>
      </form>
    </div>
  );
}
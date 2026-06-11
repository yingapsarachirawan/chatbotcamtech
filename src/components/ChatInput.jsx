import {
  Plus,
  SendHorizontal,
  GraduationCap,
  Wallet,
  BadgePercent,
  CalendarDays,
  Languages,
} from "lucide-react";

const faqButtons = [
  {
    label: "Admission",
    question: "What are the admission requirements?",
    icon: GraduationCap,
  },
  {
    label: "Tuition Fee",
    question: "I want to know about tuition fee",
    icon: Wallet,
  },
  {
    label: "Scholarship",
    question: "Scholarship details",
    icon: BadgePercent,
  },
  {
    label: "Schedule",
    question: "Class schedule",
    icon: CalendarDays,
  },
  {
    label: "English",
    question: "What are the English requirements?",
    icon: Languages,
  },
];

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  onQuickQuestion,
  onOpenEnquiry,
}) {
  return (
    <div className="chat-input-area">
      <div className="faq-button-row">
        {faqButtons.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              className="faq-chip"
              disabled={disabled}
              onClick={() => onQuickQuestion(item.question)}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <form className="chat-input-form" onSubmit={onSend}>
        <div className="chat-input-shell">
          <button
            type="button"
            className="input-action-button"
            title="Contact admissions"
            onClick={onOpenEnquiry}
          >
            <Plus size={19} />
          </button>

          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ask about CamTech admissions, programs, or fees..."
            disabled={disabled}
          />

          <button
            type="submit"
            className="send-button"
            disabled={disabled || !value.trim()}
          >
            <SendHorizontal size={19} />
          </button>
        </div>
      </form>
    </div>
  );
}
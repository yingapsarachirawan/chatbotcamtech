import {
  Plus,
  SendHorizontal,
  GraduationCap,
  Wallet,
  BadgePercent,
  CalendarDays,
  Phone,
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
    label: "Class Schedule",
    question: "Class schedule",
    icon: CalendarDays,
  },
  {
    label: "Contact",
    question: "Contact office",
    icon: Phone,
  },
  {
    label: "English Requirement",
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
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      <form className="chat-input-form" onSubmit={onSend}>
        <div className="chat-input-shell">
          <button type="button" className="input-action-button">
            <Plus size={20} />
          </button>

          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ask something about CamTech..."
            disabled={disabled}
          />

          <button
            type="submit"
            className="send-button"
            disabled={disabled || !value.trim()}
          >
            <SendHorizontal size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
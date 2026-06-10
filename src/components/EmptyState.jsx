import {
  GraduationCap,
  Wallet,
  BadgePercent,
  CalendarDays,
  Phone,
  CircleHelp,
  School,
} from "lucide-react";

const quickQuestions = [
  {
    title: "Admission Requirements",
    description: "Documents and application process",
    icon: GraduationCap,
    question: "Admission Requirements",
  },
  {
    title: "Tuition Fee",
    description: "School fee and payment information",
    icon: Wallet,
    question: "I want to know about tuition fee",
  },
  {
    title: "Scholarship",
    description: "Eligibility and deadlines",
    icon: BadgePercent,
    question: "Scholarship details",
  },
  {
    title: "Class Schedule",
    description: "Study time and timetable information",
    icon: CalendarDays,
    question: "Class schedule",
  },
  {
    title: "Contact Office",
    description: "Phone, email, and office support",
    icon: Phone,
    question: "Contact office",
  },
  {
    title: "General FAQ",
    description: "Common school questions",
    icon: CircleHelp,
    question: "General FAQ",
  },
];

export default function EmptyState({ onQuickQuestion }) {
  return (
    <div className="empty-state">
      <div className="hero-card">
        <div className="hero-icon">
          <School size={26} />
        </div>

        <h1>How can CamTech Chatbot help you?</h1>

        <p>
          Ask questions about admission, tuition fees, scholarships, class
          schedules, school services, or information from your CamTech Q&amp;A
          document.
        </p>

        <div className="quick-card-grid">
          {quickQuestions.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                type="button"
                className="quick-card"
                onClick={() => onQuickQuestion(item.question)}
              >
                <div className="quick-card-icon">
                  <Icon size={18} />
                </div>

                <div>
                  <h3>{item.title}</h3>
                  <span>{item.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
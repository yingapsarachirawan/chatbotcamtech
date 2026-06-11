import {
  GraduationCap,
  Wallet,
  BadgePercent,
  Languages,
  School,
  Headphones,
} from "lucide-react";

const quickQuestions = [
  {
    title: "Admission",
    description: "Requirements and application process",
    icon: GraduationCap,
    question: "What are the admission requirements?",
  },
  {
    title: "Tuition Fees",
    description: "Fee and payment information",
    icon: Wallet,
    question: "I want to know about tuition fee",
  },
  {
    title: "Scholarships",
    description: "Available support and eligibility",
    icon: BadgePercent,
    question: "Scholarship details",
  },
  {
    title: "English Requirement",
    description: "IELTS, TOEFL, and English entry needs",
    icon: Languages,
    question: "What are the English requirements?",
  },
];

export default function EmptyState({ onQuickQuestion, onOpenEnquiry }) {
  return (
    <div className="empty-state">
      <div className="hero-card">
        <div className="hero-icon">
          <School size={23} />
        </div>

        <p className="hero-kicker">CamTech Assistant</p>

        <h1>How can I help you today?</h1>

        <p className="hero-description">
          Ask the AI assistant about CamTech information or connect with
          admissions support for personal enquiries.
        </p>

        <div className="hero-actions">
          <button type="button" className="primary-pill" onClick={onOpenEnquiry}>
            <Headphones size={16} />
            Talk to Admissions
          </button>
        </div>

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
                  <Icon size={17} />
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
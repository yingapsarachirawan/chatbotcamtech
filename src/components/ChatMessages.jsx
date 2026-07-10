import { useEffect, useRef } from "react";
import {
  BadgePercent,
  GraduationCap,
  Languages,
  Sparkles,
  WalletCards,
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import logo from "../assets/logo.jpg";

const welcomePrompts = [
  {
    label: "Admission",
    question: "What are the admission requirements?",
    icon: GraduationCap,
  },
  {
    label: "Tuition Fees",
    question: "I want to know about tuition fee",
    icon: WalletCards,
  },
  {
    label: "Scholarships",
    question: "Scholarship details",
    icon: BadgePercent,
  },
  {
    label: "English Requirement",
    question: "What are the English requirements?",
    icon: Languages,
  },
];

export default function ChatMessages({ messages = [], onQuickQuestion }) {
  const bottomRef = useRef(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  if (!hasMessages) {
    return (
      <div className="chat-messages clean-chat-messages">
        <div className="clean-welcome-state">
          <div className="clean-welcome-logo">
            <img src={logo} alt="CamTech logo" />
          </div>

          <div className="clean-welcome-copy">
            <p>
              <Sparkles size={15} />
              CamTech Smart Assistant
            </p>

            <h1>Hello, future CamTecher</h1>

            <span>
              Ask about admissions, programs, tuition fees, scholarships,
              English requirements, student services, or contact admissions
              support when you need help.
            </span>
          </div>

          <div className="clean-welcome-prompts">
            {welcomePrompts.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onQuickQuestion?.(item.question)}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-messages clean-chat-messages">
      <div className="chat-thread clean-chat-thread">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onQuickQuestion={onQuickQuestion}
          />
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
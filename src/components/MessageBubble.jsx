import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Headphones } from "lucide-react";

export default function MessageBubble({ message, onQuickQuestion }) {
  const isUser = message.sender === "user";
  const isAdmin = message.sender === "admin";
  const isThinking = message.text === "Thinking...";

  return (
    <div
      className={`chat-message ${
        isUser ? "chat-message-user" : "chat-message-bot"
      }`}
    >
      {!isUser && (
        <div className="chat-avatar">
          {isAdmin ? <Headphones size={15} /> : <Bot size={15} />}
        </div>
      )}

      <div className="chat-message-main">
        {!isUser && (
          <div className="chat-sender-name">
            {isAdmin ? "CamTech Admissions" : "CamTech Assistant"}
          </div>
        )}

        <div
          className={`chat-bubble ${
            isUser ? "chat-bubble-user" : "chat-bubble-bot"
          }`}
        >
          {isThinking ? (
            <div className="typing-dots" aria-label="CamTech is typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : isUser ? (
            <p>{message.text}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.text}
            </ReactMarkdown>
          )}
        </div>

        {!isUser && !isAdmin && !isThinking && message.suggestedQuestions?.length > 0 && (
          <div className="suggested-block">
            <p className="suggested-title">Suggested questions</p>

            <div className="follow-up-row">
              {message.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="follow-up-chip"
                  onClick={() => onQuickQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
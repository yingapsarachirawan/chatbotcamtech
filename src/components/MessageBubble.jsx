import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Headphones, UserRound } from "lucide-react";

export default function MessageBubble({ message, onQuickQuestion }) {
  const isUser = message.sender === "user";
  const isAdmin = message.sender === "admin";
  const isThinking = message.text === "Thinking...";

  return (
    <div
      className={`chat-message clean-chat-message ${
        isUser ? "chat-message-user clean-message-user" : "chat-message-bot clean-message-bot"
      }`}
    >
      {!isUser && (
        <div className={`chat-avatar clean-chat-avatar ${isAdmin ? "admin" : "bot"}`}>
          {isAdmin ? <Headphones size={16} /> : <Bot size={16} />}
        </div>
      )}

      <div className="chat-message-main clean-message-main">
        {!isUser && (
          <div className="chat-sender-name clean-sender-name">
            {isAdmin ? "CamTech Admissions" : "CamTech Assistant"}
          </div>
        )}

        {isUser && (
          <div className="clean-user-avatar">
            <UserRound size={15} />
          </div>
        )}

        <div
          className={`chat-bubble clean-chat-bubble ${
            isUser ? "chat-bubble-user clean-bubble-user" : "chat-bubble-bot clean-bubble-bot"
          }`}
        >
          {isThinking ? (
            <div className="typing-dots clean-typing-dots" aria-label="CamTech is typing">
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

        {!isUser &&
          !isAdmin &&
          !isThinking &&
          message.suggestedQuestions?.length > 0 && (
            <div className="suggested-block clean-suggested-block">
              <p className="suggested-title clean-suggested-title">
                Suggested questions
              </p>

              <div className="follow-up-row clean-follow-up-row">
                {message.suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    className="follow-up-chip clean-follow-up-chip"
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
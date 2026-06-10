import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatMessages({ messages, onQuickQuestion }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  return (
    <div className="chat-messages">
      <div className="chat-thread">
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
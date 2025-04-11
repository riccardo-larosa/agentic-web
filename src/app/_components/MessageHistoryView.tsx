import Markdown from "react-markdown";

import { type Message } from "~/core/messaging";
import { cn } from "~/core/utils";

import { LoadingAnimation } from "./LoadingAnimation";
import { WorkflowProgressView } from "./WorkflowProgressView";

export function MessageHistoryView({
  className,
  messages,
  loading,
}: {
  className?: string;
  messages: Message[];
  loading?: boolean;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) => (
        <MessageView key={message.id} message={message} />
      ))}
      {loading && <LoadingAnimation className="mt-8" />}
    </div>
  );
}

function MessageView({ message }: { message: Message }) {
  if (message.type === "text" && message.content) {
    return (
      <div className={cn("flex", message.role === "user" && "justify-end")}>
        <div
          className={cn(
            "relative mb-8 w-fit rounded-2xl px-3 py-2.5 shadow-xs md:max-w-[560px] md:px-4 md:py-3",
            "max-w-[85%] text-sm md:text-base", // Added responsive width and text size
            message.role === "user" && "rounded-ee-none bg-blue-500 text-white",
            message.role === "assistant" && "rounded-es-none bg-white",
          )}
        >
          <Markdown
            components={{
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="break-words" // Added word breaking for links
                >
                  {children}
                </a>
              ),
              p: ({ children }) => (
                <p className="break-words">
                  {children}
                </p>
              ),
            }}
          >
            {message.content}
          </Markdown>
        </div>
      </div>
    );
  } else if (message.type === "workflow") {
    return (
      <WorkflowProgressView
        className="mb-8"
        workflow={message.content.workflow}
      />
    );
  }
  return null;
}

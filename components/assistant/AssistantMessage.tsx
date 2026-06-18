"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface AssistantMessageProps {
  role: "user" | "assistant";
  content: string;
}

function renderMarkdown(text: string) {
  // Basic bold (**text**) support
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function AssistantMessage({ role, content }: AssistantMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div className={cn(
        "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn(
        "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
          : "bg-muted text-foreground rounded-tl-sm"
      )}>
        {isUser ? content : (
          <p className="whitespace-pre-wrap">{renderMarkdown(content)}</p>
        )}
      </div>
    </div>
  );
}

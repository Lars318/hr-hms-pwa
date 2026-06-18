"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface AssistantMessageProps {
  role: "user" | "assistant";
  content: string;
  usedAi?: boolean;
}

export function AssistantMessage({ role, content, usedAi }: AssistantMessageProps) {
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
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
        isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-muted text-foreground rounded-tl-sm"
      )}>
        {content}
        {!isUser && usedAi === false && (
          <p className="mt-2 text-[10px] text-muted-foreground opacity-60">
            Regelbasert svar (AI ikke aktivert)
          </p>
        )}
      </div>
    </div>
  );
}

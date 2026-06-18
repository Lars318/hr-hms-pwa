"use client";

import { useRef, useState } from "react";
import { X, Send, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { AssistantMessage } from "./AssistantMessage";
import { AssistantSources } from "./AssistantSources";
import { AssistantSuggestedLinks } from "./AssistantSuggestedLinks";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; href?: string; type: "route" | "static" | "handbook" | "document" }[];
  suggestedLinks?: { label: string; href: string; description?: string }[];
  confidence?: "high" | "medium" | "low";
}

const STARTER_QUESTIONS = [
  "Hvor melder jeg avvik?",
  "Hvordan registrerer jeg fravær?",
  "Hvor finner jeg personalhåndboken?",
  "Hvordan varsler jeg om kritikkverdige forhold?",
];

interface AssistantWidgetProps {
  onClose: () => void;
}

export function AssistantWidget({ onClose }: AssistantWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = trpc.assistant.ask.useMutation({
    onSuccess(data) {
      setError(null);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          suggestedLinks: data.suggestedLinks,
          confidence: data.confidence,
        },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
    onError() {
      setError("Noe gikk galt. Prøv igjen.");
    },
  });

  function sendQuestion(q: string) {
    if (!q.trim() || ask.isPending) return;
    const message = q.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    ask.mutate({ message });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
        <div>
          <p className="font-semibold text-sm">HMS/HR-assistent</p>
          <p className="text-xs text-muted-foreground">Veiledning basert på interne rutiner</p>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Lukk"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center py-2">
              Hva kan jeg hjelpe deg med?
            </p>
            <div className="space-y-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuestion(q)}
                  className="w-full text-left rounded-xl border bg-muted/40 px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLastAssistant = msg.role === "assistant" && msg === lastAssistantMsg;
          return (
            <div key={i}>
              <AssistantMessage role={msg.role} content={msg.content} />
              {isLastAssistant && (
                <div className="ml-9 mt-2 space-y-2">
                  {msg.suggestedLinks && msg.suggestedLinks.length > 0 && (
                    <AssistantSuggestedLinks links={msg.suggestedLinks} />
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <AssistantSources sources={msg.sources} />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {ask.isPending && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-muted-foreground">
              Ser etter svar…
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-card shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv et spørsmål…"
            disabled={ask.isPending}
            className="flex-1 h-10 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || ask.isPending}
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
              input.trim() && !ask.isPending
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center leading-snug">
          Assistenten er veiledende og basert på interne lenker/rutiner. Kontakt leder eller HR ved usikkerhet.
        </p>
      </div>
    </div>
  );
}

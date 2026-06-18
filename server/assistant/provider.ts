import { findRelevantRoutes } from "./routeMap";
import type { Role } from "@prisma/client";

export interface HandbookChunk {
  title: string;
  content: string;
}

export interface AssistantResponse {
  answer: string;
  usedAi: boolean;
  sources: HandbookChunk[];
  suggestedLinks: { label: string; href: string }[];
}

const SYSTEM_PROMPT = `Du er en intern HR/HMS-veileder for Pulsfollo. Du svarer kun på norsk.

Regler du MÅ følge:
- Svar kun basert på informasjonen du får i denne samtalen (personalhåndboken og rutinedokumenter).
- Hvis du ikke finner grunnlag i de tilgjengelige dokumentene, si tydelig: "Jeg finner ikke grunnlag for dette i tilgjengelige dokumenter."
- Gi aldri juridisk rådgivning. Si heller: "For juridisk veiledning anbefaler vi at du kontakter en advokat eller Arbeidstilsynet."
- Ikke gjett på interne regler som ikke er dokumentert.
- Svar kort og tydelig. Unngå unødvendig preamble.
- Du har IKKE tilgang til personopplysninger, kontrakter, fraværsdetaljer eller andre sensitive data om enkeltpersoner.`;

function buildPrompt(question: string, chunks: HandbookChunk[]): string {
  if (chunks.length === 0) {
    return `Spørsmål: ${question}\n\nIngen relevante dokumenter ble funnet. Si at du ikke finner grunnlag i tilgjengelige dokumenter.`;
  }

  const context = chunks
    .map((c) => `### ${c.title}\n${c.content}`)
    .join("\n\n---\n\n");

  return `Relevante utdrag fra personalhåndboken:\n\n${context}\n\n---\n\nSpørsmål: ${question}`;
}

export async function askAssistant(
  question: string,
  role: Role,
  handbookChunks: HandbookChunk[]
): Promise<AssistantResponse> {
  const suggestedLinks = findRelevantRoutes(question, role).map((r) => ({
    label: r.label,
    href: r.href,
  }));

  const apiKey = process.env.OPENAI_API_KEY;
  const enabled = process.env.AI_ASSISTANT_ENABLED === "true";

  if (!apiKey || !enabled) {
    return ruleBasedFallback(question, handbookChunks, suggestedLinks);
  }

  try {
    const userMessage = buildPrompt(question, handbookChunks);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 600,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI error:", res.status, await res.text());
      return ruleBasedFallback(question, handbookChunks, suggestedLinks);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };

    const answer = data.choices[0]?.message?.content?.trim() ?? "";

    return {
      answer: answer || "Jeg finner ikke grunnlag for dette i tilgjengelige dokumenter.",
      usedAi: true,
      sources: handbookChunks,
      suggestedLinks,
    };
  } catch (err) {
    console.error("Assistant fetch failed:", err);
    return ruleBasedFallback(question, handbookChunks, suggestedLinks);
  }
}

function ruleBasedFallback(
  question: string,
  chunks: HandbookChunk[],
  suggestedLinks: { label: string; href: string }[]
): AssistantResponse {
  if (chunks.length === 0) {
    return {
      answer:
        "Jeg finner ikke grunnlag for dette i tilgjengelige dokumenter. Kontakt HR for mer informasjon.",
      usedAi: false,
      sources: [],
      suggestedLinks,
    };
  }

  const excerpt = chunks[0].content.slice(0, 400).trim();
  const answer = `Basert på «${chunks[0].title}»:\n\n${excerpt}${chunks[0].content.length > 400 ? "…" : ""}`;

  return {
    answer,
    usedAi: false,
    sources: chunks,
    suggestedLinks,
  };
}

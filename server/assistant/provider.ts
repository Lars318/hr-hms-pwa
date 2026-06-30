import type { Role } from "@prisma/client";
import { match, type MatchResult } from "./matcher";

export type { MatchResult };

const MODEL = process.env.OPENAI_ASSISTANT_MODEL ?? "gpt-4o-mini";

function isAssistantAiEnabled(): boolean {
  return process.env.ASSISTANT_ENABLED !== "false" && !!process.env.OPENAI_API_KEY;
}

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "administrator", HR: "HR-ansvarlig", MANAGER: "leder", EMPLOYEE: "ansatt",
};

const SYSTEM_PROMPT = `Du er "Truls", en hjelpsom HR- og HMS-assistent for Pulsfollo (treningssenterkjede).
Svar kort, konkret og vennlig på norsk (bokmål). Du hjelper med fravær, ferie, overtid, HMS, avvik,
internkontroll, dokumenter, personalhåndbok og lignende.
Bruk konteksten du får hvis den er relevant, men ikke finn opp funksjoner, sider eller lenker som ikke er nevnt.
Er du usikker, anbefal å kontakte HR eller nærmeste leder. Hold svaret under ~120 ord.`;

/**
 * Genererer et AI-svar med OpenAI, grunnet i matcherens kjente svar/lenker.
 */
async function openaiAnswer(question: string, role: Role, base: MatchResult): Promise<string> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const context = [
    base.answer ? `Kjent svar fra systemet:\n${base.answer}` : "",
    base.suggestedLinks.length
      ? `Relevante sider:\n${base.suggestedLinks.map((l) => `- ${l.label} (${l.href})`).join("\n")}`
      : "",
  ].filter(Boolean).join("\n\n");

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 400,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Brukeren er ${ROLE_LABEL[role]}.\n\nSpørsmål: ${question}\n\n${
          context ? `Kontekst:\n${context}` : "Ingen spesifikk kontekst funnet."
        }`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || base.answer;
}

/**
 * Besvarer et spørsmål. Bruker OpenAI hvis aktivert, ellers nøkkelord-matcher.
 * Lenker/kilder kommer alltid fra matcheren (grunnet i faktiske ruter).
 */
export async function ask(question: string, role: Role): Promise<MatchResult> {
  const base = match(question, role);
  if (!isAssistantAiEnabled()) return base;
  try {
    const answer = await openaiAnswer(question, role, base);
    return { ...base, answer };
  } catch {
    // Faller tilbake til nøkkelord-svaret hvis OpenAI feiler.
    return base;
  }
}

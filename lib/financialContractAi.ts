// Server-only – AI-ekstraksjon av økonomikontrakter via Anthropic.
// Kalles ALDRI fra klient. Returnerer tomt objekt hvis funksjonen er av
// eller hvis @anthropic-ai/sdk ikke er installert.

export type ExtractedFinancialContract = {
  name?: string;
  supplierName?: string;
  type?: string;
  locationName?: string;
  startDate?: string; // ISO
  endDate?: string; // ISO
  monthlyAmount?: number;
  annualAmount?: number;
  totalValue?: number;
  areaSqm?: number;
  noticePeriodMonths?: number;
  renewalOption?: boolean;
  summary?: string;
  confidence?: "high" | "medium" | "low";
  warnings?: string[];
};

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Du er en assistent som leser norske økonomi- og leiekontrakter (PDF) og trekker ut nøkkeldata.
Returner KUN gyldig JSON som matcher det angitte skjemaet. Ikke gjett – la felt være utelatt hvis de ikke står i dokumentet.
Datoer skal være ISO-8601 (YYYY-MM-DD). Beløp skal være tall i NOK uten tusenskille eller valutategn.
Sett "confidence" til hvor sikker du er totalt, og legg eventuelle forbehold i "warnings".`;

export function isFinancialContractAiEnabled(): boolean {
  return (
    process.env.FINANCIAL_CONTRACT_AI_ENABLED === "true" &&
    !!process.env.ANTHROPIC_API_KEY
  );
}

/**
 * Leser en PDF (base64) og kaller Anthropic for å trekke ut kontraktdata.
 * @param pdfBase64 base64-kodet PDF-innhold
 */
export async function extractFinancialContract(
  pdfBase64: string
): Promise<ExtractedFinancialContract> {
  if (!isFinancialContractAiEnabled()) return {};

  // Dynamisk import slik at bygg ikke krever pakken når AI er av.
  // Typene er bevisst løse for å unngå hard avhengighet til SDK-en i build.
  let Anthropic: new (opts: { apiKey?: string }) => {
    messages: {
      create: (args: unknown) => Promise<{
        content: Array<{ type: string; text?: string }>;
      }>;
    };
  };
  try {
    const mod = (await import(
      /* webpackIgnore: true */ "@anthropic-ai/sdk" as string
    )) as { default: typeof Anthropic };
    Anthropic = mod.default;
  } catch {
    return { warnings: ["AI-pakken (@anthropic-ai/sdk) er ikke installert."] };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: `Trekk ut kontraktdata og returner JSON med disse feltene (alle valgfrie):
name, supplierName, type (en av RENT, LEASE, HUSLEIE, SERVICE_AGREEMENT, SUBSCRIPTION, INSURANCE, SUPPLIER, OTHER),
locationName, startDate, endDate, monthlyAmount, annualAmount, totalValue, areaSqm, noticePeriodMonths,
renewalOption (boolean), summary, confidence (high|medium|low), warnings (array of string).
Svar kun med JSON, ingen forklaring.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find(
      (b) => b.type === "text" && typeof b.text === "string"
    );
    if (!textBlock || typeof textBlock.text !== "string") {
      return { warnings: ["AI ga ikke noe svar."] };
    }

    const raw = textBlock.text.trim();
    const jsonText = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(jsonText) as ExtractedFinancialContract;
    return parsed;
  } catch (err) {
    return {
      warnings: [
        `AI-ekstraksjon feilet: ${
          err instanceof Error ? err.message : "ukjent feil"
        }`,
      ],
    };
  }
}

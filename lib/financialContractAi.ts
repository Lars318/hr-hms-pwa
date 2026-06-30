// Server-only – AI-ekstraksjon av økonomikontrakter via OpenAI.
// Kalles ALDRI fra klient. Returnerer tomt objekt hvis funksjonen er av
// eller hvis openai-pakken ikke er installert.

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

const MODEL = process.env.OPENAI_CONTRACT_MODEL ?? "gpt-4o";

const SYSTEM_PROMPT = `Du er en assistent som leser norske økonomi- og leiekontrakter (PDF) og trekker ut nøkkeldata.
Returner KUN gyldig JSON som matcher det angitte skjemaet. Ikke gjett – la felt være utelatt hvis de ikke står i dokumentet.
Datoer skal være ISO-8601 (YYYY-MM-DD). Beløp skal være tall i NOK uten tusenskille eller valutategn.
Sett "confidence" til hvor sikker du er totalt, og legg eventuelle forbehold i "warnings".`;

const USER_PROMPT = `Trekk ut kontraktdata og returner JSON med disse feltene (alle valgfrie):
name, supplierName, type (en av RENT, LEASE, HUSLEIE, SERVICE_AGREEMENT, SUBSCRIPTION, INSURANCE, SUPPLIER, OTHER),
locationName, startDate, endDate, monthlyAmount, annualAmount, totalValue, areaSqm, noticePeriodMonths,
renewalOption (boolean), summary, confidence (high|medium|low), warnings (array of string).
Svar kun med JSON, ingen forklaring.`;

export function isFinancialContractAiEnabled(): boolean {
  return (
    process.env.FINANCIAL_CONTRACT_AI_ENABLED === "true" &&
    !!process.env.OPENAI_API_KEY
  );
}

/**
 * Leser en PDF (base64) og kaller OpenAI for å trekke ut kontraktdata.
 * @param pdfBase64 base64-kodet PDF-innhold
 */
export async function extractFinancialContract(
  pdfBase64: string
): Promise<ExtractedFinancialContract> {
  if (!isFinancialContractAiEnabled()) return {};

  let OpenAI: typeof import("openai").default;
  try {
    OpenAI = (await import("openai")).default;
  } catch {
    return { warnings: ["AI-pakken (openai) kunne ikke lastes."] };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      max_tokens: 2000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              // PDF som fil-innhold (støttes av gpt-4o-modellene).
              type: "file",
              file: {
                filename: "kontrakt.pdf",
                file_data: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
            { type: "text", text: USER_PROMPT },
          ] as unknown as never,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return { warnings: ["AI ga ikke noe svar."] };

    const jsonText = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    return JSON.parse(jsonText) as ExtractedFinancialContract;
  } catch (err) {
    return {
      warnings: [
        `AI-ekstraksjon feilet: ${err instanceof Error ? err.message : "ukjent feil"}`,
      ],
    };
  }
}

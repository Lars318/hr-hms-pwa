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
  amountsExVat?: boolean; // true hvis beløpene i dokumentet er oppgitt eks. mva
  summary?: string;
  confidence?: "high" | "medium" | "low";
  warnings?: string[];
};

const MODEL = process.env.OPENAI_CONTRACT_MODEL ?? "gpt-4o";

const SYSTEM_PROMPT = `Du er en nøyaktig assistent som leser norske økonomi- og leiekontrakter (PDF) og trekker ut nøkkeldata.
Returner KUN gyldig JSON som matcher skjemaet.

ABSOLUTTE REGLER:
- Bruk KUN verdier som står ORDRETT i dokumentet. ALDRI gjett, regn ut, estimer eller fyll inn plausible tall.
- Hvis en verdi ikke står eksplisitt, skal feltet UTELATES (ikke sett 0 eller en antakelse).
- Beløp skrives som rene tall i NOK uten tusenskille/valuta: "Kr 1 275,- eks. Mva" → 1275. "kr 60 000,-" → 60000.
- Datoer i ISO-8601 (YYYY-MM-DD).

FELT-VEILEDNING:
- monthlyAmount = den faste månedlige avgiften (f.eks. "Månedsavgift", "Kr X per måned", "leasingbeløp pr mnd"). IKKE regn dette ut fra total.
- totalValue = oppgitt total kjøpesum/avtalesum hvis den står (f.eks. "Kjøpesummen … totalt på kr 60 000").
- annualAmount = kun hvis et årlig beløp står eksplisitt. Ikke regn månedlig × 12 selv.
- endDate = beregn KUN hvis startdato OG periode i måneder begge står (f.eks. start 01.12.2023 + "60 måneder" → 2028-12-01). Ellers utelat.
- noticePeriodMonths = oppsigelsestid i hele måneder hvis oppgitt.
- supplierName = leverandøren/utleier (ikke kunden).

Sett "confidence" lavt hvis du er usikker, og forklar usikkerhet i "warnings". Det er bedre å utelate et felt enn å gjette.`;

const USER_PROMPT = `Les hele dokumentet nøye og trekk ut kontraktdata. Returner JSON med disse feltene (alle valgfrie – utelat det som ikke står ordrett):
name, supplierName, type (en av RENT, LEASE, HUSLEIE, SERVICE_AGREEMENT, SUBSCRIPTION, INSURANCE, SUPPLIER, OTHER),
locationName, startDate, endDate, monthlyAmount, annualAmount, totalValue, areaSqm, noticePeriodMonths,
renewalOption (boolean), amountsExVat (boolean), summary, confidence (high|medium|low), warnings (array of string).

VIKTIG om mva: Sett "amountsExVat" til true HVIS beløpene i dokumentet er oppgitt eksklusiv mva
(f.eks. "eks. Mva", "eks mva", "ekskl. mva", "+ mva"). Behold beløpene slik de står (eks. mva) – systemet legger på mva selv.
Svar kun med JSON.`;

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
      temperature: 0,
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

    const parsed = JSON.parse(jsonText) as ExtractedFinancialContract;

    // Beløp i dokumentet er ofte eks. mva. Legg på 25 % mva deterministisk i
    // kode (ikke i modellen) så lagrede beløp er inkl. mva.
    if (parsed.amountsExVat) {
      const withVat = (v?: number) =>
        typeof v === "number" ? Math.round(v * 1.25 * 100) / 100 : v;
      parsed.monthlyAmount = withVat(parsed.monthlyAmount);
      parsed.annualAmount = withVat(parsed.annualAmount);
      parsed.totalValue = withVat(parsed.totalValue);
      parsed.warnings = [
        ...(parsed.warnings ?? []),
        "Beløp var oppgitt eks. mva og er omregnet til inkl. mva (×1,25).",
      ];
    }

    return parsed;
  } catch (err) {
    return {
      warnings: [
        `AI-ekstraksjon feilet: ${err instanceof Error ? err.message : "ukjent feil"}`,
      ],
    };
  }
}

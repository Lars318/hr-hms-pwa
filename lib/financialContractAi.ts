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
  durationMonths?: number; // avtaleperiode i måneder
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
- name = kort, beskrivende navn på avtalen, typisk dokumentets tittel/overskrift (f.eks. "Leasingavtale #1075"). Dette feltet skal ALLTID fylles ut.
- monthlyAmount = den faste månedlige avgiften (f.eks. "Månedsavgift", "Kr X per måned", "leasingbeløp pr mnd"). IKKE regn dette ut fra total.
- totalValue = oppgitt total kjøpesum/avtalesum hvis den står (f.eks. "Kjøpesummen … totalt på kr 60 000").
- durationMonths = avtaleperioden i antall måneder hvis den står (f.eks. "Periode: 60 måneder" → 60).
- startDate = oppgitt startdato. (endDate trenger du ikke regne ut – systemet beregner sluttdato fra startDate + durationMonths.)
- locationName = leverings-/leveranseadresse eller senter/lokasjon nevnt i avtalen (f.eks. "Puls Kantor AS").
- noticePeriodMonths = oppsigelsestid i hele måneder hvis oppgitt.
- supplierName = leverandøren/utleier (ikke kunden).

Sett "confidence" lavt hvis du er usikker, og forklar usikkerhet i "warnings". Det er bedre å utelate et felt enn å gjette.`;

const USER_PROMPT = `Les hele dokumentet nøye og trekk ut kontraktdata. Returner JSON med disse feltene (utelat det som ikke står ordrett, men "name" skal alltid fylles ut):
name, supplierName, type (en av RENT, LEASE, HUSLEIE, SERVICE_AGREEMENT, SUBSCRIPTION, INSURANCE, SUPPLIER, OTHER),
locationName, startDate, durationMonths, monthlyAmount, totalValue, areaSqm, noticePeriodMonths,
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
      parsed.totalValue = withVat(parsed.totalValue);
      parsed.warnings = [
        ...(parsed.warnings ?? []),
        "Beløp var oppgitt eks. mva og er omregnet til inkl. mva (×1,25).",
      ];
    }

    // Årlig beløp = månedlig × 12 (utledes alltid fra månedlig hvis det finnes).
    if (typeof parsed.monthlyAmount === "number") {
      parsed.annualAmount = Math.round(parsed.monthlyAmount * 12 * 100) / 100;
    }

    // Sluttdato = startdato + periode (måneder) hvis sluttdato ikke alt er satt.
    if (!parsed.endDate && parsed.startDate && typeof parsed.durationMonths === "number") {
      const d = new Date(parsed.startDate);
      if (!isNaN(d.getTime())) {
        d.setMonth(d.getMonth() + parsed.durationMonths);
        parsed.endDate = d.toISOString().slice(0, 10);
      }
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

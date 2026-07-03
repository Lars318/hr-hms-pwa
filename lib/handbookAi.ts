// Server-only – strukturerer en opplastet personalhåndbok (PDF) til kapitler
// og seksjoner via OpenAI. Tekst-først (pdf-parse), visuell fallback.

export interface HandbookSectionDraft {
  title: string;
  content: string; // markdown/ren tekst
}
export interface HandbookChapterDraft {
  title: string;
  description?: string;
  sections: HandbookSectionDraft[];
}
export interface StructuredHandbook {
  chapters: HandbookChapterDraft[];
  warnings?: string[];
}

const MODEL = process.env.OPENAI_HANDBOOK_MODEL ?? "gpt-4o";

const SYSTEM_PROMPT = `Du strukturerer en norsk personalhåndbok fra et dokument til kapitler og seksjoner for et intranett.
Returner KUN gyldig JSON: { "chapters": [ { "title": string, "description"?: string, "sections": [ { "title": string, "content": string } ] } ] }.

Regler:
- Del innholdet i logiske KAPITLER (f.eks. "Arbeidstid", "Ferie og fravær", "HMS", "Lønn", "Personalgoder").
- Hvert kapittel har SEKSJONER med en tittel og innhold.
- "content" skal være ren tekst / enkel markdown (avsnitt, punktlister med "- "). IKKE finn opp innhold – bruk KUN det som står i dokumentet, men rydd opp i formatering og fjern sidetall/topptekst/bunntekst.
- Behold formuleringene mest mulig ordrett; du strukturerer, ikke omskriver.
- Utelat rene forsider, innholdsfortegnelser og signaturfelter.
- Bevar rekkefølgen fra dokumentet.`;

const USER_PROMPT = `Strukturer denne personalhåndboken til kapitler og seksjoner. Svar kun med JSON.`;

export function isHandbookAiEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

export async function structureHandbook(pdfBase64: string): Promise<StructuredHandbook> {
  if (!isHandbookAiEnabled()) return { chapters: [], warnings: ["AI er ikke aktivert (mangler OPENAI_API_KEY)."] };

  let OpenAI: typeof import("openai").default;
  try {
    OpenAI = (await import("openai")).default;
  } catch {
    return { chapters: [], warnings: ["AI-pakken (openai) kunne ikke lastes."] };
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Tekst-først: maskinlesbar tekst gir best resultat.
  let pdfText = "";
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: Buffer.from(pdfBase64, "base64") });
    pdfText = ((await parser.getText()).text ?? "").trim();
  } catch {
    /* faller tilbake til visuell lesing */
  }
  const hasText = pdfText.length > 300;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 8000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        hasText
          ? { role: "user", content: `${USER_PROMPT}\n\nHÅNDBOK-TEKST:\n"""\n${pdfText}\n"""` }
          : {
              role: "user",
              content: [
                { type: "file", file: { filename: "handbok.pdf", file_data: `data:application/pdf;base64,${pdfBase64}` } },
                { type: "text", text: USER_PROMPT },
              ] as unknown as never,
            },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return { chapters: [], warnings: ["AI ga ikke noe svar."] };
    const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonText) as StructuredHandbook;
    if (!Array.isArray(parsed.chapters)) return { chapters: [], warnings: ["AI returnerte ugyldig struktur."] };
    return parsed;
  } catch (err) {
    return { chapters: [], warnings: [`AI-strukturering feilet: ${err instanceof Error ? err.message : "ukjent feil"}`] };
  }
}

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

const MODEL = process.env.OPENAI_HANDBOOK_MODEL ?? "gpt-4.1";

const SYSTEM_PROMPT = `Du deler en norsk personalhåndbok inn i kapitler og seksjoner for et intranett.
Returner KUN gyldig JSON: { "chapters": [ { "title": string, "description"?: string, "sections": [ { "title": string, "content": string } ] } ] }.

ABSOLUTT VIKTIGST — ORDRETT GJENGIVELSE:
- Gjengi teksten HELT ORDRETT, tegn for tegn, slik den står i dokumentet. IKKE omskriv, oppsummer, forkort, forbedre eller oversett.
- IKKE gjett eller finn på noe. Er noe uleselig, skriv "[uleselig]" i stedet for å gjette.
- Behold opprinnelig OPPSETT: samme overskrifter, avsnitt, rekkefølge, nummerering og punktlister som i PDF-en. Bruk markdown kun for å gjenskape det opprinnelige oppsettet (overskrifter, "- " for punkter, tall for nummererte lister).
- Ikke legg til eller fjern innhold. Eneste unntak: rene gjentatte topptekster/bunntekster og sidetall (f.eks. firmanavn/adresse i sidefot) som ikke er en del av selve håndbokteksten, kan utelates.

STRUKTURERING (kun inndeling — ikke endring av tekst):
- Bruk dokumentets EGNE overskrifter til å definere kapitler og seksjoner. Ikke finn på nye titler; bruk overskriftene som står der.
- "title" for kapittel/seksjon = overskriften slik den står i dokumentet.
- "content" = all brødtekst under den overskriften, ordrett.
- Bevar den opprinnelige rekkefølgen nøyaktig.`;

const USER_PROMPT = `Del denne personalhåndboken inn i kapitler og seksjoner basert på dokumentets egne overskrifter, og gjengi all tekst ORDRETT med samme oppsett. Svar kun med JSON.`;

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
      temperature: 0,
      max_tokens: 16000,
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

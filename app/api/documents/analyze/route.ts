import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

const CATEGORY_RULES: { keywords: string[]; category: string; tags: string[] }[] = [
  {
    keywords: ["ansettelseskontrakt", "arbeidsavtale", "arbeidskontrakt", "tilsettingsbrev", "fast stilling", "midlertidig stilling", "deltid", "heltid"],
    category: "Kontrakt — personell",
    tags: ["ansettelse", "kontrakt"],
  },
  {
    keywords: ["leverandør", "tjenesteleverandør", "underleverandør", "innkjøp", "rammeavtale", "service agreement", "vendor"],
    category: "Kontrakt — leverandør",
    tags: ["leverandør", "kontrakt"],
  },
  {
    keywords: ["brann", "brannvern", "evakuering", "hms", "risikovurdering", "eba", "verneombud", "arbeidsmiljø", "sikkerhet", "risiko", "tiltak", "prosedyre", "internkontroll", "stoffkartotek"],
    category: "HMS",
    tags: ["HMS"],
  },
  {
    keywords: ["cv", "curriculum vitae", "søknad", "attest", "referanse", "kompetanse", "opplæring", "kurs", "sertifikat", "fagbrev"],
    category: "Personell",
    tags: ["personell"],
  },
  {
    keywords: ["rapport", "årsrapport", "statistikk", "analyse", "oversikt", "budsjett", "regnskap"],
    category: "Rapport",
    tags: ["rapport"],
  },
];

const EXTRA_TAG_RULES: { keywords: string[]; tag: string }[] = [
  { keywords: ["2024"], tag: "2024" },
  { keywords: ["2025"], tag: "2025" },
  { keywords: ["2026"], tag: "2026" },
  { keywords: ["oslo", "bergen", "trondheim", "stavanger"], tag: "lokasjon" },
  { keywords: ["signert", "underskrevet", "godkjent"], tag: "signert" },
  { keywords: ["utgått", "utløpt", "ugyldig"], tag: "utgått" },
  { keywords: ["mal", "template", "skjema"], tag: "mal" },
  { keywords: ["konfidensielt", "privat", "sensitiv"], tag: "konfidensielt" },
  { keywords: ["vikar", "engasjement", "sesong"], tag: "midlertidig" },
  { keywords: ["renhold", "vakt", "kantine", "it", "transport"], tag: "tjeneste" },
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[_\-\.]/g, " ");
}

function analyzeText(fileName: string): { category: string; tags: string[]; confidence: number } {
  const haystack = normalize(fileName);

  let bestMatch = { category: "Annet", tags: [] as string[], score: 0 };

  for (const rule of CATEGORY_RULES) {
    const hits = rule.keywords.filter((kw) => haystack.includes(kw));
    if (hits.length > bestMatch.score) {
      bestMatch = { category: rule.category, tags: [...rule.tags], score: hits.length };
    }
  }

  const extraTags: string[] = [];
  for (const rule of EXTRA_TAG_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      extraTags.push(rule.tag);
    }
  }

  const allTags = Array.from(new Set([...bestMatch.tags, ...extraTags]));
  const confidence = bestMatch.score > 0
    ? Math.min(95, 60 + bestMatch.score * 15)
    : 40;

  return { category: bestMatch.category, tags: allTags, confidence };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });

    const { fileName, profileName } = await req.json();
    if (!fileName) return NextResponse.json({ error: "Mangler filnavn" }, { status: 400 });

    const analysis = analyzeText(fileName + (profileName ? " " + profileName : ""));

    const categories = await db.documentCategoryLabel.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === analysis.category.toLowerCase()
    ) ?? null;

    let suggestedProfile = null;
    if (profileName) {
      suggestedProfile = await db.profile.findFirst({
        where: { fullName: { contains: profileName, mode: "insensitive" } },
        select: { id: true, fullName: true, title: true },
      });
    }

    return NextResponse.json({
      categoryName: analysis.category,
      categoryId: matchedCategory?.id ?? null,
      tags: analysis.tags,
      confidence: analysis.confidence,
      suggestedProfile,
    });
  } catch (e) {
    console.error("[documents/analyze]", e);
    return NextResponse.json({ error: "Analysefeil" }, { status: 500 });
  }
}

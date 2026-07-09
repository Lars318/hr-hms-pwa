"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import {
  Upload, X, Plus, Check, ChevronRight, Loader2,
  FileText, Sparkles, User, Tag, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MIME_LABELS, sanitizeFileName } from "@/lib/supabase/admin";

const MAX_MB = MAX_FILE_SIZE_BYTES / 1024 / 1024;
const ACCEPT = ALLOWED_MIME_TYPES.join(",");

interface AnalysisResult {
  categoryName: string;
  categoryId: string | null;
  tags: string[];
  confidence: number;
  suggestedProfile: { id: string; fullName: string; title: string | null } | null;
}

type Phase = "drop" | "uploading" | "review" | "saving" | "done";

export function DocumentImportClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("drop");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [sizeBytes, setSizeBytes] = useState(0);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [title, setTitle] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [linkedProfileId, setLinkedProfileId] = useState<string | null>(null);
  const [linkedProfileName, setLinkedProfileName] = useState("");
  const [profileSearch, setProfileSearch] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const { data: categories = [], refetch: refetchCategories } = trpc.documentCategory.list.useQuery();
  const { data: profiles = [] } = trpc.profile.list.useQuery(
    { search: profileSearch },
    { enabled: profileSearch.length >= 2 }
  );
  const createUploadUrl = trpc.document.createUploadUrl.useMutation();
  const createDoc = trpc.document.create.useMutation();
  const createCategory = trpc.documentCategory.create.useMutation();

  function validateFile(f: File): string | null {
    if (!ALLOWED_MIME_TYPES.includes(f.type as never)) return `Filtype ikke tillatt.`;
    if (f.size > MAX_FILE_SIZE_BYTES) return `For stor — maks ${MAX_MB} MB.`;
    return null;
  }

  const processFile = useCallback(async (f: File) => {
    setError(null);
    const err = validateFile(f);
    if (err) { setError(err); return; }

    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[_\-]/g, " "));
    setPhase("uploading");
    setUploadProgress(10);

    try {
      const { signedUrl, filePath: fp, documentId: docId } = await createUploadUrl.mutateAsync({
        fileName: f.name, mimeType: f.type, sizeBytes: f.size,
      });
      setUploadProgress(30);

      const res = await fetch(signedUrl, {
        method: "PUT", body: f, headers: { "Content-Type": f.type },
      });
      if (!res.ok) throw new Error(`Opplasting feilet (HTTP ${res.status})`);

      setFilePath(fp);
      setDocumentId(docId);
      setMimeType(f.type);
      setSizeBytes(f.size);
      setUploadProgress(70);

      const aRes = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: f.name }),
      });
      const aData: AnalysisResult = await aRes.json();
      setAnalysis(aData);
      setTags(aData.tags);
      setSelectedCategoryId(aData.categoryId);
      setSelectedCategoryName(aData.categoryName);
      if (aData.suggestedProfile) {
        setLinkedProfileId(aData.suggestedProfile.id);
        setLinkedProfileName(aData.suggestedProfile.fullName);
      }
      setUploadProgress(100);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feil ved opplasting.");
      setPhase("drop");
    }
  }, []);

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleAddCategory() {
    if (!newCategoryInput.trim()) return;
    const cat = await createCategory.mutateAsync({ name: newCategoryInput.trim() });
    await refetchCategories();
    setSelectedCategoryId(cat.id);
    setSelectedCategoryName(cat.name);
    setNewCategoryInput("");
    setShowCategoryPicker(false);
  }

  async function handleSave() {
    if (!file || !filePath) return;
    setPhase("saving");
    try {
      await createDoc.mutateAsync({
        documentId,
        title: title.trim() || file.name,
        category: "OTHER",
        tags,
        customCategoryId: selectedCategoryId ?? undefined,
        linkedProfileId: linkedProfileId ?? undefined,
        visibility: "PUBLIC",
        filePath,
        mimeType,
        sizeBytes,
      });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lagring feilet.");
      setPhase("review");
    }
  }

  function reset() {
    setPhase("drop");
    setFile(null);
    setAnalysis(null);
    setTitle("");
    setTags([]);
    setTagInput("");
    setSelectedCategoryId(null);
    setSelectedCategoryName("");
    setLinkedProfileId(null);
    setLinkedProfileName("");
    setProfileSearch("");
    setError(null);
    setUploadProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-lg font-semibold">Dokument lagret</p>
          <p className="text-sm text-muted-foreground mt-1">"{title}" er importert og kategorisert.</p>
        </div>
        <div className="flex gap-2 mt-2">
          <Button variant="outline" onClick={reset}>Last opp nytt</Button>
          <Button onClick={() => router.push("/dokumenter")}>Se alle dokumenter</Button>
        </div>
      </div>
    );
  }

  if (phase === "drop") {
    return (
      <div className="space-y-4">
        {/* Dra og slipp */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) processFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Dra og slipp fil her</p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF, Word, Excel, bilder — maks {MAX_MB} MB</p>
          </div>
          <Button variant="outline" size="sm" type="button">Velg fil</Button>
          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        </div>

        {/* Kamera / Bilder på mobil */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-4 text-sm text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors">
            <FileText className="h-5 w-5" />
            Kamera
            <input type="file" accept="image/*" capture="environment" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
          </label>
          <label className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-4 text-sm text-muted-foreground cursor-pointer hover:bg-muted/40 transition-colors">
            <FolderOpen className="h-5 w-5" />
            Bilder
            <input type="file" accept="image/*" className="sr-only"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">{uploadProgress < 70 ? "Laster opp..." : "Analyserer innhold..."}</p>
        <div className="w-full max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{file?.name}</p>
      </div>
    );
  }

  if (phase === "saving") {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Lagrer dokument...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filinfo */}
      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5">
        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file?.name}</p>
          <p className="text-xs text-muted-foreground">{(sizeBytes / 1024).toFixed(0)} KB</p>
        </div>
        <button onClick={reset} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* AI-forslag banner */}
      {analysis && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-primary font-medium">
            AI-forslag basert på filnavnet — {analysis.confidence}% sikkerhet. Juster om nødvendig.
          </p>
        </div>
      )}

      {/* Tittel */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tittel</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Dokumenttittel"
        />
      </div>

      {/* Kategori */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Kategori</label>
        {showCategoryPicker ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-1 rounded-2xl border bg-card overflow-hidden divide-y divide-border">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setSelectedCategoryName(cat.name);
                    setShowCategoryPicker(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors",
                    selectedCategoryId === cat.id && "bg-primary/5 text-primary font-medium"
                  )}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                  {cat.name}
                  {selectedCategoryId === cat.id && <Check className="h-4 w-4 ml-auto" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="+ Ny kategori..."
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button size="sm" variant="outline" onClick={handleAddCategory} disabled={!newCategoryInput.trim() || createCategory.isPending}>
                {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Legg til"}
              </Button>
            </div>
            <button onClick={() => setShowCategoryPicker(false)} className="text-xs text-muted-foreground hover:underline">Avbryt</button>
          </div>
        ) : (
          <button
            onClick={() => setShowCategoryPicker(true)}
            className="w-full flex items-center gap-2 rounded-2xl border bg-card px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors"
          >
            {selectedCategoryId && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: categories.find(c => c.id === selectedCategoryId)?.color ?? "#888" }} />}
            <span className={selectedCategoryName ? "text-foreground" : "text-muted-foreground"}>
              {selectedCategoryName || "Velg kategori"}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <Tag className="h-3 w-3" /> Tags
        </label>
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Legg til tag..."
              className="rounded-full border border-dashed border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:border-primary w-32"
            />
            {tagInput.trim() && (
              <button onClick={() => addTag(tagInput)} className="text-primary">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Enter eller komma for å legge til</p>
      </div>

      {/* Knytt til ansatt */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
          <User className="h-3 w-3" /> Knytt til ansatt (valgfritt)
        </label>
        {linkedProfileId ? (
          <div className="flex items-center gap-2 rounded-xl border bg-primary/5 border-primary/20 px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-medium shrink-0">
              {linkedProfileName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <span className="flex-1 text-sm font-medium">{linkedProfileName}</span>
            <button onClick={() => { setLinkedProfileId(null); setLinkedProfileName(""); setProfileSearch(""); }} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <input
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
              placeholder="Søk etter ansatt..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {profileSearch.length >= 2 && profiles.length > 0 && (
              <div className="rounded-2xl border bg-card overflow-hidden divide-y divide-border">
                {profiles.slice(0, 5).map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => { setLinkedProfileId(p.id); setLinkedProfileName(p.fullName); setProfileSearch(""); }}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                      {p.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{p.fullName}</p>
                      {p.title && <p className="text-xs text-muted-foreground">{p.title}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={reset} className="flex-1">Avbryt</Button>
        <Button onClick={handleSave} className="flex-1" disabled={!title.trim()}>
          <Check className="h-4 w-4 mr-1.5" />
          Lagre dokument
        </Button>
      </div>
    </div>
  );
}

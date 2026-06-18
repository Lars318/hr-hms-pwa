"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

interface AvatarUploadProps {
  profileId: string;
  currentUrl: string | null;
  fullName: string;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0].slice(0, 2);
  return <span className="text-2xl font-bold select-none">{initials.toUpperCase()}</span>;
}

export function AvatarUpload({ profileId, currentUrl, fullName }: AvatarUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("profileId", profileId);

    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await res.json() as { ok?: boolean; avatarUrl?: string; error?: string };

    setUploading(false);
    if (!data.ok) {
      setError(data.error ?? "Opplasting feilet");
      setPreview(currentUrl);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group h-24 w-24 rounded-full overflow-hidden bg-primary flex items-center justify-center text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
        title="Endre profilbilde"
      >
        {preview ? (
          <img src={preview} alt={fullName} className="h-full w-full object-cover" />
        ) : (
          <Initials name={fullName} />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Trykk for å endre bilde</p>
    </div>
  );
}

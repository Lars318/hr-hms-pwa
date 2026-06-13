const STORAGE_KEY = "hr_hms_incident_drafts";

export interface IncidentDraft {
  id: string;
  title: string;
  description: string;
  severity: string;
  location: string;
  occurredAt: string;
  departmentId: string;
  savedAt: string;
  syncStatus: "pending" | "synced" | "failed";
  syncError?: string;
}

function readStorage(): IncidentDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IncidentDraft[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(drafts: IncidentDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function getDrafts(): IncidentDraft[] {
  return readStorage();
}

export function getDraft(id: string): IncidentDraft | undefined {
  return readStorage().find((d) => d.id === id);
}

export function saveDraft(
  draft: Omit<IncidentDraft, "savedAt" | "syncStatus">
): IncidentDraft {
  const drafts = readStorage();
  const existing = drafts.findIndex((d) => d.id === draft.id);
  const updated: IncidentDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
    syncStatus: "pending",
  };
  if (existing >= 0) {
    drafts[existing] = updated;
  } else {
    drafts.push(updated);
  }
  writeStorage(drafts);
  return updated;
}

export function deleteDraft(id: string) {
  writeStorage(readStorage().filter((d) => d.id !== id));
}

/** Remove all locally stored drafts — call on logout to clear sensitive data. */
export function clearAllDrafts() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function markDraftSynced(id: string) {
  const drafts = readStorage();
  const idx = drafts.findIndex((d) => d.id === id);
  if (idx >= 0) {
    drafts[idx] = { ...drafts[idx], syncStatus: "synced" };
    writeStorage(drafts);
  }
}

export function markDraftFailed(id: string, error: string) {
  const drafts = readStorage();
  const idx = drafts.findIndex((d) => d.id === id);
  if (idx >= 0) {
    drafts[idx] = { ...drafts[idx], syncStatus: "failed", syncError: error };
    writeStorage(drafts);
  }
}

export function getPendingDrafts(): IncidentDraft[] {
  return readStorage().filter((d) => d.syncStatus === "pending");
}

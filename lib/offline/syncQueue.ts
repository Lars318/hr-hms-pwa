import {
  getPendingDrafts,
  markDraftSynced,
  markDraftFailed,
  deleteDraft,
} from "./drafts";

export type SyncIncidentFn = (draft: {
  title: string;
  description: string;
  severity: string;
  location: string;
  occurredAt: string;
  departmentId: string;
}) => Promise<{ id: string }>;

let syncing = false;

export async function syncPendingDrafts(
  createIncident: SyncIncidentFn
): Promise<{ synced: number; failed: number }> {
  if (syncing || !navigator.onLine) return { synced: 0, failed: 0 };
  syncing = true;

  const pending = getPendingDrafts();
  let synced = 0;
  let failed = 0;

  for (const draft of pending) {
    try {
      await createIncident({
        title: draft.title,
        description: draft.description,
        severity: draft.severity,
        location: draft.location,
        occurredAt: draft.occurredAt,
        departmentId: draft.departmentId,
      });
      markDraftSynced(draft.id);
      // Remove synced drafts after a short delay so UI can show "synced" state
      setTimeout(() => deleteDraft(draft.id), 3000);
      synced++;
    } catch (err) {
      markDraftFailed(
        draft.id,
        err instanceof Error ? err.message : "Ukjent feil"
      );
      failed++;
    }
  }

  syncing = false;
  return { synced, failed };
}

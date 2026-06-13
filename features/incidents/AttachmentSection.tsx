"use client";

import type { IncidentStatus, Role } from "@prisma/client";
import { AttachmentList } from "./AttachmentList";
import { AttachmentUpload } from "./AttachmentUpload";

interface AttachmentSectionProps {
  incidentId: string;
  incidentStatus: IncidentStatus;
  viewerRole: Role;
  viewerProfileId: string;
  canUpload: boolean;
}

export function AttachmentSection({
  incidentId,
  incidentStatus,
  viewerRole,
  viewerProfileId,
  canUpload,
}: AttachmentSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">Vedlegg</h2>
      <AttachmentList
        incidentId={incidentId}
        incidentStatus={incidentStatus}
        viewerRole={viewerRole}
        viewerProfileId={viewerProfileId}
      />
      {canUpload && <AttachmentUpload incidentId={incidentId} />}
    </div>
  );
}

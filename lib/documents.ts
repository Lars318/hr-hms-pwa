import type { DocumentCategory, DocumentVisibility } from "@prisma/client";

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  POLICY: "Rutine/Policy",
  PROCEDURE: "Prosedyre",
  INSTRUCTION: "Instruks",
  CHECKLIST: "Sjekkliste",
  TEMPLATE: "Mal",
  HMS: "HMS",
  HR: "HR",
  OTHER: "Annet",
};

export const VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  PUBLIC: "Alle ansatte",
  PRIVATE: "HR / Admin",
};

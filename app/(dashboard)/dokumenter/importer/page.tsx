import { DocumentImportClient } from "@/features/documents/DocumentImportClient";

export const metadata = { title: "Importer dokument – Truls HR" };

export default function ImportDocumentPage() {
  return (
    <div className="max-w-lg mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Importer dokument</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last opp fil — AI foreslår kategori og tags automatisk.
        </p>
      </div>
      <DocumentImportClient />
    </div>
  );
}

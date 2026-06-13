"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDrafts } from "@/lib/offline/drafts";

export default function OfflinePage() {
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    setDraftCount(getDrafts().length);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <WifiOff className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Du er frakoblet</h1>
        <p className="max-w-sm text-muted-foreground">
          Ingen internettforbindelse. Du kan fortsatt rapportere avvik — de
          lagres lokalt og sendes inn automatisk når du er tilkoblet igjen.
        </p>
      </div>

      <div className="grid w-full max-w-lg gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Rapporter avvik (offline)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Kladder lagres lokalt og synkroniseres automatisk når nettilgang
              er gjenopprettet.
            </p>
            {draftCount > 0 && (
              <p className="mb-3 text-sm font-medium text-amber-600">
                {draftCount} kladd venter på innsending
              </p>
            )}
            <Button asChild className="w-full">
              <Link href="/avvik/ny">Rapporter avvik</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-blue-500" />
              Tilgjengelig offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Rapportere avvik (lagres som kladd)</li>
              <li>• Nylig besøkte sider (fra cache)</li>
              <li>• Appens grensesnitt og navigasjon</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>Ikke tilgjengelig offline:</strong> ansattoversikt, dokumenter,
              risikovurderinger og tiltak krever internettilkobling.
            </p>
          </CardContent>
        </Card>
      </div>

      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Prøv igjen
      </Button>
    </div>
  );
}

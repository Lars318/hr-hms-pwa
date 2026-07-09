import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Ingen tilgang – HR/HMS" };

export default function IngenTilgangPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldOff className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h1 className="text-2xl font-bold tracking-tight">Ingen tilgang</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        Du har ikke rettigheter til denne siden. Kontakt administrator dersom du mener dette er feil.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/dashboard">Tilbake til dashboard</Link>
      </Button>
    </div>
  );
}

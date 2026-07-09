import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Shield, AlertTriangle, MessageSquare, Lock, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Varsling – HR/HMS" };

export default async function VarslingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await db.profile.findUnique({ where: { supabaseUserId: user.id } });
  if (!profile) redirect("/ingen-tilgang");

  const isHrAdmin = profile.role === "ADMIN" || profile.role === "HR";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Varsling om kritikkverdige forhold</h1>
        <p className="text-muted-foreground mt-1">
          Trygg intern kanal for varsling etter arbeidsmiljøloven §2A.
        </p>
      </div>

      {/* Hva er varsling */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">Hva er varsling?</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Varsling er å si fra om kritikkverdige forhold i virksomheten – forhold som er i strid med
          lov, etiske retningslinjer eller virksomhetens egne normer. Det kan for eksempel være:
        </p>
        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
          <li>Trakassering eller diskriminering</li>
          <li>Brudd på sikkerhetsrutiner eller HMS-regler</li>
          <li>Økonomiske misligheter</li>
          <li>Uetisk atferd fra ledere eller kollegaer</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Vanlige arbeidsrelaterte klager (lønn, arbeidstid, ferier) sendes til nærmeste leder eller HR – ikke her.
        </p>
      </section>

      {/* Gjengjeldelse */}
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-600" />
          <h2 className="font-semibold text-amber-800">Gjengjeldelse er forbudt</h2>
        </div>
        <p className="text-sm text-amber-700">
          Arbeidsmiljøloven §2A-2 forbyr gjengjeldelse mot ansatte som varsler. Det er ikke tillatt å
          behandle en ansatt dårligere som følge av at de har varslet om kritikkverdige forhold.
          Brudd på dette kan gi erstatningsansvar.
        </p>
      </section>

      {/* Konfidensialitet */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-600" />
          <h2 className="font-semibold">Konfidensialitet og anonymitet</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Alle varslingssaker behandles konfidensielt og er kun tilgjengelig for HR og administrator.
          Ledere og kollegaer ser ikke saken din med mindre du eksplisitt velger det.
        </p>
        <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <strong>Om anonym innsending:</strong> Du kan merke saken som anonym, og navnet ditt
          vil da ikke vises i saksbildet. Merk at tekniske logger i systemet likevel kan finnes av
          administrator. <strong>Full anonym ekstern varslingskanal er ikke implementert i denne
          piloten.</strong>
        </div>
      </section>

      {/* Behandling */}
      <section className="rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Slik behandles varslet ditt</h2>
        </div>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Du sender varslet via skjemaet nedenfor</li>
          <li>HR og/eller administrator mottar nøytral varsling om ny sak (uten din beskrivelse)</li>
          <li>En saksbehandler tildeles saken</li>
          <li>Saken undersøkes og du kan følge opp via meldinger</li>
          <li>Saken avsluttes med en beslutning</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Du kan følge opp egne saker under <strong>Mine varslingssaker</strong>.
        </p>
      </section>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg" className="min-h-[44px]">
          <Link href="/varsling/ny">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Send varsel om kritikkverdig forhold
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-[44px]">
          <Link href="/varsling/mine">
            <ArrowRight className="h-4 w-4 mr-2" />
            Mine varslingssaker
          </Link>
        </Button>
        {isHrAdmin && (
          <Button asChild variant="outline" size="lg" className="min-h-[44px]">
            <Link href="/varsling/admin">
              Admin-oversikt
            </Link>
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Spørsmål om varslingsprosessen? Kontakt HR på{" "}
        <a href="mailto:hr@pulsfollo.no" className="underline">hr@pulsfollo.no</a>
      </p>
    </div>
  );
}

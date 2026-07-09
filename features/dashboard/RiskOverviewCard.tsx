import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiskTopAssessment {
  id: string;
  title: string;
  reviewDate: Date | null;
  department: { name: string } | null;
  _count: { riskItems: number };
}

interface RiskOverviewCardProps {
  active: number;
  reviewSoon: number;
  criticalHighItems: number;
  topAssessment: RiskTopAssessment | null;
}

export function RiskOverviewCard({ active, reviewSoon, criticalHighItems, topAssessment }: RiskOverviewCardProps) {
  const needsAttention = criticalHighItems > 0 || reviewSoon > 0;

  return (
    <div className={`rounded-2xl border bg-card col-span-full ${needsAttention ? "border-orange-200" : ""}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Risikovurderinger</h3>
        </div>
        <Link href="/risiko" className="text-xs text-muted-foreground hover:underline">Se alle →</Link>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{active}</p>
            <p className="text-xs text-muted-foreground">Aktive</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${reviewSoon > 0 ? "text-yellow-700" : ""}`}>{reviewSoon}</p>
            <p className="text-xs text-muted-foreground">Til revisjon ≤30d</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${criticalHighItems > 0 ? "text-red-700" : ""}`}>{criticalHighItems}</p>
            <p className="text-xs text-muted-foreground">Høy/kritisk risiko</p>
          </div>
        </div>

        {/* Warning if critical items */}
        {criticalHighItems > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm text-orange-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {criticalHighItems} ubehandlede høy/kritiske risikopunkter krever oppfølging
          </div>
        )}

        {/* Top assessment */}
        {topAssessment && (
          <Link href={`/risiko/${topAssessment.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/30 transition-colors">
            <div>
              <p className="text-sm font-medium">{topAssessment.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {topAssessment.department?.name ?? "Ingen avdeling"}
                {topAssessment.reviewDate && ` · Revisjon: ${format(new Date(topAssessment.reviewDate), "d. MMM yyyy", { locale: nb })}`}
              </p>
            </div>
            <Badge variant="secondary">{topAssessment._count.riskItems} punkter</Badge>
          </Link>
        )}
      </div>
    </div>
  );
}

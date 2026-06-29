import { TRPCError } from "@trpc/server";

/**
 * Avviser selvstendig næringsdrivende fra ansatt-spesifikke handlinger
 * (fravær, overtid, medarbeidersamtale). Server-side håndheving av det
 * juridiske skillet — siste forsvarslag bak skjult nav + sidevern.
 */
export function assertNotContractor(profile: { employmentType?: string | null }) {
  if (profile.employmentType === "SELF_EMPLOYED") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Denne funksjonen er kun for ansatte, ikke selvstendig næringsdrivende.",
    });
  }
}

-- ============================================================================
-- HR/HMS PWA — Supabase Row Level Security
-- ============================================================================
--
-- VIKTIG: Les docs/RLS_PLAN.md FØR du kjører denne filen.
--
-- Strategi: Aktiver RLS på alle applikasjonstabeller uten permissive policies.
-- Effekt:
--   - anon/authenticated roller: INGEN tilgang (deny all)
--   - postgres superbruker (Prisma): bypasser RLS automatisk — UPÅVIRKET
--   - service role (Storage): bypasser RLS automatisk — UPÅVIRKET
--
-- Applikasjonskoden trenger INGEN endringer.
--
-- Kjøring mot staging:
--   psql "$DIRECT_URL" < supabase/policies/rls.sql
--
-- Kjøring mot produksjon (kun etter staging-test):
--   psql "$DIRECT_URL_PROD" < supabase/policies/rls.sql
--
-- Angre på én tabell:
--   ALTER TABLE "Incident" DISABLE ROW LEVEL SECURITY;
--
-- ============================================================================

-- ── Fase 1 — Høy prioritet (sensitiv persondata og brukerdata) ────────────

-- Profile — persondata, roller, e-post, avdelingstilknytning
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" FORCE ROW LEVEL SECURITY;
-- Ingen permissive policies → anon/authenticated: deny all
-- postgres (Prisma) bypasser via BYPASSRLS

-- Notification — interne varsler knyttet til bruker
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" FORCE ROW LEVEL SECURITY;

-- PushSubscription — push-endpoint og krypteringsnøkler
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" FORCE ROW LEVEL SECURITY;

-- DocumentReadConfirmation — hvem har bekreftet lesing av hva
ALTER TABLE "DocumentReadConfirmation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentReadConfirmation" FORCE ROW LEVEL SECURITY;

-- ── Fase 2 — HMS og fraværsdata ───────────────────────────────────────────

-- Incident — HMS-avvik med fritekstbeskrivelser
ALTER TABLE "Incident" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Incident" FORCE ROW LEVEL SECURITY;

-- Attachment — filmetadata for vedlegg til avvik
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" FORCE ROW LEVEL SECURITY;

-- Document — dokumentmetadata (selve filen ligger i Storage)
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;

-- LeaveRequest — fraværssøknader med årsaker og lederkommentarer
ALTER TABLE "LeaveRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeaveRequest" FORCE ROW LEVEL SECURITY;

-- AuditLog — aktivitetslogg knyttet til brukere og hendelser
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;

-- ── Fase 3 — Risiko og organisasjonsdata ──────────────────────────────────

-- RiskAssessment — risikovurderinger
ALTER TABLE "RiskAssessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiskAssessment" FORCE ROW LEVEL SECURITY;

-- RiskItem — risikopunkter med fare, konsekvens og risikonivå
ALTER TABLE "RiskItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RiskItem" FORCE ROW LEVEL SECURITY;

-- Action — tiltak med ansvarlig og frister
ALTER TABLE "Action" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Action" FORCE ROW LEVEL SECURITY;

-- Department — avdelingsstruktur (lav sensitivitet, men inkluderes for konsistens)
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- Verifisering — kjør etter at SQL over er utført
-- ============================================================================
--
-- Verifiser at RLS er aktivert på alle tabeller:
--
--   SELECT tablename, rowsecurity, forcerowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY tablename;
--
-- Forventet: rowsecurity = true, forcerowsecurity = true for alle tabeller.
--
-- Test at anon ikke har tilgang (kjør som anon-rolle):
--   SET ROLE anon;
--   SELECT * FROM "Incident";   -- Forventer: 0 rader eller "permission denied"
--   RESET ROLE;
--
-- Test at postgres fortsatt har tilgang:
--   SELECT * FROM "Incident";   -- Forventer: normale data
--
-- ============================================================================

-- ── Valgfrie Storage-policies (dokumentasjon) ─────────────────────────────
--
-- Private buckets blokkerer allerede anon/authenticated.
-- Disse er eksplisitte og valgfrie — kjør kun hvis ønskelig:
--
-- CREATE POLICY "Ingen anon tilgang til incident-attachments"
--   ON storage.objects FOR ALL
--   TO anon
--   USING (false)
--   WITH CHECK (false);
--
-- CREATE POLICY "Ingen authenticated direkte tilgang til incident-attachments"
--   ON storage.objects FOR ALL
--   TO authenticated
--   USING (
--     bucket_id NOT IN ('incident-attachments', 'documents')
--   )
--   WITH CHECK (false);
--
-- Merk: service role bypasser storage RLS uansett.
-- Signerte URL-er generert server-side er upåvirket av storage policies.
--
-- ============================================================================

-- ── Angre alle RLS-endringer ──────────────────────────────────────────────
--
-- Hvis noe feiler etter aktivering, deaktiver midlertidig:
--
-- ALTER TABLE "Profile" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "PushSubscription" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "DocumentReadConfirmation" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Incident" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Attachment" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Document" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "LeaveRequest" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "AuditLog" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "RiskAssessment" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "RiskItem" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Action" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Department" DISABLE ROW LEVEL SECURITY;
--
-- ============================================================================

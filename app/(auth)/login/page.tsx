import { LoginForm } from "@/features/auth/LoginForm";

export const metadata = { title: "Logg inn – Truls HR" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col lg:items-center lg:justify-center bg-background">
      {/* ── Grønn topp ── */}
      <div className="bg-primary flex flex-col items-center justify-center gap-4 pt-16 pb-10 px-6 lg:rounded-t-3xl lg:w-full lg:max-w-sm">
        {/* Logo / initial */}
        <div className="w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center shadow-sm">
          <span className="text-2xl font-bold text-primary select-none">T</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Truls HR
          </h1>
          <p className="text-sm text-white/60 mt-0.5">Pulsfollo</p>
        </div>
      </div>

      {/* ── Hvit bunn ── */}
      <div className="flex-1 bg-card lg:bg-card px-6 pt-8 pb-12 lg:rounded-b-3xl lg:w-full lg:max-w-sm lg:shadow-xl lg:border lg:border-t-0 lg:flex-none">
        <p className="text-sm text-muted-foreground mb-6">Logg inn med e-post og passord, eller bruk Face ID.</p>
        <LoginForm />
      </div>
    </main>
  );
}

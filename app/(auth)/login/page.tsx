import { LoginForm } from "@/features/auth/LoginForm";

export const metadata = { title: "Logg inn – HR/HMS" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">HR / HMS Portalen</h1>
          <p className="text-sm text-muted-foreground">Logg inn med e-post og passord</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

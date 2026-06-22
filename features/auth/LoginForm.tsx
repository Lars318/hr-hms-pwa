"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Ugyldig e-postadresse"),
  password: z.string().min(6, "Passordet må være minst 6 tegn"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicEmail, setMagicEmail] = useState("");

  // Handle magic link / code redirects on the client side only
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      window.location.href = `/auth/callback?code=${code}&next=/dashboard`;
      return;
    }
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      router.replace("/auth/update-password" + hash);
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password }: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setServerError("Feil e-post eller passord.");
      return;
    }
    window.location.href = "/dashboard";
  }

  async function handleMagicLink() {
    if (!magicEmail) return;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setMagicLinkSent(true);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="navn@bedrift.no"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="password">Passord</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logger inn…" : "Logg inn"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">eller</span>
        </div>
      </div>

      {magicLinkSent ? (
        <p className="text-sm text-center text-muted-foreground">
          ✅ Sjekk e-posten din for en innloggingslenke.
        </p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="magic-email">Logg inn med magisk lenke</Label>
          <div className="flex gap-2">
            <Input
              id="magic-email"
              type="email"
              placeholder="navn@bedrift.no"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={handleMagicLink}>
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

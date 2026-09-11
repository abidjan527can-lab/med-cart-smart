import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | Jan Pharma SmartStock" },
      { name: "description", content: "Staff sign in for Jan Pharma SmartStock pharmacy management." },
      { property: "og:title", content: "Sign in | Jan Pharma SmartStock" },
      { property: "og:description", content: "Staff sign in for Jan Pharma SmartStock pharmacy management." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang, setLang } = useI18n();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/" });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand px-6 pb-10 pt-[max(3rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-sm text-primary-foreground">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Pill className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold">{t("appName")}</h1>
            <p className="text-xs opacity-85">{t("tagline")}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-sm rounded-3xl bg-card p-6 shadow-card">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm font-medium">
          <button
            onClick={() => setMode("in")}
            className={mode === "in" ? "rounded-lg bg-card py-2 shadow-card" : "py-2 text-muted-foreground"}
          >
            {t("signIn")}
          </button>
          <button
            onClick={() => setMode("up")}
            className={mode === "up" ? "rounded-lg bg-card py-2 shadow-card" : "py-2 text-muted-foreground"}
          >
            {t("signUp")}
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "up" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {mode === "up" ? t("signUp") : t("signIn")}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" size="lg" onClick={() => void google()}>
          {t("continueGoogle")}
        </Button>

        <button
          onClick={() => setLang(lang === "en" ? "ur" : "en")}
          className="mt-5 w-full text-center text-xs text-muted-foreground underline"
        >
          {lang === "en" ? "اردو میں دیکھیں" : "View in English"}
        </button>
      </div>
    </div>
  );
}

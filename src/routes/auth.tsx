import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — My Persona AI" },
      { name: "description", content: "Sign in or create your My Persona AI account." },
      { property: "og:title", content: "Sign in — My Persona AI" },
      { property: "og:description", content: "Sign in or create your My Persona AI account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/agents" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your inbox 💌 — confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/agents" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="film-page flex min-h-screen flex-col justify-center px-6 py-10"
      data-chapter="02"
    >
      <div className="film-panel mx-auto w-full max-w-md p-6 sm:p-9">
        <p className="film-kicker">ACT II · ARRIVAL GATE</p>
        <h1 className="film-title mt-5 text-4xl sm:text-5xl">
          {mode === "signup" ? "Create your access" : "Welcome back"}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {mode === "signup"
            ? "We'll send a quick confirmation email."
            : "The city has kept your lights on."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-md border border-input bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-primary focus:shadow-[0_0_24px_-6px_var(--neon)]"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-md border border-input bg-black/20 px-4 py-3 text-sm outline-none transition focus:border-primary focus:shadow-[0_0_24px_-6px_var(--neon)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-primary w-full rounded-md py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Authorising…" : mode === "signup" ? "Create access" : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </main>
  );
}

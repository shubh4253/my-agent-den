import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Say hello — My Persona AI" },
      { name: "description", content: "Tell your companions what to call you." },
      { property: "og:title", content: "Say hello — My Persona AI" },
      { property: "og:description", content: "Tell your companions what to call you." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, onboarded")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (data?.onboarded) navigate({ to: "/agents" });
      else if (data?.display_name) setName(data.display_name);
    })();
  }, [navigate]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again");
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: auth.user.id, display_name: name.trim(), onboarded: true });
      if (error) throw error;
      navigate({ to: "/agents" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="surface-card p-6 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="mt-3 text-2xl font-semibold">What should we call you?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your companions will use this name every time you talk 💛
        </p>
        <form onSubmit={save} className="mt-6 space-y-3">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-center text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={saving}
            className="gradient-primary w-full rounded-full py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Let's go ✨"}
          </button>
        </form>
      </div>
    </main>
  );
}

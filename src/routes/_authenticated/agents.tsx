import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, emojiFor, defaultName, type RoleDef } from "@/lib/agent-roles";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/agents")({
  head: () => ({
    meta: [
      { title: "Your companions — My Persona AI" },
      { name: "description", content: "Pick a companion to train or chat with." },
      { property: "og:title", content: "Your companions — My Persona AI" },
      { property: "og:description", content: "Pick a companion to train or chat with." },
    ],
  }),
  component: AgentsPage,
});

type AgentRow = {
  id: string;
  role: string;
  name: string;
  gender: string | null;
  emoji: string;
};

function AgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, onboarded")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (!profile?.onboarded) {
        navigate({ to: "/onboarding" });
        return;
      }
      setDisplayName(profile.display_name ?? "");
      const { data } = await supabase
        .from("agents")
        .select("id, role, name, gender, emoji")
        .order("created_at");
      setAgents(data ?? []);
    })();
  }, [navigate]);

  async function ensureAgent(role: RoleDef, gender?: "female" | "male") {
    const existing = agents.find(
      (a) => a.role === role.key && (!role.needsGender || a.gender === (gender ?? null)),
    );
    if (existing) return existing;
    if (!userId) throw new Error("Please sign in again");
    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: userId,
        role: role.key,
        name: defaultName(role.key, gender),
        gender: gender ?? null,
        emoji: emojiFor(role.key, gender),
      })
      .select("id, role, name, gender, emoji")
      .single();
    if (error) throw error;
    setAgents((prev) => [...prev, data]);
    return data;
  }

  async function go(role: RoleDef, dest: "train" | "chat", gender?: "female" | "male") {
    setBusy(role.key + (gender ?? ""));
    try {
      const agent = await ensureAgent(role, gender);
      if (dest === "train") navigate({ to: "/train/$agentId", params: { agentId: agent.id } });
      else navigate({ to: "/chat/$agentId", params: { agentId: agent.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const cards: { role: RoleDef; gender?: "female" | "male"; label: string }[] = ROLES.flatMap((r) =>
    r.needsGender
      ? [
          { role: r, gender: "female" as const, label: "Best Friend (she)" },
          { role: r, gender: "male" as const, label: "Best Friend (he)" },
        ]
      : [{ role: r, label: r.label }],
  );

  return (
    <main className="relative mx-auto max-w-2xl px-5 pb-16 pt-8">
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-1/2 grid-floor" />
      <header className="relative flex items-start justify-between gap-3">
        <div>
          <p className="label-mono">console · resident {displayName || "friend"}</p>
          <h1 className="mt-1 text-3xl font-semibold">Who do you want to talk to?</h1>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
        >
          Sign out
        </button>
      </header>

      <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map(({ role, gender, label }) => {
          const key = role.key + (gender ?? "");
          return (
            <article
              key={key}
              className="glass-panel relative flex flex-col overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:neon-edge"
            >
              <span className="animate-scan pointer-events-none absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
              <div className="text-4xl">{emojiFor(role.key, gender)}</div>
              <h2 className="mt-2 text-lg font-semibold">{label}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{role.tagline}</p>
              <div className="mt-4 flex gap-2">
                <button
                  disabled={busy === key}
                  onClick={() => go(role, "train", gender)}
                  className="flex-1 rounded-full border border-primary/40 bg-secondary px-3 py-2.5 text-xs font-bold text-foreground disabled:opacity-60"
                >
                  Train Agent 🧠
                </button>
                <button
                  disabled={busy === key}
                  onClick={() => go(role, "chat", gender)}
                  className="gradient-primary flex-1 rounded-full px-3 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
                >
                  Start Chat 💬
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Tip: the more you add in the Memory Vault, the more they sound like they truly know you.{" "}
        <Link to="/" className="font-semibold underline">
          About
        </Link>
      </p>
    </main>
  );
}

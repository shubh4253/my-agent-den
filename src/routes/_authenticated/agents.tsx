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

  const cards: { role: RoleDef; gender?: "female" | "male"; label: string }[] = ROLES.flatMap(
    (r) =>
      r.needsGender
        ? [
            { role: r, gender: "female" as const, label: "Best Friend (she)" },
            { role: r, gender: "male" as const, label: "Best Friend (he)" },
          ]
        : [{ role: r, label: r.label }],
  );

  return (
    <main className="film-page min-h-screen w-full px-5 pb-16 pt-8" data-chapter="04">
      <header className="mx-auto flex w-full max-w-5xl items-start justify-between gap-3">
        <div>
          <p className="film-kicker">ACT IV · THE CAST · {displayName || "FRIEND"}</p>
          <h1 className="film-title mt-3 text-4xl sm:text-5xl">Who enters the story?</h1>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="rounded-md border border-border bg-black/15 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <div className="mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ role, gender, label }, index) => {
          const key = role.key + (gender ?? "");
          return (
            <article key={key} className="cast-card relative flex flex-col overflow-hidden p-5">
              <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
                <span className="film-kicker">TAKE {String(index + 1).padStart(2, "0")}</span>
                <span aria-hidden="true" className="text-xs text-accent">
                  ✦
                </span>
              </div>
              <div className="text-4xl">{emojiFor(role.key, gender)}</div>
              <h2 className="mt-3 font-display text-xl">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{role.tagline}</p>
              <div className="mt-auto flex gap-2 pt-5">
                <button
                  disabled={busy === key}
                  onClick={() => go(role, "train", gender)}
                  className="flex-1 rounded-md border border-border bg-black/10 px-3 py-2.5 text-xs font-semibold text-foreground transition hover:border-primary/60 disabled:opacity-60"
                >
                  Train Agent 🧠
                </button>
                <button
                  disabled={busy === key}
                  onClick={() => go(role, "chat", gender)}
                  className="gradient-primary flex-1 rounded-md px-3 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
                >
                  Start Chat 💬
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-5xl items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <span className="film-kicker">EVERY STORY BEGINS HERE</span>
        <Link to="/" className="transition hover:text-primary">
          About
        </Link>
      </div>
    </main>
  );
}

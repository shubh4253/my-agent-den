import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/train/$agentId")({
  head: () => ({
    meta: [
      { title: "Memory Vault — My Persona AI" },
      { name: "description", content: "Train your companion with the details that make you, you." },
      { property: "og:title", content: "Memory Vault — My Persona AI" },
      {
        property: "og:description",
        content: "Train your companion with the details that make you, you.",
      },
    ],
  }),
  component: TrainPage,
});

type FieldKey =
  | "non_negotiables"
  | "origin_story"
  | "future_vision"
  | "communication_style"
  | "love_language"
  | "pet_peeves"
  | "insecurities"
  | "guilty_pleasures"
  | "dark_days_protocol"
  | "health_notes"
  | "financial_stance"
  | "extra_notes";

const SECTIONS: {
  title: string;
  emoji: string;
  fields: { key: FieldKey; label: string; hint: string }[];
}[] = [
  {
    title: "Core Identity",
    emoji: "🌱",
    fields: [
      { key: "non_negotiables", label: "Non-negotiables", hint: "Values you'd never trade away" },
      { key: "origin_story", label: "Origin story", hint: "Where you come from, what shaped you" },
      { key: "future_vision", label: "5-10 year vision", hint: "The life you're building" },
    ],
  },
  {
    title: "User Manual",
    emoji: "📖",
    fields: [
      {
        key: "communication_style",
        label: "Communication style",
        hint: "How you like to be talked to",
      },
      { key: "love_language", label: "Love / friendship language", hint: "How you feel cared for" },
      { key: "pet_peeves", label: "Pet peeves & triggers", hint: "What to avoid" },
    ],
  },
  {
    title: "Day-to-Day",
    emoji: "☀️",
    fields: [
      { key: "insecurities", label: "Insecurities", hint: "Be gentle here — so they can be too" },
      {
        key: "guilty_pleasures",
        label: "Guilty pleasures",
        hint: "Comfort shows, snacks, playlists",
      },
      {
        key: "dark_days_protocol",
        label: "Dark days protocol",
        hint: "What helps when things get heavy",
      },
    ],
  },
  {
    title: "Logistics & Safety",
    emoji: "🛟",
    fields: [
      {
        key: "health_notes",
        label: "Health / allergies",
        hint: "Anything they should keep in mind",
      },
      {
        key: "financial_stance",
        label: "Financial & life stance",
        hint: "How you approach money and risk",
      },
      {
        key: "extra_notes",
        label: "Anything else about you",
        hint: "Add whatever else you want them to know ✨",
      },
    ],
  },
];

function TrainPage() {
  const { agentId } = useParams({ from: "/_authenticated/train/$agentId" });
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});
  const [agent, setAgent] = useState<{ name: string; emoji: string } | null>(null);
  const [open, setOpen] = useState<string | null>(SECTIONS[0]!.title);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: m }] = await Promise.all([
        supabase.from("agents").select("name, emoji").eq("id", agentId).maybeSingle(),
        supabase.from("agent_memories").select("*").eq("agent_id", agentId).maybeSingle(),
      ]);
      if (a) setAgent(a);
      if (m) {
        const next: Record<string, string> = {};
        for (const s of SECTIONS)
          for (const f of s.fields) next[f.key] = (m as Record<string, string | null>)[f.key] ?? "";
        setValues(next);
      }
    })();
  }, [agentId]);

  async function save() {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Please sign in again");
      const { error } = await supabase
        .from("agent_memories")
        .upsert(
          { agent_id: agentId, user_id: auth.user.id, ...values },
          { onConflict: "agent_id" },
        );
      if (error) throw error;
      toast.success("Saved 💾 they know you a little better now");
      navigate({ to: "/chat/$agentId", params: { agentId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="film-page min-h-screen w-full px-5 pb-28 pt-6" data-chapter="05">
      <button
        onClick={() => navigate({ to: "/agents" })}
        className="mx-auto flex w-full max-w-3xl film-kicker transition hover:text-foreground"
      >
        ← BACK TO THE CAST
      </button>

      <div className="mx-auto mt-6 flex w-full max-w-3xl items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-3xl">
          {agent?.emoji ?? "🧠"}
        </div>
        <div>
          <p className="film-kicker">ACT V · CHARACTER NOTES</p>
          <h1 className="film-title mt-2 text-3xl sm:text-4xl">
            Train {agent?.name ?? "your companion"}
          </h1>
        </div>
      </div>

      <div className="film-panel mx-auto mt-6 w-full max-w-3xl p-4 text-sm leading-relaxed">
        <span className="film-kicker mb-2 block">DIRECTOR'S NOTE</span>
        💡 The more honestly you fill this in, the more your companion sounds like someone who truly
        knows you. Nothing here is shared — it's yours alone, and you can edit it anytime.
      </div>

      <div className="mx-auto mt-6 w-full max-w-3xl space-y-3">
        {SECTIONS.map((s) => {
          const isOpen = open === s.title;
          return (
            <section key={s.title} className="film-panel overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : s.title)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-primary/5"
              >
                <span className="font-semibold">
                  {s.emoji} {s.title}
                </span>
                <span className="text-muted-foreground">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="space-y-4 px-5 pb-5">
                  {s.fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className="text-sm font-semibold">{f.label}</span>
                      <span className="block text-xs text-muted-foreground">{f.hint}</span>
                      <textarea
                        rows={3}
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        className="mt-1.5 w-full rounded-md border border-input bg-black/20 px-4 py-3 text-sm outline-none focus:border-primary"
                      />
                    </label>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 py-3 backdrop-blur-xl">
        <button
          onClick={save}
          disabled={saving}
          className="gradient-primary mx-auto block w-full max-w-3xl rounded-md py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save & start chatting 💬"}
        </button>
      </div>
    </main>
  );
}

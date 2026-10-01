import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendChatMessage, visibleText } from "@/lib/chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/$agentId")({
  head: () => ({
    meta: [
      { title: "Chat — My Persona AI" },
      { name: "description", content: "Talk with a companion who remembers who you are." },
      { property: "og:title", content: "Chat — My Persona AI" },
      { property: "og:description", content: "Talk with a companion who remembers who you are." },
    ],
  }),
  component: ChatPage,
});

type Msg = { id: string; role: string; content: string; chips?: string[] | null };

function ChatPage() {
  const { agentId } = useParams({ from: "/_authenticated/chat/$agentId" });
  const navigate = useNavigate();
  const [agent, setAgent] = useState<{ name: string; emoji: string } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: m }] = await Promise.all([
        supabase.from("agents").select("name, emoji").eq("id", agentId).maybeSingle(),
        supabase
          .from("messages")
          .select("id, role, content, chips")
          .eq("agent_id", agentId)
          .order("created_at"),
      ]);
      if (a) setAgent(a);
      setMessages(
        (m ?? []).map((x) => ({
          id: x.id,
          role: x.role,
          content: x.content,
          chips: Array.isArray(x.chips) ? (x.chips as string[]) : [],
        })),
      );
    })();
  }, [agentId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function submit(text: string) {
    const body = text.trim();
    if (!body || sending) return;
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: "user", content: body, chips: [] },
    ]);
    const streamId = `stream-${Date.now()}`;
    try {
      const reply = await sendChatMessage({ agentId, message: body }, (raw) => {
        const text = visibleText(raw);
        if (!text) return;
        setMessages((prev) => {
          const i = prev.findIndex((m) => m.id === streamId);
          const msg = { id: streamId, role: "assistant", content: text, chips: [] };
          if (i === -1) return [...prev, msg];
          const next = prev.slice();
          next[i] = msg;
          return next;
        });
      });
      if (reply)
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== streamId),
          {
            id: reply.id,
            role: "assistant",
            content: reply.content,
            chips: Array.isArray(reply.chips) ? reply.chips : [],
          },
        ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== streamId));
      toast.error(err instanceof Error ? err.message : "Message failed");
    } finally {
      setSending(false);
    }
  }

  const lastChips =
    messages.length && messages[messages.length - 1]!.role === "assistant"
      ? (messages[messages.length - 1]!.chips ?? [])
      : [];

  return (
    <main className="film-page flex h-[100dvh] w-full flex-col px-4" data-chapter="06">
      <header className="mx-auto flex w-full max-w-3xl items-center gap-3 border-b border-border/70 px-1 py-4">
        <button
          onClick={() => navigate({ to: "/agents" })}
          aria-label="Back to companions"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border bg-black/15 text-lg transition hover:border-primary/60"
        >
          ←
        </button>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-2xl">
          {agent?.emoji ?? "💬"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="film-kicker">ACT VI · DIALOGUE</p>
          <h1 className="mt-1 truncate font-display text-xl">{agent?.name ?? "Companion"}</h1>
        </div>
        <button
          onClick={() => navigate({ to: "/train/$agentId", params: { agentId } })}
          className="rounded-md border border-border bg-black/10 px-3 py-2 text-xs font-semibold transition hover:border-primary/60"
        >
          Train 🧠
        </button>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 overflow-y-auto px-1 py-5">
        {messages.length === 0 && (
          <div className="film-panel mx-auto mt-12 max-w-lg p-8 text-center text-sm text-muted-foreground">
            <p className="film-kicker">A QUIET MOMENT BEFORE THE SCENE</p>
            <div className="mt-5 text-5xl">{agent?.emoji ?? "✨"}</div>
            <p className="mt-4 leading-relaxed">
              Say hi — they've been waiting to hear from you 💫
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex items-end gap-3"}
          >
            {m.role !== "user" && (
              <span className="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-primary/25 bg-primary/10 text-lg">
                {agent?.emoji ?? "✨"}
              </span>
            )}
            <div
              className={
                m.role === "user"
                  ? "film-bubble-user max-w-[86%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed"
                  : "film-bubble-assistant max-w-[86%] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && messages[messages.length - 1]?.role === "user" && (
          <p className="film-kicker pl-11">IN THE MOMENT…</p>
        )}
        <div ref={endRef} />
      </div>

      {lastChips.length > 0 && !sending && (
        <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-2 px-1 pb-3">
          {lastChips.map((c) => (
            <button
              key={c}
              onClick={() => submit(c)}
              className="rounded-md border border-primary/35 bg-secondary/80 px-3 py-2 text-xs font-semibold transition hover:border-primary/70 hover:bg-secondary"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="mx-auto mb-4 flex w-full max-w-3xl items-center gap-2 rounded-md border border-border bg-black/20 p-2 shadow-[var(--shadow-soft)]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-3 py-3 text-sm outline-none focus:border-primary/40"
        />
        <button
          type="submit"
          disabled={sending}
          className="gradient-primary rounded-md px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </main>
  );
}

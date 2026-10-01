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
    <main className="mx-auto flex h-[100dvh] max-w-xl flex-col">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => navigate({ to: "/agents" })} className="text-lg">
          ←
        </button>
        <span className="text-2xl">{agent?.emoji ?? "💬"}</span>
        <div className="flex-1">
          <h1 className="text-base font-semibold leading-tight">{agent?.name ?? "Companion"}</h1>
          <p className="text-[11px] text-muted-foreground">always here for you 💛</p>
        </div>
        <button
          onClick={() => navigate({ to: "/train/$agentId", params: { agentId } })}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
        >
          Train 🧠
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="surface-card p-5 text-center text-sm text-muted-foreground">
            <div className="text-4xl">{agent?.emoji ?? "✨"}</div>
            <p className="mt-2">Say hi — they've been waiting to hear from you 💫</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex items-end gap-2"}
          >
            {m.role !== "user" && <span className="mb-1 text-xl">{agent?.emoji ?? "✨"}</span>}
            <div
              className={
                m.role === "user"
                  ? "gradient-primary max-w-[80%] whitespace-pre-wrap rounded-3xl rounded-br-lg px-4 py-2.5 text-sm text-primary-foreground"
                  : "max-w-[80%] whitespace-pre-wrap rounded-3xl rounded-bl-lg bg-secondary px-4 py-2.5 text-sm"
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && messages[messages.length - 1]?.role === "user" && (
          <p className="pl-9 text-xs text-muted-foreground">typing…</p>
        )}
        <div ref={endRef} />
      </div>

      {lastChips.length > 0 && !sending && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {lastChips.map((c) => (
            <button
              key={c}
              onClick={() => submit(c)}
              className="rounded-full border border-primary/40 bg-secondary px-3 py-1.5 text-xs font-semibold"
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
        className="flex items-center gap-2 border-t border-border px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={sending}
          className="gradient-primary rounded-full px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </main>
  );
}

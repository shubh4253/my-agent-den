import { supabase } from "@/integrations/supabase/client";

type ChatReply = { id: string; role: string; content: string; chips?: string[] | null };

/** Strips a trailing (possibly partial) "CHIPS:" line so it never shows in the bubble. */
export function visibleText(raw: string): string {
  const i = raw.search(/\n?\s*C(H(I(P(S(:.*)?)?)?)?)?\s*$/i);
  const cut = raw.search(/CHIPS:/i);
  if (cut !== -1) return raw.slice(0, cut).trimEnd();
  // Hide a partially-arrived "CHIPS" token at the very end of a line.
  if (i !== -1 && /\n\s*C\w*$/i.test(raw.slice(Math.max(0, i - 1)))) return raw.slice(0, i).trimEnd();
  return raw;
}

export async function sendChatMessage(
  input: { agentId: string; message: string },
  onDelta?: (fullRawText: string) => void,
): Promise<ChatReply | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Please sign in to send a message.");

  const url = `${import.meta.env["VITE_SUPABASE_URL"]}/functions/v1/send-chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
    },
    body: JSON.stringify(input),
  });

  if (!res.ok || !res.body) {
    let msg = `Message failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let raw = "";
  let final: ChatReply | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = block.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      const evt = JSON.parse(line.slice(5).trim());
      if (evt.type === "delta") {
        raw += evt.text;
        onDelta?.(raw);
      } else if (evt.type === "done") {
        final = evt.message;
      } else if (evt.type === "error") {
        throw new Error(evt.error || "Message failed");
      }
    }
  }

  if (!final) throw new Error("The reply was interrupted. Please try again.");
  return final;
}

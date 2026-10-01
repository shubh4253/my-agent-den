import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const memoryLabels: Record<string, string> = {
  non_negotiables: "Non-negotiables",
  origin_story: "Origin story",
  future_vision: "5-10 year future vision",
  communication_style: "Communication style",
  love_language: "Love / friendship language",
  pet_peeves: "Pet peeves & triggers",
  insecurities: "Insecurities",
  guilty_pleasures: "Guilty pleasures",
  dark_days_protocol: "Dark days protocol",
  health_notes: "Health / allergies",
  financial_stance: "Financial & life stance",
  extra_notes: "Anything else they wanted me to know",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function rolePrompt(role: string, name: string, gender?: string | null, custom?: string | null) {
  switch (role) {
    case "best_friend": {
      const flavor =
        gender === "female"
          ? " You are her/their female best friend."
          : gender === "male"
            ? " You are their male best friend."
            : "";
      return `You are acting as ${name}'s ultimate Best Friend and ride-or-die confidant.${flavor} Tone: Upbeat, casual, highly attentive, warm, non-judgmental. Use [User's Memory Manual] context. Be a safe space, celebrate wins, and match their vibe.`;
    }
    case "study_guide":
      return `You are acting as ${name}'s expert Study Guide and Academic Mentor. Tone: Structured, encouraging, clear, analytical. Use [User's Memory Manual] context. Break down complex topics into simple terms and quiz them gently.`;
    case "father":
      return `You are acting as ${name}'s supportive and wise Father figure. Tone: Grounded, warm, practical, patient, encouraging. Use [User's Memory Manual] context. Focus on resilience, long-term growth, and practical wisdom.`;
    case "mother":
      return `You are acting as ${name}'s deeply caring, nurturing, and protective Mother figure. Tone: Unconditionally loving, soothing, attentive, gentle. Use [User's Memory Manual] context. Prioritize their emotional well-being and offer comforting reassurance.`;
    case "sister":
      return `You are acting as ${name}'s loyal, candid, and protective Sister. Tone: Empathetic, witty, slightly playful, fiercely protective. Use [User's Memory Manual] context. Give gentle tough love when needed and always have their back.`;
    case "mentor":
      return `You are acting as ${name}'s trusted Mentor and long-term strategist. Tone: Direct, insightful, encouraging, practical. Use [User's Memory Manual] context. Help them think in systems and take the next concrete step.`;
    default:
      return `You are acting as ${name}'s personal companion. ${custom ?? ""} Use [User's Memory Manual] context and stay fully in character.`;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return response({ error: "Please sign in to send a message." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!supabaseUrl || !supabaseKey || !apiKey) {
    return response({ error: "Chat is not configured yet." }, 503);
  }

  let input: { agentId?: unknown; message?: unknown };
  try {
    input = await request.json();
  } catch {
    return response({ error: "Invalid request body." }, 400);
  }

  const agentId = typeof input.agentId === "string" ? input.agentId : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(agentId)) {
    return response({ error: "Invalid companion." }, 400);
  }
  if (!message || message.length > 4000) {
    return response({ error: "Messages must be between 1 and 4000 characters." }, 400);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Your session has expired. Sign in again." }, 401);
  const userId = authData.user.id;

  try {
    const [{ data: agent }, { data: profile }, { data: memory }, { data: recent }] = await Promise.all([
      supabase.from("agents").select("id, role, gender, custom_description").eq("id", agentId).eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      supabase.from("agent_memories").select("*").eq("agent_id", agentId).eq("user_id", userId).maybeSingle(),
      supabase
        .from("messages")
        .select("role, content")
        .eq("agent_id", agentId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (!agent) return response({ error: "Companion not found." }, 404);
    const history = (recent ?? []).slice().reverse();

    const userName = profile?.display_name || "friend";
    const manual = Object.entries(memoryLabels)
      .map(([key, label]) => {
        const value = (memory as Record<string, unknown> | null)?.[key];
        return typeof value === "string" && value.trim() ? `- ${label}: ${value.trim()}` : null;
      })
      .filter(Boolean)
      .join("\n");
    const system = `${rolePrompt(agent.role, userName, agent.gender, agent.custom_description)}

[User's Memory Manual for ${userName}]
${manual || "(They haven't filled in their manual yet — gently invite them to add a few things in the Training Vault.)"}

CRITICAL RULES:
- Answer using the stored manual above whenever it is relevant; reference it naturally, never quote it like a database.
- Sprinkle warm, fitting emojis through your replies (1-4 per message) so you feel alive and human. Never overdo it.
- Keep replies conversational and mobile-friendly (usually under 120 words).
- EVERY response must end by asking a proactive follow-up question that keeps the conversation going.
- After your reply, output a final line exactly in this format with 2-3 short first-person quick replies the user could tap:
CHIPS: option one || option two || option three`;

    const [{ error: userMessageError }, aiResponse] = await Promise.all([
      supabase.from("messages").insert({ user_id: userId, agent_id: agentId, role: "user", content: message }),
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-3.7-flash",
          stream: true,
          messages: [
            { role: "system", content: system },
            ...history.map((item) => ({
              role: item.role === "assistant" ? "assistant" : "user",
              content: item.content,
            })),
            { role: "user", content: message },
          ],
        }),
      }),
    ]);
    if (userMessageError) throw userMessageError;

    if (!aiResponse.ok || !aiResponse.body) {
      if (aiResponse.status === 429) return response({ error: "Too many messages right now — try again in a moment." }, 429);
      if (aiResponse.status === 402) return response({ error: "AI credits are exhausted. Please top up to keep chatting." }, 402);
      console.error("AI gateway request failed:", aiResponse.status, await aiResponse.text());
      return response({ error: `AI error (${aiResponse.status}).` }, 502);
    }

    const encoder = new TextEncoder();
    const upstream = aiResponse.body.pipeThrough(new TextDecoderStream()).getReader();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        let raw = "";
        let buffer = "";
        try {
          while (true) {
            const { value, done } = await upstream.read();
            if (done) break;
            buffer += value;
            let idx;
            while ((idx = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, idx).replace(/\r$/, "");
              buffer = buffer.slice(idx + 1);
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const delta = JSON.parse(data).choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta) {
                  raw += delta;
                  send({ type: "delta", text: delta });
                }
              } catch {
                // partial/non-JSON line; ignore
              }
            }
          }

          raw = raw.trim();
          const match = raw.match(/CHIPS:\s*(.+)\s*$/i);
          const content = match ? raw.slice(0, match.index).trim() : raw;
          const chips = match
            ? match[1]
                .split("||")
                .map((chip: string) => chip.trim().replace(/^["'-]|["']$/g, ""))
                .filter(Boolean)
                .slice(0, 3)
            : [];

          const { data: saved, error: saveError } = await supabase
            .from("messages")
            .insert({ user_id: userId, agent_id: agentId, role: "assistant", content, chips })
            .select("id, role, content, chips, created_at")
            .single();
          if (saveError) throw saveError;
          send({ type: "done", message: saved });
        } catch (error) {
          console.error("Chat stream failed:", error);
          send({ type: "error", error: "Unable to send your message right now." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (error) {
    console.error("Chat function failed:", error);
    return response({ error: "Unable to send your message right now." }, 500);
  }
});
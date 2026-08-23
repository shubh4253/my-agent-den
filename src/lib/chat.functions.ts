import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  agentId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

const MEMORY_LABELS: Record<string, string> = {
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

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: agent }, { data: profile }, { data: memory }] = await Promise.all([
      supabase.from("agents").select("*").eq("id", data.agentId).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
      supabase.from("agent_memories").select("*").eq("agent_id", data.agentId).maybeSingle(),
    ]);
    if (!agent) throw new Error("Companion not found");

    const userName = profile?.display_name || "friend";

    const manual = Object.entries(MEMORY_LABELS)
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

    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("agent_id", data.agentId)
      .order("created_at", { ascending: true })
      .limit(40);

    await supabase.from("messages").insert({
      user_id: userId,
      agent_id: data.agentId,
      role: "user",
      content: data.message,
    });

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured yet.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: system },
          ...(history ?? []).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
          { role: "user", content: data.message },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429) throw new Error("Too many messages right now — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are exhausted. Please top up to keep chatting.");
      throw new Error(`AI error (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "";

    let content = raw;
    let chips: string[] = [];
    const match = raw.match(/CHIPS:\s*(.+)\s*$/i);
    if (match) {
      content = raw.slice(0, match.index).trim();
      chips = match[1]!
        .split("||")
        .map((c) => c.trim().replace(/^["'-]|["']$/g, ""))
        .filter(Boolean)
        .slice(0, 3);
    }

    const { data: saved } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        agent_id: data.agentId,
        role: "assistant",
        content,
        chips,
      })
      .select("id, role, content, chips, created_at")
      .single();

    return saved;
  });

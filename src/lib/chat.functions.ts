import { supabase } from "@/integrations/supabase/client";

type ChatReply = { id: string; role: string; content: string; chips?: string[] | null };

export async function sendChatMessage(input: {
  agentId: string;
  message: string;
}): Promise<ChatReply | null> {
  const { data, error } = await supabase.functions.invoke<ChatReply>("send-chat", {
    body: input,
  });

  if (error) throw error;
  return data;
}

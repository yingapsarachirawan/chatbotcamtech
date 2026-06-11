import { supabase } from "../lib/supabaseClient";

export async function ensureChatUser() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (session?.user) {
    return session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function createChatSession(title = "New chat") {
  await ensureChatUser();

  const { data, error } = await supabase
    .from("chatbot_sessions")
    .insert({
      title,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getLatestChatSession() {
  await ensureChatUser();

  const { data, error } = await supabase
    .from("chatbot_sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getChatMessages(sessionId) {
  await ensureChatUser();

  const { data, error } = await supabase
    .from("chatbot_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function saveChatMessage({
  sessionId,
  sender,
  message,
  suggestedQuestions = [],
}) {
  await ensureChatUser();

  const { data, error } = await supabase
    .from("chatbot_messages")
    .insert({
      session_id: sessionId,
      sender,
      message,
      suggested_questions: suggestedQuestions,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from("chatbot_sessions")
    .update({
      updated_at: new Date().toISOString(),
      title: message.slice(0, 60) || "New chat",
    })
    .eq("id", sessionId);

  return data;
}

export async function loadOrCreateChatSession() {
  const existingSession = await getLatestChatSession();

  if (existingSession) {
    const messages = await getChatMessages(existingSession.id);

    return {
      session: existingSession,
      messages,
    };
  }

  const session = await createChatSession();

  return {
    session,
    messages: [],
  };
}

export async function startNewChatSession() {
  const session = await createChatSession();

  return {
    session,
    messages: [],
  };
}
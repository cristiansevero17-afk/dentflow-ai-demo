function hasDatabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseBaseUrl() {
  return String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
}

async function supabaseRequest(path, options = {}) {
  const baseUrl = getSupabaseBaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceKey) {
    throw new Error("Database non configurato: mancano SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`Supabase error ${response.status}: ${text.slice(0, 300)}`);
  }

  return payload;
}

async function getProductState() {
  if (!hasDatabaseConfig()) {
    return { configured: false, state: null, updatedAt: null };
  }

  const rows = await supabaseRequest("product_state?id=eq.main&select=data,updated_at&limit=1", {
    method: "GET",
  });

  const row = Array.isArray(rows) ? rows[0] : null;
  return {
    configured: true,
    state: row?.data || null,
    updatedAt: row?.updated_at || null,
  };
}

async function saveProductState(state) {
  if (!hasDatabaseConfig()) {
    return { configured: false, updatedAt: null };
  }

  const rows = await supabaseRequest("product_state?on_conflict=id", {
    method: "POST",
    body: JSON.stringify({
      id: "main",
      data: state,
      updated_at: new Date().toISOString(),
    }),
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
  });

  const row = Array.isArray(rows) ? rows[0] : null;
  return { configured: true, updatedAt: row?.updated_at || null };
}

async function appendWhatsAppEvent(event) {
  if (!hasDatabaseConfig()) {
    return { configured: false };
  }

  await supabaseRequest("whatsapp_events", {
    method: "POST",
    body: JSON.stringify({
      id: event.id,
      from_phone: event.fromPhone,
      patient_name: event.patientName,
      message_text: event.messageText,
      analysis: event.analysis || {},
      action: event.action || "",
      reply: event.reply || "",
      sent: Boolean(event.sent),
      error: event.error || null,
      created_at: event.createdAt || new Date().toISOString(),
    }),
  });

  return { configured: true };
}

module.exports = {
  appendWhatsAppEvent,
  getProductState,
  hasDatabaseConfig,
  saveProductState,
};

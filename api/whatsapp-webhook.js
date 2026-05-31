const { analyzeIncomingMessage } = require("./analyze-message");
const { sendWhatsAppText } = require("./whatsapp-send");

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return await new Promise((resolve) => {
    let raw = "";
    req.on?.("data", (chunk) => {
      raw += chunk;
    });
    req.on?.("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        resolve({});
      }
    });
    req.on?.("error", () => resolve({}));
  });
}

function extractWhatsAppMessages(payload) {
  const entries = Array.isArray(payload?.entry) ? payload.entry : [];
  const messages = [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value || {};
      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      const incoming = Array.isArray(value.messages) ? value.messages : [];
      for (const message of incoming) {
        const waId = message.from || contacts[0]?.wa_id || "";
        const profileName = contacts.find((contact) => contact.wa_id === waId)?.profile?.name || contacts[0]?.profile?.name || waId || "Paziente WhatsApp";
        const text = message.text?.body || "";
        if (text) {
          messages.push({
            id: message.id,
            from: waId,
            patientName: profileName,
            text,
            timestamp: message.timestamp,
          });
        }
      }
    }
  }

  return messages;
}

async function handler(req, res) {
  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];

    if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    }

    res.status(403).json({ error: "Webhook verification failed" });
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const messages = extractWhatsAppMessages(payload);
    const processed = [];

    for (const message of messages) {
      const analysisResult = await analyzeIncomingMessage({
        message: message.text,
        patientName: message.patientName,
        context: {
          source: "whatsapp-cloud-webhook",
          whatsappFrom: message.from,
          note: "Collegare qui database pazienti e agenda per modifiche persistenti.",
        },
      });

      const reply = analysisResult.analysis?.reply;
      let sent = false;
      let sendError = null;

      if (reply && process.env.WHATSAPP_AUTOREPLY !== "false") {
        try {
          await sendWhatsAppText({ to: message.from, text: reply });
          sent = true;
        } catch (error) {
          sendError = error.message || "Invio non riuscito";
        }
      }

      processed.push({
        messageId: message.id,
        from: message.from,
        patientName: message.patientName,
        intent: analysisResult.analysis?.intent,
        intentLabel: analysisResult.analysis?.intentLabel,
        reply,
        sent,
        sendError,
        usedGemini: analysisResult.usedGemini,
      });
    }

    res.status(200).json({ ok: true, processed });
  } catch (error) {
    res.status(200).json({ ok: false, error: error.message || "Webhook non elaborato" });
  }
}

module.exports = handler;

const { analyzeIncomingMessage } = require("./analyze-message");
const {
  appendWhatsAppEvent,
  getProductState,
  saveProductState,
} = require("./_product-store");
const {
  ensurePatient,
  updateStateForIncomingMessage,
} = require("./_product-engine");
const { maybeSendWhatsAppText } = require("./whatsapp-send");

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
      const stateResult = await getProductState();
      let state = stateResult.state;
      if (!state) {
        const reply = "Sistema in configurazione: l'agenda dello studio non e' ancora collegata. Riprova piu' tardi.";
        const sendResult = await maybeSendWhatsAppText({ to: message.from, text: reply });
        processed.push({
          messageId: message.id,
          from: message.from,
          patientName: message.patientName,
          intent: "configurazione_mancante",
          reply,
          sent: !sendResult.dryRun,
          dryRun: sendResult.dryRun,
          error: "Database vuoto: apri /prodotto una volta o salva lo stato iniziale.",
        });
        continue;
      }

      const patientResult = ensurePatient(state, message.from, message.patientName);
      state = patientResult.state;
      const patient = patientResult.patient;
      const analysisResult = await analyzeIncomingMessage({
        message: message.text,
        patientName: patient.name,
        context: {
          source: "whatsapp-cloud-webhook",
          whatsappFrom: message.from,
          appointments: (state.appointments || []).filter((appointment) => appointment.patientId === patient.id),
          conversation: state.conversations?.[patient.id] || null,
        },
      });

      const operation = updateStateForIncomingMessage({
        state,
        patient,
        messageText: message.text,
        analysis: analysisResult.analysis || {},
      });
      state = operation.state;

      let sent = false;
      let dryRun = true;
      let sendError = null;
      const outbound = [];

      if (operation.reply && process.env.WHATSAPP_AUTOREPLY !== "false") {
        try {
          const sendResult = await maybeSendWhatsAppText({ to: message.from, text: operation.reply });
          sent = !sendResult.dryRun;
          dryRun = Boolean(sendResult.dryRun);
          outbound.push({ to: message.from, text: operation.reply, dryRun: sendResult.dryRun, reason: "Risposta al paziente" });
        } catch (error) {
          sendError = error.message || "Invio non riuscito";
        }
      }

      const campaignMode = process.env.WHATSAPP_CAMPAIGNS_MODE || "dry-run";
      if (Array.isArray(operation.campaignMessages) && operation.campaignMessages.length) {
        for (const campaignMessage of operation.campaignMessages) {
          try {
            const sendResult = await maybeSendWhatsAppText({
              to: campaignMessage.to,
              text: campaignMessage.text,
              mode: campaignMode,
            });
            outbound.push({ ...campaignMessage, dryRun: sendResult.dryRun });
          } catch (error) {
            outbound.push({ ...campaignMessage, dryRun: false, error: error.message || "Invio campagna non riuscito" });
          }
        }
      }

      state = {
        ...state,
        outboundQueue: [...outbound, ...(Array.isArray(state.outboundQueue) ? state.outboundQueue : [])].slice(0, 50),
      };
      await saveProductState(state);

      await appendWhatsAppEvent({
        id: message.id || `event-${Date.now()}`,
        fromPhone: message.from,
        patientName: patient.name,
        messageText: message.text,
        analysis: analysisResult.analysis,
        action: operation.action,
        reply: operation.reply,
        sent,
        error: sendError,
      });

      processed.push({
        messageId: message.id,
        from: message.from,
        patientName: patient.name,
        intent: analysisResult.analysis?.intent,
        intentLabel: analysisResult.analysis?.intentLabel,
        analysis: analysisResult.analysis,
        action: operation.action,
        reply: operation.reply,
        sent,
        dryRun,
        sendError,
        outbound,
        usedGemini: analysisResult.usedGemini,
      });
    }

    res.status(200).json({ ok: true, processed });
  } catch (error) {
    res.status(200).json({ ok: false, error: error.message || "Webhook non elaborato" });
  }
}

module.exports = handler;

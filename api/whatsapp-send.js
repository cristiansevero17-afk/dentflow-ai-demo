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

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

async function sendWhatsAppText({ to, text }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const normalizedTo = normalizePhone(to);

  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp Cloud API non configurata: mancano WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID.");
  }

  if (!normalizedTo || !text) {
    throw new Error("Destinatario o testo mancanti.");
  }

  const response = await fetch(`https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedTo,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Invio WhatsApp fallito: ${response.status} ${JSON.stringify(payload).slice(0, 300)}`);
  }

  return payload;
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const payload = await sendWhatsAppText({ to: body.to, text: body.text });
    res.status(200).json({ ok: true, payload });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message || "Invio WhatsApp non riuscito" });
  }
}

module.exports = handler;
module.exports.sendWhatsAppText = sendWhatsAppText;

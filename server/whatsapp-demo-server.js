const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const qrcode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const analyzeMessageHandler = require("../api/analyze-message");

const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.WHATSAPP_DEMO_PORT || 8787);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(rootDir));

let client = null;
let qrDataUrl = null;
let studioNumber = null;
let status = "idle";
let lastError = null;
const eventClients = new Set();

function findBrowserExecutable() {
  const candidates = [
    process.env.WHATSAPP_CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function snapshot() {
  return {
    status,
    qr: qrDataUrl,
    studioNumber,
    error: lastError,
  };
}

function normalizePhoneNumber(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function defaultCancellationText() {
  return "Buongiorno, devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00. Mi dispiace.";
}

function sendSse(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function publish(event, payload) {
  for (const res of eventClients) {
    sendSse(res, event, payload);
  }
}

function setStatus(nextStatus, extra = {}) {
  status = nextStatus;
  if (extra.qr !== undefined) qrDataUrl = extra.qr;
  if (extra.error !== undefined) lastError = extra.error;
  publish("status", snapshot());
}

function isCancellationMessage(text) {
  const normalized = String(text || "").toLowerCase();
  const hasCancellationIntent =
    normalized.includes("rinunc") ||
    normalized.includes("cancell") ||
    normalized.includes("disdett") ||
    normalized.includes("annull") ||
    normalized.includes("spost");
  const hasAppointmentContext =
    normalized.includes("appuntamento") ||
    normalized.includes("visita") ||
    normalized.includes("igiene") ||
    normalized.includes("16");

  return hasCancellationIntent && hasAppointmentContext;
}

function sanitizeMessage(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 500);
}

async function ensureClient() {
  if (client) {
    return snapshot();
  }

  setStatus("starting", { error: null });

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: "demo-studio-dentistico",
      dataPath: path.join(rootDir, ".wwebjs_auth"),
    }),
    puppeteer: {
      headless: true,
      executablePath: findBrowserExecutable(),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", async (qr) => {
    qrDataUrl = await qrcode.toDataURL(qr, { margin: 1, width: 256 });
    setStatus("qr", { qr: qrDataUrl, error: null });
    publish("log", { message: "QR reale generato. Scansionalo da WhatsApp sul telefono." });
  });

  client.on("authenticated", () => {
    publish("log", { message: "Autenticazione WhatsApp completata." });
  });

  client.on("ready", () => {
    studioNumber = client.info?.wid?.user || studioNumber;
    setStatus("connected", { qr: null, error: null });
    publish("log", { message: "WhatsApp reale collegato. In attesa di messaggi demo." });
  });

  client.on("message", async (message) => {
    const body = sanitizeMessage(message.body);
    if (!body || !isCancellationMessage(body)) return;

    let contactName = "Paziente WhatsApp";
    try {
      const contact = await message.getContact();
      contactName = contact.pushname || contact.name || contact.number || contactName;
    } catch (error) {
      contactName = "Paziente WhatsApp";
    }

    publish("cancellation", {
      id: message.id?._serialized || String(Date.now()),
      contactName,
      body,
      receivedAt: new Date().toISOString(),
    });
  });

  client.on("disconnected", (reason) => {
    client = null;
    qrDataUrl = null;
    studioNumber = null;
    setStatus("disconnected", { qr: null, error: reason || null });
    publish("log", { message: "WhatsApp disconnesso. Puoi ripetere il collegamento." });
  });

  try {
    await client.initialize();
  } catch (error) {
    client = null;
    qrDataUrl = null;
    studioNumber = null;
    setStatus("error", { qr: null, error: error.message || String(error) });
  }

  return snapshot();
}

app.get("/api/whatsapp/status", (_req, res) => {
  res.json(snapshot());
});

app.post("/api/analyze-message", analyzeMessageHandler);

app.post("/api/whatsapp/connect", async (_req, res) => {
  const current = await ensureClient();
  res.json(current);
});

app.post("/api/whatsapp/disconnect", async (_req, res) => {
  if (client) {
    await client.destroy();
  }
  client = null;
  qrDataUrl = null;
  studioNumber = null;
  setStatus("idle", { qr: null, error: null });
  res.json(snapshot());
});

app.get("/api/whatsapp/chat-qr", async (req, res) => {
  const phone = normalizePhoneNumber(req.query.phone || studioNumber);
  const text = String(req.query.text || defaultCancellationText());

  if (!phone) {
    res.status(400).json({
      error: "Inserisci il numero WhatsApp dello studio in formato internazionale, ad esempio 393331234567.",
    });
    return;
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  const qr = await qrcode.toDataURL(url, { margin: 1, width: 256 });
  res.json({ phone, text, url, qr });
});

app.get("/api/whatsapp/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
  });
  sendSse(res, "status", snapshot());
  eventClients.add(res);

  req.on("close", () => {
    eventClients.delete(res);
  });
});

app.listen(port, () => {
  console.log(`Demo Studio Dentistico pronta su http://localhost:${port}`);
  console.log("Apri quella URL e usa la sezione WhatsApp Web per collegare il telefono.");
});

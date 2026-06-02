const { getProductState, saveProductState } = require("./_product-store");
const { maybeSendWhatsAppText } = require("./whatsapp-send");

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Rome" });
}

function fromISODate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(year || 2000, (month || 1) - 1, day || 1);
}

function daysSince(isoDate) {
  const diff = Date.now() - fromISODate(isoDate).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function firstName(name) {
  return String(name || "Paziente").split(" ")[0] || "Paziente";
}

function valueIncludes(value, needle) {
  const target = normalizeText(needle);
  if (!target) return false;
  if (Array.isArray(value)) return value.some((item) => normalizeText(item).includes(target));
  return normalizeText(value).includes(target);
}

function isAutomationActive(state, id) {
  const automations = Array.isArray(state.automations) ? state.automations : [];
  const automation = automations.find((item) => item.id === id);
  return automation ? automation.active !== false : true;
}

function ruleThreshold(rule) {
  const text = normalizeText(`${rule.name} ${rule.trigger} ${rule.delay}`);
  if (text.includes("inattivo")) return 365;
  if (text.includes("annuale") || text.includes("11 mesi")) return 330;
  if (text.includes("6 mesi") || text.includes("igiene")) return 170;
  return 160;
}

function ruleMatchesPatient(rule, patient) {
  const text = normalizeText(`${rule.name} ${rule.trigger}`);
  if (text.includes("igiene")) return valueIncludes(patient.treatments, "Igiene dentale");
  if (text.includes("controllo")) return valueIncludes(patient.treatments, "Controllo") || true;
  return true;
}

function renderTemplate(template, patient) {
  const base = template || "Ciao {nome}, ti ricordiamo che puoi prenotare il prossimo controllo. Vuoi che ti proponiamo qualche disponibilita'?";
  return base.replaceAll("{nome}", firstName(patient.name));
}

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

async function processFollowUps({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-followup")) return [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const rules = (Array.isArray(state.rules) ? state.rules : []).filter((rule) => rule.active !== false);
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const day = todayISO();
  const processed = [];

  for (const rule of rules) {
    const threshold = ruleThreshold(rule);
    for (const patient of patients) {
      if (!patient.consent || !patient.phone || !patient.lastVisit) continue;
      if (!ruleMatchesPatient(rule, patient)) continue;
      if (daysSince(patient.lastVisit) < threshold) continue;

      const runKey = `${day}:followup:${rule.id}:${patient.id}`;
      if (!force && previousRuns.some((run) => run.key === runKey)) continue;

      const text = renderTemplate(rule.template, patient);
      let sendResult = { dryRun: true };
      let error = null;
      try {
        sendResult = await maybeSendWhatsAppText({ to: patient.phone, text, mode });
      } catch (sendError) {
        error = sendError.message || "Invio WhatsApp non riuscito";
      }

      processed.push({
        key: runKey,
        type: "followup",
        ruleId: rule.id,
        ruleName: rule.name,
        patientId: patient.id,
        patientName: patient.name,
        to: patient.phone,
        text,
        dryRun: Boolean(sendResult.dryRun),
        sent: !sendResult.dryRun && !error,
        error,
      });
    }
  }

  return processed;
}

async function processQuotes({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-quotes")) return [];
  const quotes = Array.isArray(state.quotes) ? state.quotes : [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const day = todayISO();
  const processed = [];

  for (const quote of quotes) {
    const patient = patients.find((item) => item.id === quote.patientId);
    if (!patient?.consent || !patient.phone) continue;
    const age = daysSince(quote.sentAt);
    if (age < 3) continue;
    const runKey = `${day}:quote:${quote.id}`;
    if (!force && previousRuns.some((run) => run.key === runKey)) continue;

    const text = `Ciao ${firstName(patient.name)}, volevamo sapere se hai avuto modo di valutare il preventivo per ${quote.treatment}. Se vuoi, possiamo chiarire ogni dubbio direttamente su WhatsApp.`;
    let sendResult = { dryRun: true };
    let error = null;
    try {
      sendResult = await maybeSendWhatsAppText({ to: patient.phone, text, mode });
    } catch (sendError) {
      error = sendError.message || "Invio WhatsApp non riuscito";
    }

    processed.push({
      key: runKey,
      type: "quote",
      quoteId: quote.id,
      ruleName: "Preventivo",
      patientId: patient.id,
      patientName: patient.name,
      to: patient.phone,
      text,
      dryRun: Boolean(sendResult.dryRun),
      sent: !sendResult.dryRun && !error,
      error,
    });
  }

  return processed;
}

module.exports = async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.method === "POST" ? await readJsonBody(req) : {};
    const force = req.query?.force === "true" || body.force === true;
    const mode = body.mode || req.query?.mode || process.env.WHATSAPP_SEND_MODE || "dry-run";
    const stateResult = await getProductState();

    if (!stateResult.configured || !stateResult.state) {
      res.status(200).json({ ok: false, configured: stateResult.configured, processed: [], error: "Database prodotto non configurato o vuoto." });
      return;
    }

    const state = stateResult.state;
    const processed = [
      ...(await processFollowUps({ state, force, mode })),
      ...(await processQuotes({ state, force, mode })),
    ];

    const timestamp = new Date().toISOString();
    const runs = processed.map((item) => ({
      ...item,
      id: `run-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: timestamp,
      mode,
    }));
    const logs = runs.map((item) => ({
      id: `log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      patient: item.patientName,
      message: "Automazione follow-up",
      action: item.error ? "Invio automatico non riuscito" : item.dryRun ? "Follow-up preparato in dry-run" : "Follow-up WhatsApp inviato",
      reply: item.text,
      engine: "Automazioni",
    }));
    const outbound = runs.map((item) => ({
      to: item.to,
      text: item.text,
      dryRun: item.dryRun,
      reason: item.type === "quote" ? "Follow-up preventivo" : `Follow-up - ${item.ruleName}`,
      error: item.error || null,
      createdAt: timestamp,
    }));

    const nextState = {
      ...state,
      automationRuns: [...runs, ...(Array.isArray(state.automationRuns) ? state.automationRuns : [])].slice(0, 200),
      outboundQueue: [...outbound, ...(Array.isArray(state.outboundQueue) ? state.outboundQueue : [])].slice(0, 80),
      log: [...logs, ...(Array.isArray(state.log) ? state.log : [])].slice(0, 50),
      lastAutomationRunAt: timestamp,
    };

    await saveProductState(nextState);

    res.status(200).json({
      ok: true,
      force,
      mode,
      processed: runs,
      count: runs.length,
      sent: runs.filter((item) => item.sent).length,
      dryRun: runs.filter((item) => item.dryRun).length,
      errors: runs.filter((item) => item.error).length,
      updatedAt: timestamp,
    });
  } catch (error) {
    res.status(200).json({ ok: false, processed: [], error: error.message || "Automazioni non eseguite." });
  }
};

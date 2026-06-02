const { getProductState, saveProductState } = require("./_product-store");
const { maybeSendWhatsAppText } = require("./whatsapp-send");
const { buildTopCandidates, formatDate } = require("./_product-engine");

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

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(year || 2000, (month || 1) - 1, day || 1);
}

function addDays(isoDate, amount) {
  const date = fromISODate(isoDate);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

function daysSince(isoDate) {
  const diff = Date.now() - fromISODate(isoDate).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function daysUntil(isoDate) {
  const diff = fromISODate(isoDate).getTime() - fromISODate(todayISO()).getTime();
  return Math.round(diff / 86400000);
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

function isQuoteRule(rule) {
  return normalizeText(`${rule.name} ${rule.trigger} ${rule.delay}`).includes("preventivo");
}

function isInactiveRule(rule) {
  return normalizeText(`${rule.name} ${rule.trigger} ${rule.delay}`).includes("inattivo");
}

function ruleMatchesPatient(rule, patient) {
  const text = normalizeText(`${rule.name} ${rule.trigger}`);
  if (isQuoteRule(rule)) return false;
  if (isInactiveRule(rule)) return false;
  if (text.includes("igiene")) return valueIncludes(patient.treatments, "Igiene dentale");
  if (text.includes("controllo")) return valueIncludes(patient.treatments, "Controllo") || true;
  return true;
}

function renderTemplate(template, patient) {
  const base = template || "Ciao {nome}, ti ricordiamo che puoi prenotare il prossimo controllo. Vuoi che ti proponiamo qualche disponibilita'?";
  return base.replaceAll("{nome}", firstName(patient.name));
}

function runAlreadyExists(previousRuns, key, force) {
  return !force && previousRuns.some((run) => run.key === key);
}

async function buildRun({ key, type, ruleName, patient, to, text, mode, extra = {} }) {
  let sendResult = { dryRun: true };
  let error = null;
  try {
    sendResult = await maybeSendWhatsAppText({ to, text, mode });
  } catch (sendError) {
    error = sendError.message || "Invio WhatsApp non riuscito";
  }

  return {
    key,
    type,
    ruleName,
    patientId: patient?.id || extra.patientId || null,
    patientName: patient?.name || extra.patientName || "Studio",
    to,
    text,
    dryRun: Boolean(sendResult.dryRun),
    sent: !sendResult.dryRun && !error,
    error,
    ...extra,
  };
}

function patientById(patients, patientId) {
  return patients.find((patient) => patient.id === patientId);
}

function completedAppointment(appointment) {
  return normalizeText(appointment.status).includes("completato");
}

function quoteStage(age) {
  if (age >= 30) return { label: "Preventivo 30 giorni", detail: "ricontatto futuro", text: "Se preferisci, possiamo risentirci piu' avanti o chiudere il promemoria." };
  if (age >= 14) return { label: "Preventivo 14 giorni", detail: "breve chiamata", text: "Possiamo fissare una breve chiamata con lo studio per chiarire ogni dubbio." };
  if (age >= 7) return { label: "Preventivo 7 giorni", detail: "chiarimenti", text: "Siamo disponibili su WhatsApp per qualsiasi chiarimento." };
  return { label: "Preventivo 3 giorni", detail: "verifica gentile", text: "Volevamo sapere se hai avuto modo di valutarlo." };
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
    if (isQuoteRule(rule)) continue;
    if (isInactiveRule(rule)) continue;
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
    if (runAlreadyExists(previousRuns, runKey, force)) continue;

    const stage = quoteStage(age);
    const text = `Ciao ${firstName(patient.name)}, ti scriviamo per il preventivo ${quote.treatment}. ${stage.text}`;
    processed.push(await buildRun({
      key: runKey,
      type: "quote",
      ruleName: stage.label,
      patient,
      to: patient.phone,
      text,
      mode,
      extra: { quoteId: quote.id, stage: stage.detail },
    }));
  }

  return processed;
}

async function processAppointmentReminders({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-reminders")) return [];
  const appointments = Array.isArray(state.appointments) ? state.appointments : [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const day = todayISO();
  const processed = [];

  for (const appointment of appointments) {
    const remaining = daysUntil(appointment.date);
    if (![1, 2].includes(remaining)) continue;
    if (!["confermato", "rischio"].includes(normalizeText(appointment.status))) continue;
    const patient = patientById(patients, appointment.patientId);
    if (!patient?.consent || !patient.phone) continue;

    const label = remaining === 1 ? "Reminder 24h" : "Reminder 48h";
    const runKey = `${day}:reminder:${remaining}:${appointment.id}`;
    if (runAlreadyExists(previousRuns, runKey, force)) continue;

    const text = `Ciao ${firstName(patient.name)}, ti ricordiamo l'appuntamento di ${formatDate(appointment.date)} alle ${appointment.time} per ${appointment.treatment}. Puoi rispondere SI per confermare o scriverci se hai bisogno di cambiare orario.`;
    processed.push(await buildRun({
      key: runKey,
      type: "appointment_reminder",
      ruleName: label,
      patient,
      to: patient.phone,
      text,
      mode,
      extra: { appointmentId: appointment.id },
    }));
  }

  return processed;
}

async function processRiskSlots({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-risk-slots")) return [];
  const appointments = Array.isArray(state.appointments) ? state.appointments : [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const waitlist = Array.isArray(state.waitlist) ? state.waitlist : [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const day = todayISO();
  const processed = [];

  for (const appointment of appointments) {
    const isTomorrow = daysUntil(appointment.date) === 1;
    const isRisk = normalizeText(appointment.status).includes("rischio");
    if (!isRisk && !isTomorrow) continue;
    if (!["confermato", "rischio"].includes(normalizeText(appointment.status))) continue;

    const candidates = buildTopCandidates(patients, appointment, waitlist)
      .filter((candidate) => candidate.status !== "Non contattare")
      .slice(0, 10);
    if (!candidates.length) continue;

    const runKey = `${day}:risk:${appointment.id}`;
    if (runAlreadyExists(previousRuns, runKey, force)) continue;
    const preview = candidates.slice(0, 3).map((candidate) => candidate.name).join(", ");
    const text = `Coda pronta per ${formatDate(appointment.date)} alle ${appointment.time}: ${preview}${candidates.length > 3 ? " e altri candidati" : ""}.`;
    processed.push(await buildRun({
      key: runKey,
      type: "risk_slot",
      ruleName: "Slot a rischio",
      patient: { id: appointment.patientId, name: appointment.patientName },
      to: state.studioPhone || process.env.STUDIO_WHATSAPP_PHONE || "studio",
      text,
      mode: "dry-run",
      extra: {
        appointmentId: appointment.id,
        candidates: candidates.map((candidate) => ({ patientId: candidate.patientId, name: candidate.name, score: candidate.score })),
      },
    }));
  }

  return processed;
}

async function processInactivePatients({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-inactive")) return [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const day = todayISO();
  const processed = [];

  for (const patient of patients) {
    if (!patient.consent || !patient.phone || !patient.lastVisit || daysSince(patient.lastVisit) < 365) continue;
    const runKey = `${day}:inactive:${patient.id}`;
    if (runAlreadyExists(previousRuns, runKey, force)) continue;
    const text = `Ciao ${firstName(patient.name)}, e' passato un po' di tempo dall'ultimo controllo. Vuoi che ti proponiamo qualche disponibilita' comoda per una visita?`;
    processed.push(await buildRun({
      key: runKey,
      type: "inactive_patient",
      ruleName: "Recupero paziente inattivo",
      patient,
      to: patient.phone,
      text,
      mode,
    }));
  }

  return processed;
}

async function processPostVisit({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-post-visit")) return [];
  const appointments = Array.isArray(state.appointments) ? state.appointments : [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const day = todayISO();
  const processed = [];
  const sensitiveTreatments = ["implantologia", "devitalizzazione", "chirurgia", "ortodonzia"];

  for (const appointment of appointments) {
    if (!completedAppointment(appointment)) continue;
    const age = daysSince(appointment.date);
    if (age < 1 || age > 3) continue;
    if (!sensitiveTreatments.some((treatment) => normalizeText(appointment.treatment).includes(treatment))) continue;
    const patient = patientById(patients, appointment.patientId);
    if (!patient?.consent || !patient.phone) continue;
    const runKey = `${day}:postvisit:${appointment.id}`;
    if (runAlreadyExists(previousRuns, runKey, force)) continue;
    const text = `Ciao ${firstName(patient.name)}, volevamo sapere come va dopo ${appointment.treatment}. Se hai dubbi o fastidi puoi rispondere qui e lo studio ti ricontatta.`;
    processed.push(await buildRun({
      key: runKey,
      type: "post_visit",
      ruleName: "Follow-up post visita",
      patient,
      to: patient.phone,
      text,
      mode,
      extra: { appointmentId: appointment.id },
    }));
  }

  return processed;
}

async function processReviews({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-reviews")) return [];
  const appointments = Array.isArray(state.appointments) ? state.appointments : [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const day = todayISO();
  const processed = [];
  const sensitiveTreatments = ["implantologia", "devitalizzazione", "chirurgia"];

  for (const appointment of appointments) {
    if (!completedAppointment(appointment)) continue;
    if (sensitiveTreatments.some((treatment) => normalizeText(appointment.treatment).includes(treatment))) continue;
    const age = daysSince(appointment.date);
    if (age < 0 || age > 3) continue;
    const patient = patientById(patients, appointment.patientId);
    if (!patient?.consent || !patient.phone) continue;
    const runKey = `${day}:review:${appointment.id}`;
    if (runAlreadyExists(previousRuns, runKey, force)) continue;
    const text = `Ciao ${firstName(patient.name)}, grazie per essere passato in studio. Se ti sei trovato bene, una recensione Google ci aiuterebbe molto. Vuoi che ti inviamo il link?`;
    processed.push(await buildRun({
      key: runKey,
      type: "review_request",
      ruleName: "Richiesta recensione",
      patient,
      to: patient.phone,
      text,
      mode,
      extra: { appointmentId: appointment.id },
    }));
  }

  return processed;
}

async function processBirthdays({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-birthday")) return [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const today = todayISO();
  const day = today;
  const [, month, date] = today.split("-");
  const processed = [];

  for (const patient of patients) {
    if (!patient.consent || !patient.phone || !patient.birthDate) continue;
    const [, birthMonth, birthDay] = String(patient.birthDate).split("-");
    if (birthMonth !== month || birthDay !== date) continue;
    const runKey = `${day}:birthday:${patient.id}`;
    if (runAlreadyExists(previousRuns, runKey, force)) continue;
    const text = `Ciao ${firstName(patient.name)}, tanti auguri da tutto lo studio. Ti auguriamo una splendida giornata.`;
    processed.push(await buildRun({
      key: runKey,
      type: "birthday",
      ruleName: "Compleanno paziente",
      patient,
      to: patient.phone,
      text,
      mode,
    }));
  }

  return processed;
}

async function processDailySummary({ state, force, mode }) {
  if (!isAutomationActive(state, "auto-daily-summary")) return [];
  const previousRuns = Array.isArray(state.automationRuns) ? state.automationRuns : [];
  const appointments = Array.isArray(state.appointments) ? state.appointments : [];
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const gaps = Array.isArray(state.gaps) ? state.gaps : [];
  const day = todayISO();
  const runKey = `${day}:daily-summary`;
  if (runAlreadyExists(previousRuns, runKey, force)) return [];

  const todayAppointments = appointments.filter((appointment) => appointment.date === day && normalizeText(appointment.status) !== "annullato").length;
  const riskSlots = appointments.filter((appointment) => daysUntil(appointment.date) <= 1 && normalizeText(appointment.status).includes("rischio")).length;
  const dueFollowUps = patients.filter((patient) => patient.consent && patient.lastVisit && daysSince(patient.lastVisit) > 160).length;
  const openGaps = gaps.filter((gap) => normalizeText(gap.status) !== "riempito").length;
  const text = `Riepilogo studio: ${todayAppointments} appuntamenti oggi, ${dueFollowUps} follow-up pronti, ${openGaps} slot aperti, ${riskSlots} slot a rischio.`;

  return [await buildRun({
    key: runKey,
    type: "daily_summary",
    ruleName: "Riepilogo giornaliero",
    patient: { id: "studio", name: "Studio" },
    to: state.studioPhone || process.env.STUDIO_WHATSAPP_PHONE || "studio",
    text,
    mode: state.studioPhone || process.env.STUDIO_WHATSAPP_PHONE ? mode : "dry-run",
  })];
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
      ...(await processAppointmentReminders({ state, force, mode })),
      ...(await processFollowUps({ state, force, mode })),
      ...(await processQuotes({ state, force, mode })),
      ...(await processInactivePatients({ state, force, mode })),
      ...(await processPostVisit({ state, force, mode })),
      ...(await processReviews({ state, force, mode })),
      ...(await processBirthdays({ state, force, mode })),
      ...(await processRiskSlots({ state, force, mode })),
      ...(await processDailySummary({ state, force, mode })),
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
      message: "Automazione",
      action: item.error ? "Invio automatico non riuscito" : item.dryRun ? `${item.ruleName} preparata in dry-run` : `${item.ruleName} inviata`,
      reply: item.text,
      engine: "Automazioni",
    }));
    const outbound = runs.map((item) => ({
      to: item.to,
      text: item.text,
      dryRun: item.dryRun,
      reason: item.ruleName || item.type,
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

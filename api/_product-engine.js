function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function todayISO() {
  const parts = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(isoDate, amount) {
  const date = fromISODate(isoDate);
  date.setDate(date.getDate() + amount);
  return toISODate(date);
}

function formatDate(value) {
  return fromISODate(value).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

function isCancellationIntentText(value) {
  const text = normalizeText(value);
  return ["non posso", "non riesco", "rinunc", "annull", "disdett", "cancell", "non vengo", "devo saltare"].some((keyword) => text.includes(keyword));
}

function isConfirmationText(value) {
  const text = normalizeText(value);
  return ["si", "sì", "confermo", "va bene", "ok", "perfetto", "ci sono", "lo prendo"].some((keyword) => text.includes(keyword));
}

function isDefiniteConfirmationText(value) {
  const text = normalizeText(value);
  return (
    /\b(si|ok)\b/.test(text) ||
    ["confermo", "va bene", "perfetto", "ci sono", "lo prendo"].some((keyword) => text.includes(keyword))
  );
}

function timeBucket(time) {
  const hour = Number(String(time || "00:00").slice(0, 2));
  if (hour < 12) return "Mattina";
  if (hour < 14) return "Pausa pranzo";
  if (hour < 16) return "Pomeriggio";
  if (hour < 19) return "Dopo le 16:00";
  return "Sera";
}

function requestText(messageText, analysis) {
  const detectedText = Array.isArray(analysis?.detected) ? analysis.detected.join(" ") : "";
  return normalizeText(`${messageText || ""} ${detectedText}`);
}

function nextWeekdayDate(targetDay, fromDate = todayISO(), forceNextWeek = false) {
  const days = {
    domenica: 0,
    lunedi: 1,
    martedi: 2,
    mercoledi: 3,
    giovedi: 4,
    venerdi: 5,
    sabato: 6,
  };
  const target = days[normalizeText(targetDay)];
  if (typeof target !== "number") return fromDate;

  const current = fromISODate(fromDate).getDay();
  let offset = (target - current + 7) % 7;
  if (offset === 0 || forceNextWeek) offset += 7;
  return addDays(fromDate, offset);
}

function resolveRequestedStartDate(messageText, analysis) {
  const text = requestText(messageText, analysis);
  const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const explicitDate = text.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b/);
  const today = todayISO();

  if (text.includes("dopodomani")) return addDays(today, 2);
  if (text.includes("domani")) return addDays(today, 1);
  if (text.includes("oggi")) return today;

  if (explicitDate) {
    const monthIndex = months.indexOf(explicitDate[2]);
    const currentYear = Number(today.slice(0, 4));
    let candidate = toISODate(new Date(currentYear, monthIndex, Number(explicitDate[1])));
    if (candidate < today) {
      candidate = toISODate(new Date(currentYear + 1, monthIndex, Number(explicitDate[1])));
    }
    return candidate;
  }

  const weekday = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"].find((day) => text.includes(day));
  const nextWeek = text.includes("settimana prossima") || text.includes("prossima settimana");
  if (weekday) return nextWeekdayDate(weekday, today, nextWeek);
  if (nextWeek) return nextWeekdayDate("lunedi", today, true);

  return today;
}

function resolveRequestedPreference(messageText, analysis) {
  const text = requestText(messageText, analysis);
  if (text.includes("mattina") || text.includes("mattino") || text.includes("prima delle")) return "Mattina";
  if (text.includes("pausa pranzo") || text.includes("pranzo")) return "Pausa pranzo";
  if (text.includes("dopo le 16") || text.includes("dopo le sedici") || text.includes("tardo pomeriggio") || text.includes("sera")) return "Dopo le 16:00";
  if (text.includes("pomeriggio") || text.includes("pomeridiano")) return "Pomeriggio";
  const preferenceLine = text.match(/preferenza:\s*([a-z0-9: ]+)/);
  if (preferenceLine && !preferenceLine[1].includes("non specificata")) return preferenceLine[1].trim();
  return "";
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysSince(isoDate) {
  const diff = Date.now() - fromISODate(isoDate).getTime();
  return Math.round(diff / 86400000);
}

function findPatientByPhone(patients, phone) {
  const normalized = normalizePhone(phone);
  return patients.find((patient) => {
    const patientPhone = normalizePhone(patient.phone);
    return patientPhone && (patientPhone === normalized || patientPhone.endsWith(normalized) || normalized.endsWith(patientPhone));
  });
}

function ensurePatient(state, phone, fallbackName) {
  const patients = Array.isArray(state.patients) ? state.patients : [];
  const existing = findPatientByPhone(patients, phone);
  if (existing) return { state, patient: existing, created: false };

  const patient = {
    id: makeId("p"),
    name: fallbackName || `Paziente ${normalizePhone(phone).slice(-4)}`,
    phone: phone ? `+${normalizePhone(phone)}` : "",
    consent: true,
    preferredTimes: ["Pomeriggio"],
    treatments: ["Igiene dentale", "Controllo"],
    distanceMinutes: 15,
    responseRate: 65,
    waitingList: false,
    lastVisit: addDays(todayISO(), -180),
    notes: "Creato automaticamente da WhatsApp.",
  };

  return {
    state: {
      ...state,
      patients: [...patients, patient],
    },
    patient,
    created: true,
  };
}

function appointmentMatchesRequest(appointment, analysis) {
  const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const detectedText = Array.isArray(analysis?.detected) ? normalizeText(analysis.detected.join(" ")) : "";
  const hasDate = detectedText.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/);
  const hasTomorrow = detectedText.includes("domani");
  const hasToday = detectedText.includes("oggi");
  const hasTime = detectedText.match(/(\d{1,2}):(\d{2})/);
  let dateOk = true;
  let timeOk = true;

  if (hasDate) {
    const monthIndex = months.indexOf(hasDate[2]);
    const expected = toISODate(new Date(new Date().getFullYear(), monthIndex, Number(hasDate[1])));
    dateOk = appointment.date === expected;
  } else if (hasTomorrow) {
    dateOk = appointment.date === addDays(todayISO(), 1);
  } else if (hasToday) {
    dateOk = appointment.date === todayISO();
  }

  if (hasTime) {
    timeOk = appointment.time === `${String(hasTime[1]).padStart(2, "0")}:${hasTime[2]}`;
  }

  return dateOk && timeOk;
}

function pickAppointmentForCancellation(appointments, analysis) {
  const activeAppointments = appointments
    .filter((appointment) => appointment.status !== "annullato" && appointment.status !== "da riempire")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  const exactAppointment = activeAppointments.find((appointment) => appointmentMatchesRequest(appointment, analysis));
  if (exactAppointment) return { appointment: exactAppointment, match: "exact" };
  const upcomingAppointment = activeAppointments.find((appointment) => appointment.date >= todayISO());
  if (upcomingAppointment) return { appointment: upcomingAppointment, match: "next" };
  return activeAppointments[0] ? { appointment: activeAppointments[0], match: "history" } : { appointment: null, match: "none" };
}

function slotMatchesPreference(time, preference = "") {
  const normalizedPreference = normalizeText(preference);
  if (!normalizedPreference || normalizedPreference === "non specificata") return true;

  const bucket = timeBucket(time);
  const hour = Number(String(time || "00:00").slice(0, 2));
  if (normalizedPreference.includes("mattina")) return bucket === "Mattina";
  if (normalizedPreference.includes("pausa") || normalizedPreference.includes("pranzo")) return bucket === "Pausa pranzo";
  if (normalizedPreference.includes("dopo le 16") || normalizedPreference.includes("sera") || normalizedPreference.includes("tardo")) return hour >= 16;
  if (normalizedPreference.includes("pomeriggio")) return bucket === "Pomeriggio" || hour >= 16;
  return normalizeText(bucket).includes(normalizedPreference);
}

function findOpenSlots(appointments, startDate, preference = "") {
  const options = [];
  const workingTimes = ["09:00", "10:30", "12:00", "15:00", "16:30", "18:00"];
  for (let offset = 0; offset < 21 && options.length < 5; offset += 1) {
    const date = addDays(startDate, offset);
    const weekday = fromISODate(date).getDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const time of workingTimes) {
      const taken = appointments.some((appointment) => appointment.date === date && appointment.time === time && appointment.status !== "annullato");
      const matchesPreference = slotMatchesPreference(time, preference);
      if (!taken && matchesPreference) options.push({ date, time });
      if (options.length >= 5) break;
    }
  }
  return options;
}

function rankCandidate(patient, slot, waitlist) {
  const treatmentMatch = Array.isArray(patient.treatments) && patient.treatments.includes(slot.treatment) ? 30 : 0;
  const preferredTime = Array.isArray(patient.preferredTimes) && patient.preferredTimes.includes(timeBucket(slot.time)) ? 24 : 0;
  const waitlistBoost = Array.isArray(waitlist) && waitlist.some((item) => item.patientId === patient.id && item.treatment === slot.treatment) ? 18 : 0;
  const consent = patient.consent ? 14 : -100;
  const response = Math.round(Number(patient.responseRate || 60) * 0.12);
  const distanceMinutes = Number(patient.distanceMinutes || 20);
  const distance = distanceMinutes <= 10 ? 10 : distanceMinutes <= 20 ? 6 : 2;
  const recentNeed = patient.lastVisit && daysSince(patient.lastVisit) > 150 ? 8 : 2;
  const score = Math.max(0, Math.min(100, treatmentMatch + preferredTime + waitlistBoost + consent + response + distance + recentNeed));

  return {
    patientId: patient.id,
    name: patient.name,
    phone: patient.phone,
    score,
    status: patient.consent ? "Pronto per invio" : "Non contattare",
    reasons: [
      treatmentMatch ? "trattamento compatibile" : "trattamento meno prioritario",
      preferredTime ? "fascia preferita" : "fascia neutra",
      waitlistBoost ? "lista d'attesa" : "storico CRM",
      patient.consent ? "consenso attivo" : "consenso assente",
    ],
  };
}

function buildTopCandidates(patients, slot, waitlist) {
  return (patients || [])
    .filter((patient) => patient.id !== slot.patientId)
    .map((patient) => rankCandidate(patient, slot, waitlist || []))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function getStateParts(state) {
  return {
    patients: Array.isArray(state?.patients) ? state.patients : [],
    appointments: Array.isArray(state?.appointments) ? state.appointments : [],
    waitlist: Array.isArray(state?.waitlist) ? state.waitlist : [],
    gaps: Array.isArray(state?.gaps) ? state.gaps : [],
    log: Array.isArray(state?.log) ? state.log : [],
  };
}

function updateStateForIncomingMessage({ state, patient, messageText, analysis }) {
  const parts = getStateParts(state);
  const firstName = String(patient.name || "Paziente").split(" ")[0] || "Paziente";
  const patientAppointments = parts.appointments.filter((appointment) => appointment.patientId === patient.id);
  const requestedStartDate = resolveRequestedStartDate(messageText, analysis);
  const requestedPreference = resolveRequestedPreference(messageText, analysis);
  const preferredOptions = findOpenSlots(parts.appointments, requestedStartDate, requestedPreference);
  const options = preferredOptions.length ? preferredOptions : findOpenSlots(parts.appointments, requestedStartDate, "");
  const optionText = options.length
    ? options.slice(0, 2).map((item) => `${formatDate(item.date)} alle ${item.time}`).join(" oppure ")
    : "al momento non risultano slot liberi compatibili nei prossimi giorni";
  const isCancellation = analysis.intent === "rinuncia" || isCancellationIntentText(messageText);
  const isConfirmation = analysis.intent === "conferma" || isDefiniteConfirmationText(messageText);
  let nextState = { ...state };
  let action = "Richiesta registrata";
  let reply = analysis.reply || `Ciao ${firstName}, abbiamo preso in carico la richiesta.`;
  let campaignMessages = [];

  if (isConfirmation) {
    const openGap = parts.gaps.find((gap) =>
      gap.status !== "riempito" &&
      Array.isArray(gap.candidates) &&
      gap.candidates.some((candidate) => normalizePhone(candidate.phone) === normalizePhone(patient.phone))
    );

    if (openGap) {
      const slot = parts.appointments.find((appointment) => appointment.id === openGap.appointmentId) || openGap.slot;
      nextState = {
        ...nextState,
        appointments: parts.appointments.map((appointment) =>
          appointment.id === slot.id
            ? { ...appointment, patientId: patient.id, patientName: patient.name, phone: patient.phone, status: "confermato" }
            : appointment
        ),
        gaps: parts.gaps.map((gap) => (gap.id === openGap.id ? { ...gap, status: "riempito", filledBy: patient.name, filledAt: new Date().toISOString() } : gap)),
      };
      action = "Conferma ricevuta e slot assegnato";
      reply = `Perfetto ${firstName}, abbiamo confermato lo slot ${formatDate(slot.date)} alle ${slot.time}. A presto.`;
      campaignMessages = openGap.candidates
        .filter((candidate) => candidate.patientId !== patient.id && candidate.status !== "Non contattare")
        .map((candidate) => ({
          to: candidate.phone,
          text: `Ciao ${candidate.name.split(" ")[0]}, grazie per la disponibilita'. Lo slot e' stato appena occupato; ti ricontatteremo alla prossima apertura compatibile.`,
          reason: "Chiusura Fill the Gap",
        }));
    } else {
      action = "Conferma registrata";
      reply = `Perfetto ${firstName}, conferma registrata.`;
    }
  } else if (isCancellation) {
    const cancellationTarget = pickAppointmentForCancellation(patientAppointments, analysis);
    if (cancellationTarget.appointment) {
      const appointmentToFree = cancellationTarget.appointment;
      const candidates = buildTopCandidates(parts.patients, appointmentToFree, parts.waitlist);
      const gap = {
        id: makeId("gap"),
        appointmentId: appointmentToFree.id,
        slot: appointmentToFree,
        status: "ondata top 10 inviata",
        createdAt: new Date().toISOString(),
        candidates: candidates.map((candidate, index) => ({
          ...candidate,
          status: index < 10 && candidate.status !== "Non contattare" ? "WhatsApp preparato" : candidate.status,
        })),
      };
      nextState = {
        ...nextState,
        appointments: parts.appointments.map((appointment) =>
          appointment.id === appointmentToFree.id ? { ...appointment, status: "da riempire" } : appointment
        ),
        gaps: [gap, ...parts.gaps],
      };
      action = "Slot liberato e Fill the Gap avviato";
      reply = `Grazie ${firstName}, abbiamo registrato la rinuncia per ${formatDate(appointmentToFree.date)} alle ${appointmentToFree.time}. Lo studio sta riorganizzando lo slot; ti proponiamo queste alternative: ${optionText}.`;
      campaignMessages = candidates
        .filter((candidate) => candidate.status !== "Non contattare")
        .slice(0, 10)
        .map((candidate) => ({
          to: candidate.phone,
          text: `Ciao ${candidate.name.split(" ")[0]}, si e' liberato uno slot per ${appointmentToFree.treatment} ${formatDate(appointmentToFree.date)} alle ${appointmentToFree.time}. Vuoi confermare? Rispondi SI e lo blocchiamo per te.`,
          reason: "Fill the Gap top 10",
        }));
    } else {
      action = "Rinuncia ricevuta, nessun appuntamento attivo trovato";
      reply = `Ciao ${firstName}, abbiamo ricevuto la rinuncia. Non risultano appuntamenti attivi associati al tuo contatto; se vuoi ti proponiamo queste disponibilita': ${optionText}.`;
    }
  } else if (analysis.intent === "spostamento" || analysis.intent === "richiesta_disponibilita") {
    action = "Agenda consultata e disponibilita' proposte";
    reply = `Ciao ${firstName}, abbiamo controllato l'agenda. Le prime disponibilita' compatibili sono ${optionText}. Quale preferisci?`;
  }

  const logEntry = {
    id: makeId("log"),
    createdAt: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    patient: patient.name,
    message: messageText,
    action,
    reply,
    engine: "Webhook WhatsApp",
  };

  nextState = {
    ...nextState,
    log: [logEntry, ...(Array.isArray(nextState.log) ? nextState.log : parts.log)].slice(0, 30),
  };

  return { state: nextState, action, reply, campaignMessages };
}

module.exports = {
  buildTopCandidates,
  ensurePatient,
  findPatientByPhone,
  findOpenSlots,
  formatDate,
  getStateParts,
  isCancellationIntentText,
  isConfirmationText,
  normalizePhone,
  resolveRequestedPreference,
  resolveRequestedStartDate,
  updateStateForIncomingMessage,
};

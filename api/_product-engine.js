function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bnn\b/g, "non")
    .replace(/\bn\b/g, "non")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9: ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function editDistance(a, b, maxDistance = 2) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let best = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      best = Math.min(best, current[j]);
    }
    if (best > maxDistance) return maxDistance + 1;
    previous = current;
  }
  return previous[b.length];
}

function fuzzyWordMatch(inputWord, targetWord) {
  const input = normalizeText(inputWord);
  const target = normalizeText(targetWord);
  if (!input || !target) return false;
  if (input === target) return true;
  if (target.length <= 2) return false;
  if (input.length <= 3 || target.length <= 3) return editDistance(input, target, 1) <= 1;
  if (target.length <= 4) return editDistance(input, target, 1) <= 1;
  return editDistance(input, target, 2) <= 2;
}

function fuzzyPhraseMatch(text, phrase) {
  const normalizedText = normalizeText(text);
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  if (normalizedText.includes(normalizedPhrase)) return true;

  const textWords = words(normalizedText);
  const phraseWords = words(normalizedPhrase);
  if (!phraseWords.length || textWords.length < phraseWords.length) return false;

  for (let i = 0; i <= textWords.length - phraseWords.length; i += 1) {
    const window = textWords.slice(i, i + phraseWords.length);
    if (phraseWords.every((phraseWord, index) => fuzzyWordMatch(window[index], phraseWord))) return true;
  }
  return false;
}

function includesFuzzyAny(text, phrases) {
  return phrases.some((phrase) => fuzzyPhraseMatch(text, phrase));
}

function findFuzzyWord(text, candidates) {
  const textWords = words(text);
  return candidates.find((candidate) => textWords.some((word) => fuzzyWordMatch(word, candidate))) || "";
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
  const date = fromISODate(value);
  const weekdays = ["domenica", "lunedi'", "martedi'", "mercoledi'", "giovedi'", "venerdi'", "sabato"];
  const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  return `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function isCancellationIntentText(value) {
  const text = normalizeText(value);
  return includesFuzzyAny(text, ["non posso", "non riesco", "rinuncia", "annullare", "disdire", "disdetta", "cancellare", "non vengo", "devo saltare"]);
}

function isConfirmationText(value) {
  const text = normalizeText(value);
  return ["si", "sì", "confermo", "va bene", "ok", "perfetto", "ci sono", "lo prendo"].some((keyword) => text.includes(keyword));
}

function isDefiniteConfirmationText(value) {
  const text = normalizeText(value);
  return (
    /\b(si|ok)\b/.test(text) ||
    includesFuzzyAny(text, ["confermo", "confermare", "va bene", "perfetto", "ci sono", "lo prendo"])
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
  const exactDate = text.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b/);
  const tokens = words(text);
  let explicitDate = exactDate;
  if (!explicitDate) {
    for (let index = 0; index < tokens.length - 1; index += 1) {
      if (/^\d{1,2}$/.test(tokens[index])) {
        const month = months.find((candidate) => fuzzyWordMatch(tokens[index + 1], candidate));
        if (month) {
          explicitDate = [tokens[index], tokens[index], month];
          break;
        }
      }
    }
  }
  const today = todayISO();

  if (includesFuzzyAny(text, ["dopodomani"])) return addDays(today, 2);
  if (includesFuzzyAny(text, ["domani"])) return addDays(today, 1);
  if (includesFuzzyAny(text, ["oggi"])) return today;

  if (explicitDate) {
    const monthIndex = months.indexOf(explicitDate[2]);
    const currentYear = Number(today.slice(0, 4));
    let candidate = toISODate(new Date(currentYear, monthIndex, Number(explicitDate[1])));
    if (candidate < today) {
      candidate = toISODate(new Date(currentYear + 1, monthIndex, Number(explicitDate[1])));
    }
    return candidate;
  }

  const weekday = findFuzzyWord(text, ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"]);
  const nextWeek = includesFuzzyAny(text, ["settimana prossima", "prossima settimana"]);
  if (weekday) return nextWeekdayDate(weekday, today, nextWeek);
  if (nextWeek) return nextWeekdayDate("lunedi", today, true);

  return today;
}

function resolveRequestedPreference(messageText, analysis) {
  const text = requestText(messageText, analysis);
  if (includesFuzzyAny(text, ["mattina", "mattino", "prima delle"])) return "Mattina";
  if (includesFuzzyAny(text, ["pausa pranzo", "pranzo"])) return "Pausa pranzo";
  if (includesFuzzyAny(text, ["dopo le 16", "dopo le sedici", "tardo pomeriggio", "sera"])) return "Dopo le 16:00";
  if (includesFuzzyAny(text, ["pomeriggio", "pomeridiano"])) return "Pomeriggio";
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
  const hasTomorrow = includesFuzzyAny(detectedText, ["domani"]);
  const hasToday = includesFuzzyAny(detectedText, ["oggi"]);
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
  const busyStatuses = ["confermato", "completato", "rischio"];
  for (let offset = 0; offset < 21 && options.length < 5; offset += 1) {
    const date = addDays(startDate, offset);
    const weekday = fromISODate(date).getDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const time of workingTimes) {
      const taken = appointments.some((appointment) => appointment.date === date && appointment.time === time && busyStatuses.includes(appointment.status));
      const matchesPreference = slotMatchesPreference(time, preference);
      if (!taken && matchesPreference) options.push({ date, time });
      if (options.length >= 5) break;
    }
  }
  return options;
}

function valueIncludes(value, needle) {
  const target = normalizeText(needle);
  if (!target) return false;
  if (Array.isArray(value)) return value.some((item) => {
    const normalizedItem = normalizeText(item);
    return normalizedItem.includes(target) || target.includes(normalizedItem);
  });
  return normalizeText(value).includes(target);
}

function firstPatientTreatment(patient) {
  const knownTreatments = ["Igiene dentale", "Controllo", "Sbiancamento", "Implantologia", "Ortodonzia", "Devitalizzazione"];
  if (Array.isArray(patient?.treatments) && patient.treatments[0]) return patient.treatments[0];
  return knownTreatments.find((treatment) => valueIncludes(patient?.treatments, treatment)) || "Controllo";
}

function rankCandidate(patient, slot, waitlist) {
  const treatmentMatch = valueIncludes(patient.treatments, slot.treatment) ? 30 : 0;
  const preferredTime = valueIncludes(patient.preferredTimes || patient.preferredTime, timeBucket(slot.time)) ? 24 : 0;
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
    conversations: state?.conversations && typeof state.conversations === "object" ? state.conversations : {},
  };
}

function getConversation(state, patientId) {
  const conversations = state?.conversations && typeof state.conversations === "object" ? state.conversations : {};
  const conversation = conversations[patientId] && typeof conversations[patientId] === "object" ? conversations[patientId] : {};
  return {
    history: Array.isArray(conversation.history) ? conversation.history : [],
    pending: conversation.pending || null,
  };
}

function saveConversation(state, patient, { incoming, reply, action, intent, pending }) {
  const current = getConversation(state, patient.id);
  const history = [
    {
      id: makeId("turn"),
      at: new Date().toISOString(),
      incoming,
      reply,
      action,
      intent,
    },
    ...current.history,
  ].slice(0, 12);

  return {
    ...state,
    conversations: {
      ...(state.conversations && typeof state.conversations === "object" ? state.conversations : {}),
      [patient.id]: {
        history,
        pending: pending || null,
      },
    },
  };
}

function parseRequestedOptionIndex(messageText) {
  const text = normalizeText(messageText);
  if (/\b(1|prima|primo)\b/.test(text) || includesFuzzyAny(text, ["la prima", "il primo"])) return 0;
  if (/\b(2|seconda|secondo)\b/.test(text) || includesFuzzyAny(text, ["la seconda", "il secondo"])) return 1;
  if (/\b(3|terza|terzo)\b/.test(text) || includesFuzzyAny(text, ["la terza", "il terzo"])) return 2;
  return -1;
}

function parseRequestedTime(messageText) {
  const text = normalizeText(messageText);
  const match = text.match(/\b(?:alle|ore)?\s*(\d{1,2})(?::|\.)(\d{2})\b|\b(?:alle|ore)\s+(\d{1,2})\b/);
  if (!match) return "";
  return `${String(match[1] || match[3]).padStart(2, "0")}:${match[2] || "00"}`;
}

function pickPendingOption(messageText, pending) {
  const options = Array.isArray(pending?.options) ? pending.options : [];
  if (!options.length) return null;

  const index = parseRequestedOptionIndex(messageText);
  if (index >= 0 && options[index]) return options[index];

  const requestedTime = parseRequestedTime(messageText);
  if (requestedTime) {
    return options.find((option) => option.time === requestedTime) || null;
  }

  return null;
}

function findSpecificOpenSlot(appointments, startDate, requestedTime) {
  if (!requestedTime) return null;
  const hour = Number(String(requestedTime).slice(0, 2));
  if (Number.isNaN(hour) || hour < 9 || hour >= 19) return null;
  const busyStatuses = ["confermato", "completato", "rischio"];

  for (let offset = 0; offset < 21; offset += 1) {
    const date = addDays(startDate, offset);
    const weekday = fromISODate(date).getDay();
    if (weekday === 0 || weekday === 6) continue;
    const taken = appointments.some((appointment) =>
      appointment.date === date &&
      appointment.time === requestedTime &&
      busyStatuses.includes(appointment.status)
    );
    if (!taken) return { date, time: requestedTime };
  }
  return null;
}

function isAlternativeRequest(messageText, analysis) {
  const text = requestText(messageText, analysis);
  return (
    /\bno\b/.test(text) ||
    includesFuzzyAny(text, ["altro", "altra", "altre disponibilita", "hai altro", "avete altro", "non va bene", "non posso", "preferirei"])
  );
}

function createAppointmentFromOption({ option, patient, treatment = "Controllo", notes = "Prenotato automaticamente da conversazione WhatsApp." }) {
  return {
    id: makeId("a"),
    date: option.date,
    time: option.time,
    notes,
    phone: patient.phone,
    status: "confermato",
    duration: 60,
    patientId: patient.id,
    treatment,
    patientName: patient.name,
  };
}

function updateStateForIncomingMessage({ state, patient, messageText, analysis }) {
  const parts = getStateParts(state);
  const firstName = String(patient.name || "Paziente").split(" ")[0] || "Paziente";
  const patientAppointments = parts.appointments.filter((appointment) => appointment.patientId === patient.id);
  const conversation = getConversation(state, patient.id);
  const pending = conversation.pending;
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
  let nextPending = pending || null;
  let selectedPendingOption = pickPendingOption(messageText, pending);
  const requestedPendingTime = parseRequestedTime(messageText);
  const requestedPendingIndex = parseRequestedOptionIndex(messageText);
  if (pending && requestedPendingTime && !selectedPendingOption) {
    const pendingBaseDate = Array.isArray(pending.options) && pending.options[0]?.date ? pending.options[0].date : requestedStartDate;
    selectedPendingOption = findSpecificOpenSlot(parts.appointments, pendingBaseDate, requestedPendingTime);
  }
  const pendingWantsAlternatives = pending && isAlternativeRequest(messageText, analysis);
  const shouldUseFirstPendingOption =
    pending &&
    isConfirmation &&
    Array.isArray(pending.options) &&
    pending.options[0] &&
    requestedPendingIndex < 0 &&
    !requestedPendingTime &&
    !pendingWantsAlternatives;

  const openGap = parts.gaps.find((gap) =>
    gap.status !== "riempito" &&
    Array.isArray(gap.candidates) &&
    gap.candidates.some((candidate) => normalizePhone(candidate.phone) === normalizePhone(patient.phone))
  );

  if (isConfirmation && openGap) {
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
    nextPending = null;
    campaignMessages = openGap.candidates
      .filter((candidate) => candidate.patientId !== patient.id && candidate.status !== "Non contattare")
      .map((candidate) => ({
        to: candidate.phone,
        text: `Ciao ${candidate.name.split(" ")[0]}, grazie per la disponibilita'. Lo slot e' stato appena occupato; ti ricontatteremo alla prossima apertura compatibile.`,
        reason: "Chiusura Fill the Gap",
      }));
  } else if (pending && (selectedPendingOption || shouldUseFirstPendingOption)) {
    const option = selectedPendingOption || pending.options[0];
    if (pending.type === "reschedule" && pending.originalAppointmentId) {
      nextState = {
        ...nextState,
        appointments: parts.appointments.map((appointment) =>
          appointment.id === pending.originalAppointmentId
            ? { ...appointment, date: option.date, time: option.time, status: "confermato" }
            : appointment
        ),
      };
      action = "Appuntamento spostato automaticamente";
      reply = `Perfetto ${firstName}, abbiamo spostato l'appuntamento a ${formatDate(option.date)} alle ${option.time}. A presto.`;
    } else {
      const treatment = pending.treatment || firstPatientTreatment(patient);
      const appointment = createAppointmentFromOption({ option, patient, treatment });
      nextState = {
        ...nextState,
        appointments: [appointment, ...parts.appointments],
      };
      action = "Nuovo appuntamento prenotato automaticamente";
      reply = `Perfetto ${firstName}, abbiamo prenotato ${treatment} per ${formatDate(option.date)} alle ${option.time}. A presto.`;
    }
    nextPending = null;
  } else if (pending && (requestedPendingTime || requestedPendingIndex >= 0)) {
    const alternativeText = Array.isArray(pending.options) && pending.options.length
      ? pending.options.slice(0, 2).map((item) => `${formatDate(item.date)} alle ${item.time}`).join(" oppure ")
      : optionText;
    action = "Opzione non disponibile, alternative mantenute";
    reply = `Ciao ${firstName}, ho controllato l'agenda: l'opzione indicata non risulta libera. Le alternative disponibili sono ${alternativeText}. Puoi rispondere con \"la prima\", \"la seconda\" o con un altro orario.`;
    nextPending = {
      ...pending,
      updatedAt: new Date().toISOString(),
    };
  } else if (pending && pendingWantsAlternatives) {
    const alternativeOptions = options;
    const alternativeText = alternativeOptions.length
      ? alternativeOptions.slice(0, 2).map((item) => `${formatDate(item.date)} alle ${item.time}`).join(" oppure ")
      : "al momento non risultano altre disponibilita' compatibili nei prossimi giorni";
    nextPending = {
      ...pending,
      options: alternativeOptions.slice(0, 5),
      updatedAt: new Date().toISOString(),
    };
    action = "Nuove alternative proposte in base alla conversazione";
    reply = `Certo ${firstName}, ho controllato altre disponibilita': ${alternativeText}. Puoi rispondere con \"la prima\", \"la seconda\" o con l'orario che preferisci.`;
  } else if (isConfirmation) {
    action = "Conferma registrata";
    reply = `Perfetto ${firstName}, conferma registrata.`;
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
      nextPending = {
        type: "booking",
        source: "cancellation_alternatives",
        treatment: appointmentToFree.treatment,
        options: options.slice(0, 5),
        createdAt: new Date().toISOString(),
      };
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
      nextPending = {
        type: "booking",
        source: "cancellation_without_appointment",
        treatment: firstPatientTreatment(patient),
        options: options.slice(0, 5),
        createdAt: new Date().toISOString(),
      };
    }
  } else if (analysis.intent === "spostamento") {
    const rescheduleTarget = pickAppointmentForCancellation(patientAppointments, analysis);
    nextPending = {
      type: rescheduleTarget.appointment ? "reschedule" : "booking",
      source: "reschedule_request",
      originalAppointmentId: rescheduleTarget.appointment?.id || null,
      treatment: rescheduleTarget.appointment?.treatment || firstPatientTreatment(patient),
      options: options.slice(0, 5),
      createdAt: new Date().toISOString(),
    };
    action = "Agenda consultata e spostamento proposto";
    reply = `Ciao ${firstName}, ho controllato l'agenda. Le prime alternative compatibili sono ${optionText}. Puoi rispondere con \"la prima\", \"la seconda\" o con l'orario che preferisci.`;
  } else if (analysis.intent === "richiesta_disponibilita") {
    nextPending = {
      type: "booking",
      source: "availability_request",
      treatment: firstPatientTreatment(patient),
      options: options.slice(0, 5),
      createdAt: new Date().toISOString(),
    };
    action = "Agenda consultata e disponibilita' proposte";
    reply = `Ciao ${firstName}, abbiamo controllato l'agenda. Le prime disponibilita' compatibili sono ${optionText}. Puoi rispondere con \"la prima\", \"la seconda\" o con l'orario che preferisci.`;
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
  nextState = saveConversation(nextState, patient, {
    incoming: messageText,
    reply,
    action,
    intent: analysis.intent,
    pending: nextPending,
  });

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

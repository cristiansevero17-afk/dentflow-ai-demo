function normalizeMessageText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bnn\b/g, "non")
    .replace(/\bn\b/g, "non")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function words(value) {
  return normalizeMessageText(value)
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
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      best = Math.min(best, current[j]);
    }
    if (best > maxDistance) return maxDistance + 1;
    previous = current;
  }
  return previous[b.length];
}

function fuzzyWordMatch(inputWord, targetWord) {
  const input = normalizeMessageText(inputWord);
  const target = normalizeMessageText(targetWord);
  if (!input || !target) return false;
  if (input === target) return true;
  if (target.length <= 2) return false;
  if (input.length <= 3 || target.length <= 3) return editDistance(input, target, 1) <= 1;
  if (target.length <= 4) return editDistance(input, target, 1) <= 1;
  return editDistance(input, target, 2) <= 2;
}

function fuzzyPhraseMatch(text, phrase) {
  const normalizedText = normalizeMessageText(text);
  const normalizedPhrase = normalizeMessageText(phrase);
  if (!normalizedPhrase) return false;
  if (normalizedText.includes(normalizedPhrase)) return true;

  const textWords = words(normalizedText);
  const phraseWords = words(normalizedPhrase);
  if (!phraseWords.length || textWords.length < phraseWords.length) return false;

  for (let i = 0; i <= textWords.length - phraseWords.length; i += 1) {
    const window = textWords.slice(i, i + phraseWords.length);
    const matched = phraseWords.every((phraseWord, index) => fuzzyWordMatch(window[index], phraseWord));
    if (matched) return true;
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

function findExplicitDateSignal(message) {
  const normalized = normalizeMessageText(message);
  const exact = normalized.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b/);
  if (exact) return `${exact[1]} ${exact[2]}`;

  const months = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const tokens = words(normalized);
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (/^\d{1,2}$/.test(tokens[index])) {
      const month = months.find((candidate) => fuzzyWordMatch(tokens[index + 1], candidate));
      if (month) return `${tokens[index]} ${month}`;
    }
  }
  return "";
}

function hasConfirmationIntent(text) {
  const normalized = normalizeMessageText(text);
  return (
    /\b(si|ok)\b/.test(normalized) ||
    includesFuzzyAny(normalized, ["confermo", "confermare", "va bene", "perfetto", "ci sono", "lo prendo", "va benissimo"])
  );
}

function extractMessageSignals(message) {
  const normalized = normalizeMessageText(message);
  const explicitDate = findExplicitDateSignal(message);
  const timeMatch = String(message || "").match(/\b(?:alle|ore)?\s*(\d{1,2})(?::|\.)(\d{2})\b|\b(?:alle|ore)\s+(\d{1,2})\b/i);
  const weekday = findFuzzyWord(normalized, ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"]);
  const preference =
    includesFuzzyAny(normalized, ["pomeriggio", "pomeridiano"]) ? "Pomeriggio" :
    includesFuzzyAny(normalized, ["mattina", "mattino"]) ? "Mattina" :
    includesFuzzyAny(normalized, ["sera", "dopo le", "tardo pomeriggio"]) ? "Dopo le 16:00" :
    includesFuzzyAny(normalized, ["anticipare", "anticipo"]) ? "Anticipo richiesto" :
    "";

  return {
    date: explicitDate || (includesFuzzyAny(normalized, ["dopodomani"]) ? "dopodomani" : includesFuzzyAny(normalized, ["domani"]) ? "domani" : includesFuzzyAny(normalized, ["settimana prossima", "prossima settimana"]) ? "settimana prossima" : weekday || ""),
    time: timeMatch ? `${timeMatch[1] || timeMatch[3]}:${timeMatch[2] || "00"}` : includesFuzzyAny(normalized, ["quell'orario", "quel orario"]) ? "orario gia' prenotato" : "",
    preference,
  };
}

function operationsForIntent(intent) {
  const map = {
    rinuncia: ["Identifica l'appuntamento in agenda", "Libera lo slot", "Avvia Fill the Gap sui pazienti compatibili", "Invia risposta di presa in carico"],
    spostamento: ["Controlla l'appuntamento originale", "Cerca orari alternativi", "Invia proposta al paziente", "Monitora lo slot che potrebbe liberarsi"],
    richiesta_disponibilita: ["Filtra agenda per fascia richiesta", "Trova slot liberi compatibili", "Propone due disponibilita'", "Aggiorna la conversazione"],
    preventivo: ["Collega il messaggio al preventivo aperto", "Propone chiarimento o chiamata", "Aggiorna stato preventivo", "Registra la risposta"],
    conferma: ["Conferma lo slot in agenda", "Aggiorna stato conversazione", "Registra conferma nel CRM"],
    da_chiarire: ["Non modifica l'agenda", "Chiede il dettaglio mancante", "Mantiene la richiesta in coda"],
    generico: ["Traccia il messaggio", "Crea attivita' operativa", "Prepara risposta controllata"],
  };
  return map[intent] || map.generico;
}

function toneForIntent(intent) {
  return {
    rinuncia: "rose",
    spostamento: "amber",
    richiesta_disponibilita: "teal",
    preventivo: "amber",
    conferma: "teal",
    da_chiarire: "amber",
    generico: "slate",
  }[intent] || "slate";
}

function analyzeLocally(message, patientName) {
  const normalized = normalizeMessageText(message);
  const signals = extractMessageSignals(message);
  const hasAppointmentReference = includesFuzzyAny(normalized, ["appuntamento", "visita", "igiene", "controllo", "seduta", "prenotazione"]);
  const hasCancellation = includesFuzzyAny(normalized, ["non posso", "non riesco", "non ce la faccio", "rinuncia", "rinunciare", "annullare", "annullo", "disdire", "disdetta", "cancellare", "non vengo", "impossibile venire", "devo saltare"]);
  const hasReschedule = includesFuzzyAny(normalized, ["anticipare", "anticipo", "spostare", "spostamento", "posticipare", "posticipo", "cambiare", "cambio", "altro orario", "quell'orario", "quel orario", "rimandare", "riprogrammare"]);
  const hasAvailability = includesFuzzyAny(normalized, ["posto", "disponibilita", "disponibile", "avete un posto", "avete posto", "c'e posto", "ce posto", "settimana prossima", "prenotare", "quando avete", "slot libero", "orari liberi"]);
  const hasQuote = includesFuzzyAny(normalized, ["preventivo", "prezzo", "costo", "dottore", "impianto", "implantologia", "chiarimento", "proposta"]);
  const hasConfirmation = hasConfirmationIntent(normalized);
  const firstName = String(patientName || "Paziente").split(" ")[0] || "Paziente";
  const detected = [
    `Paziente: ${patientName || "Paziente"}`,
    signals.date ? `Data: ${signals.date}` : "Data: da ricavare dal calendario",
    signals.time ? `Orario: ${signals.time}` : "Orario: da verificare in agenda",
    signals.preference ? `Preferenza: ${signals.preference}` : "Preferenza: non specificata",
  ];

  if (hasReschedule && !hasCancellation && !hasAppointmentReference && !signals.date && !signals.time) {
    return {
      intent: "da_chiarire",
      intentLabel: "Messaggio incompleto",
      confidence: "Media",
      confidenceScore: 0.56,
      detected,
      actionTitle: "Chiede chiarimento prima di agire",
      actionDetail: "Il sistema non modifica l'agenda se mancano appuntamento, data o orario.",
      reply: `Ciao ${firstName}, grazie per averci scritto. A quale appuntamento ti riferisci? Appena ce lo confermi, riorganizziamo lo slot.`,
      status: "Chiarimento richiesto",
      operations: operationsForIntent("da_chiarire"),
    };
  }

  if ((hasCancellation && hasReschedule) || (hasReschedule && hasAppointmentReference)) {
    return {
      intent: "spostamento",
      intentLabel: "Spostamento appuntamento",
      confidence: "Alta",
      confidenceScore: 0.86,
      detected,
      actionTitle: "Controlla agenda e propone un nuovo orario",
      actionDetail: "Il sistema identifica l'appuntamento indicato, cerca disponibilita' alternative e risponde con una proposta compatibile.",
      reply: `Ciao ${firstName}, certo. Controllo subito le disponibilita' per spostare l'appuntamento e ti propongo il primo orario compatibile.`,
      status: "Spostamento proposto",
      operations: operationsForIntent("spostamento"),
    };
  }

  if (hasCancellation) {
    return {
      intent: "rinuncia",
      intentLabel: "Rinuncia appuntamento",
      confidence: "Alta",
      confidenceScore: 0.9,
      detected,
      actionTitle: "Libera lo slot e avvia Fill the Gap",
      actionDetail: "Lo slot viene marcato come da riempire e il sistema prepara i pazienti compatibili da contattare automaticamente.",
      reply: `Grazie ${firstName}, abbiamo ricevuto la rinuncia. Stiamo riorganizzando lo slot e ti proponiamo nuove disponibilita' appena possibile.`,
      status: "Rinuncia gestita",
      operations: operationsForIntent("rinuncia"),
    };
  }

  if (hasAvailability) {
    return {
      intent: "richiesta_disponibilita",
      intentLabel: "Richiesta disponibilita'",
      confidence: "Buona",
      confidenceScore: 0.74,
      detected,
      actionTitle: "Cerca slot compatibili in agenda",
      actionDetail: "Il sistema filtra agenda, fascia preferita e storico WhatsApp del paziente, poi propone due opzioni libere.",
      reply: `Ciao ${firstName}, abbiamo trovato due opzioni compatibili: martedi alle 15:30 oppure giovedi alle 17:00. Quale preferisci?`,
      status: "Disponibilita' proposte",
      operations: operationsForIntent("richiesta_disponibilita"),
    };
  }

  if (hasQuote) {
    return {
      intent: "preventivo",
      intentLabel: "Domanda su preventivo",
      confidence: "Alta",
      confidenceScore: 0.85,
      detected,
      actionTitle: "Aggiorna preventivo e propone chiarimento",
      actionDetail: "La richiesta viene collegata al preventivo aperto e il sistema propone una chiamata con lo studio.",
      reply: `Ciao ${firstName}, certo. Possiamo fissare una breve chiamata con lo studio per chiarire ogni dubbio sul preventivo.`,
      status: "Chiarimento preventivo",
      operations: operationsForIntent("preventivo"),
    };
  }

  if (hasConfirmation) {
    return {
      intent: "conferma",
      intentLabel: "Conferma appuntamento",
      confidence: "Alta",
      confidenceScore: 0.88,
      detected,
      actionTitle: "Conferma appuntamento in agenda",
      actionDetail: "Il sistema registra la conferma e aggiorna lo stato della conversazione.",
      reply: `Perfetto ${firstName}, appuntamento confermato. A presto.`,
      status: "Confermato",
      operations: operationsForIntent("conferma"),
    };
  }

  return {
    intent: "generico",
    intentLabel: "Richiesta generica",
    confidence: "Media",
    confidenceScore: 0.48,
    detected,
    actionTitle: "Crea attivita' operativa",
    actionDetail: "Il messaggio viene tracciato e messo in coda per una risposta automatica controllata.",
    reply: `Ciao ${firstName}, grazie per il messaggio. Lo studio ha preso in carico la richiesta e ti risponde a breve.`,
    status: "Richiesta presa in carico",
    operations: operationsForIntent("generico"),
  };
}

function isPatientDetectedLine(value) {
  const normalized = normalizeMessageText(value).replace(/['’]/g, "");
  return (
    normalized.startsWith("paziente") ||
    normalized.startsWith("nome paziente") ||
    normalized.startsWith("cliente") ||
    normalized.startsWith("contatto") ||
    normalized.startsWith("identita")
  );
}

function normalizeAnalysis(candidate, fallback, patientName = "") {
  const analysis = candidate && typeof candidate === "object" ? candidate : fallback;
  const intent = analysis.intent || fallback.intent || "generico";
  const rawDetected = Array.isArray(analysis.detected) && analysis.detected.length ? analysis.detected.slice(0, 6) : fallback.detected;
  const detected = patientName
    ? [`Paziente: ${patientName}`, "Identita': bloccata dal contatto CRM/WhatsApp", ...rawDetected.filter((item) => !isPatientDetectedLine(item))]
    : rawDetected;

  return {
    ...fallback,
    ...analysis,
    intent,
    intentLabel: analysis.intentLabel || analysis.intent_label || fallback.intentLabel,
    confidence: analysis.confidence || fallback.confidence,
    confidenceScore: typeof analysis.confidenceScore === "number" ? analysis.confidenceScore : fallback.confidenceScore,
    detected: detected.slice(0, 6),
    operations: Array.isArray(analysis.operations) && analysis.operations.length ? analysis.operations.slice(0, 6) : operationsForIntent(intent),
    tone: analysis.tone || toneForIntent(intent),
  };
}

function extractOutputText(payload) {
  if (payload && typeof payload.output_text === "string") return payload.output_text;
  const output = Array.isArray(payload?.output) ? payload.output : [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function extractGeminiText(payload) {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      if (typeof part.text === "string") return part.text;
    }
  }
  return "";
}

function geminiSchemaFromJsonSchema(schema) {
  const convert = (value) => {
    if (!value || typeof value !== "object") return value;
    if (value.type === "object") {
      const properties = {};
      for (const [key, property] of Object.entries(value.properties || {})) {
        properties[key] = convert(property);
      }
      return {
        type: "object",
        properties,
        required: value.required || Object.keys(properties),
      };
    }
    if (value.type === "array") {
      return {
        type: "array",
        items: convert(value.items),
      };
    }
    if (value.type === "string") {
      return {
        type: "string",
        ...(value.enum ? { enum: value.enum } : {}),
      };
    }
    if (value.type === "number") return { type: "number" };
    if (value.type === "integer") return { type: "integer" };
    if (value.type === "boolean") return { type: "boolean" };
    return value;
  };

  return convert(schema);
}

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env["Gemini API Key"] ||
    process.env["Gemini API key"] ||
    process.env["GEMINI API KEY"] ||
    ""
  ).trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI({ message, patientName, context, fallback }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["intent", "intentLabel", "confidence", "confidenceScore", "detected", "actionTitle", "actionDetail", "reply", "status", "operations", "tone"],
    properties: {
      intent: { type: "string", enum: ["rinuncia", "spostamento", "richiesta_disponibilita", "preventivo", "conferma", "da_chiarire", "generico"] },
      intentLabel: { type: "string" },
      confidence: { type: "string", enum: ["Alta", "Buona", "Media", "Bassa"] },
      confidenceScore: { type: "number", minimum: 0, maximum: 1 },
      detected: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
      actionTitle: { type: "string" },
      actionDetail: { type: "string" },
      reply: { type: "string" },
      status: { type: "string" },
      operations: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
      tone: { type: "string", enum: ["slate", "teal", "amber", "rose"] },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input: [
        {
          role: "system",
          content: `Sei il motore operativo di una webapp per studio dentistico italiano. L'identita' del paziente e' gia' nota dal contatto CRM/WhatsApp: ${patientName}. Non devi mai sostituirla con nomi presenti nel testo, nell'agenda o nel contesto. Usa Gemini/OpenAI solo per capire intento, dati utili e azioni operative. Il primo elemento di detected deve essere esattamente "Paziente: ${patientName}". Se il messaggio e' una rinuncia o annullamento, non chiedere chiarimento: collega la richiesta all'appuntamento attivo presente nel contesto o al prossimo appuntamento del paziente. Chiedi chiarimento solo per richieste non operative o non riconoscibili. Rispondi solo con JSON valido nello schema richiesto.`,
        },
        {
          role: "user",
          content: JSON.stringify({ message, patientName, context, localFallback: fallback }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "dental_message_triage",
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText.slice(0, 200)}`);
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("OpenAI response missing output text");
  return JSON.parse(outputText);
}

async function callGemini({ message, patientName, context, fallback }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const schema = {
    type: "object",
    required: ["intent", "intentLabel", "confidence", "confidenceScore", "detected", "actionTitle", "actionDetail", "reply", "status", "operations", "tone"],
    properties: {
      intent: { type: "string", enum: ["rinuncia", "spostamento", "richiesta_disponibilita", "preventivo", "conferma", "da_chiarire", "generico"] },
      intentLabel: { type: "string" },
      confidence: { type: "string", enum: ["Alta", "Buona", "Media", "Bassa"] },
      confidenceScore: { type: "number" },
      detected: { type: "array", items: { type: "string" } },
      actionTitle: { type: "string" },
      actionDetail: { type: "string" },
      reply: { type: "string" },
      status: { type: "string" },
      operations: { type: "array", items: { type: "string" } },
      tone: { type: "string", enum: ["slate", "teal", "amber", "rose"] },
    },
  };

  const configuredModel = String(process.env.GEMINI_MODEL || "").trim();
  const models = [
    configuredModel && !configuredModel.includes("3.5") ? configuredModel : "",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter((model, index, list) => model && list.indexOf(model) === index);

  const basePayload = {
      systemInstruction: {
        parts: [{
          text: `Sei il motore operativo di una webapp per studio dentistico italiano. L'identita' del paziente e' gia' nota dal contatto CRM/WhatsApp: ${patientName}. Non devi mai sostituirla con nomi presenti nel testo, nell'agenda o nel contesto. Usa Gemini solo per capire intento, dati utili e azioni operative. Il primo elemento di detected deve essere esattamente "Paziente: ${patientName}". Se il messaggio e' una rinuncia o annullamento, non chiedere chiarimento: collega la richiesta all'appuntamento attivo presente nel contesto o al prossimo appuntamento del paziente. Chiedi chiarimento solo per richieste non operative o non riconoscibili. Rispondi solo con JSON valido nello schema richiesto.`,
        }],
      },
      contents: [{
        role: "user",
        parts: [{
          text: JSON.stringify({ message, patientName, context, localFallback: fallback }),
        }],
      }],
  };

  let lastError = null;
  const configVariants = [
    {
      responseMimeType: "application/json",
      responseSchema: geminiSchemaFromJsonSchema(schema),
    },
    {
      responseMimeType: "application/json",
    },
  ];

  const attempts = [];
  for (const model of models.slice(0, 2)) {
    attempts.push({ model, generationConfig: configVariants[0] });
  }
  if (models[0]) attempts.push({ model: models[0], generationConfig: configVariants[1] });

  for (const { model, generationConfig } of attempts) {
      const payload = {
        ...basePayload,
        generationConfig,
      };

      const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      }, Number(process.env.AI_REQUEST_TIMEOUT_MS || 3000));

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini request failed: ${response.status} ${errorText.slice(0, 200)}`);
        continue;
      }

      const payloadResponse = await response.json();
      const outputText = extractGeminiText(payloadResponse);
      if (!outputText) {
        lastError = new Error("Gemini response missing output text");
        continue;
      }

      try {
        return JSON.parse(outputText);
      } catch (error) {
        lastError = error;
      }
  }

  if (lastError) throw lastError;
  return null;
}

async function analyzeIncomingMessage({ message = "", patientName = "Paziente", context = {} }) {
  const fallback = normalizeAnalysis(analyzeLocally(message, patientName), analyzeLocally(message, patientName), patientName);
  const isOperationallyClear =
    (
      (fallback.confidenceScore >= 0.86 && ["rinuncia", "spostamento", "conferma"].includes(fallback.intent)) ||
      (fallback.confidenceScore >= 0.84 && fallback.intent === "preventivo") ||
      (fallback.confidenceScore >= 0.74 && fallback.intent === "richiesta_disponibilita")
    ) &&
    process.env.AI_VALIDATE_HIGH_CONFIDENCE !== "true";

  if (isOperationallyClear) {
    return {
      usedOpenAI: false,
      usedGemini: false,
      aiSkipped: true,
      analysis: normalizeAnalysis(
        {
          ...fallback,
          backendNote: "Messaggio operativo ad alta confidenza: azione eseguita subito dal motore locale.",
        },
        fallback,
        patientName
      ),
    };
  }

  try {
    const geminiAnalysis = await callGemini({ message, patientName, context, fallback });
    if (geminiAnalysis) {
      return { usedOpenAI: false, usedGemini: true, analysis: normalizeAnalysis(geminiAnalysis, fallback, patientName) };
    }
  } catch (error) {
    if (!process.env.OPENAI_API_KEY) {
      return {
        usedOpenAI: false,
        usedGemini: false,
        warning: "Gemini non disponibile: usato fallback locale.",
        analysis: normalizeAnalysis({ ...fallback, backendError: "Gemini non disponibile: uso fallback locale." }, fallback, patientName),
      };
    }
  }

  try {
    const aiAnalysis = await callOpenAI({ message, patientName, context, fallback });
    if (aiAnalysis) {
      return { usedOpenAI: true, usedGemini: false, analysis: normalizeAnalysis(aiAnalysis, fallback, patientName) };
    }
  } catch (error) {
    return {
      usedOpenAI: false,
      usedGemini: false,
      warning: "OpenAI non disponibile: usato fallback locale.",
      analysis: normalizeAnalysis({ ...fallback, backendError: "OpenAI non disponibile: uso fallback locale." }, fallback, patientName),
    };
  }

  return { usedOpenAI: false, usedGemini: false, analysis: fallback };
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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const { message = "", patientName = "Paziente", context = {} } = body || {};
    const result = await analyzeIncomingMessage({ message, patientName, context });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "Analisi messaggio non riuscita" });
  }
};

module.exports.analyzeIncomingMessage = analyzeIncomingMessage;

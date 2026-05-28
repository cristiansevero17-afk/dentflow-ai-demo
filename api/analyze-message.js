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

function extractMessageSignals(message) {
  const normalized = normalizeMessageText(message);
  const dateMatch = String(message || "").match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\b/i);
  const timeMatch = String(message || "").match(/\b(?:alle|ore)?\s*(\d{1,2})(?::|\.)(\d{2})\b|\b(?:alle|ore)\s+(\d{1,2})\b/i);
  const weekday = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato"].find((day) => normalized.includes(day));
  const preference =
    normalized.includes("pomeriggio") ? "Pomeriggio" :
    normalized.includes("mattina") ? "Mattina" :
    normalized.includes("sera") || normalized.includes("dopo le") ? "Tardo pomeriggio" :
    normalized.includes("anticip") ? "Anticipo richiesto" :
    "";

  return {
    date: dateMatch ? `${dateMatch[1]} ${dateMatch[2].toLowerCase()}` : normalized.includes("domani") ? "domani" : normalized.includes("settimana prossima") ? "settimana prossima" : weekday || "",
    time: timeMatch ? `${timeMatch[1] || timeMatch[3]}:${timeMatch[2] || "00"}` : normalized.includes("quell'orario") || normalized.includes("quel orario") ? "orario gia' prenotato" : "",
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
  const hasAppointmentReference = includesAny(normalized, ["appuntamento", "visita", "igiene", "controllo", "seduta", "prenotazione"]);
  const hasCancellation = includesAny(normalized, ["non posso", "non riesco", "non ce la faccio", "non ci sono", "rinunc", "annull", "disdett", "cancell", "non vengo", "impossibile venire", "devo saltare"]);
  const hasReschedule = includesAny(normalized, ["anticip", "spost", "posticip", "cambiare", "cambio", "altro orario", "quell'orario", "quel orario", "rimand", "riprogram"]);
  const hasAvailability = includesAny(normalized, ["posto libero", "disponibil", "avete un posto", "c'e posto", "ce posto", "settimana prossima", "prenotare", "quando avete", "slot libero"]);
  const hasQuote = includesAny(normalized, ["preventivo", "prezzo", "costo", "dottore", "implant", "chiarimento"]);
  const hasConfirmation = includesAny(normalized, ["confermo", "ok", "va bene", "ci sono", "si confermo", "si, confermo"]);
  const firstName = String(patientName || "Paziente").split(" ")[0] || "Paziente";
  const detected = [
    `Paziente: ${patientName || "Paziente"}`,
    signals.date ? `Data: ${signals.date}` : "Data: da ricavare dal calendario",
    signals.time ? `Orario: ${signals.time}` : "Orario: da verificare in agenda",
    signals.preference ? `Preferenza: ${signals.preference}` : "Preferenza: non specificata",
  ];

  if ((hasCancellation || hasReschedule) && !hasAppointmentReference && !signals.date && !signals.time) {
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
      actionDetail: "Il sistema filtra agenda, fascia preferita e canale del paziente, poi propone due opzioni libere.",
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
          content: `Sei il motore operativo di una webapp per studio dentistico italiano. L'identita' del paziente e' gia' nota dal contatto CRM/WhatsApp: ${patientName}. Non devi mai sostituirla con nomi presenti nel testo, nell'agenda o nel contesto. Usa Gemini/OpenAI solo per capire intento, dati utili e azioni operative. Il primo elemento di detected deve essere esattamente "Paziente: ${patientName}". Se manca un dato essenziale, non modificare l'agenda: chiedi chiarimento. Rispondi solo con JSON valido nello schema richiesto.`,
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

  const models = [
    process.env.GEMINI_MODEL,
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ].filter((model, index, list) => model && list.indexOf(model) === index);

  const basePayload = {
      systemInstruction: {
        parts: [{
          text: `Sei il motore operativo di una webapp per studio dentistico italiano. L'identita' del paziente e' gia' nota dal contatto CRM/WhatsApp: ${patientName}. Non devi mai sostituirla con nomi presenti nel testo, nell'agenda o nel contesto. Usa Gemini solo per capire intento, dati utili e azioni operative. Il primo elemento di detected deve essere esattamente "Paziente: ${patientName}". Se manca un dato essenziale, non modificare l'agenda: chiedi chiarimento. Rispondi solo con JSON valido nello schema richiesto.`,
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
      responseFormat: {
        text: {
          mimeType: "application/json",
          schema,
        },
      },
    },
    {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
    {
      responseMimeType: "application/json",
      responseSchema: geminiSchemaFromJsonSchema(schema),
    },
    {
      responseMimeType: "application/json",
    },
  ];

  for (const model of models) {
    for (const generationConfig of configVariants) {
      const payload = {
        ...basePayload,
        generationConfig,
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      });

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
  }

  if (lastError) throw lastError;
  return null;
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
    const fallback = normalizeAnalysis(analyzeLocally(message, patientName), analyzeLocally(message, patientName), patientName);

    try {
      const geminiAnalysis = await callGemini({ message, patientName, context, fallback });
      if (geminiAnalysis) {
        res.status(200).json({ usedOpenAI: false, usedGemini: true, analysis: normalizeAnalysis(geminiAnalysis, fallback, patientName) });
        return;
      }
    } catch (error) {
      if (!process.env.OPENAI_API_KEY) {
        res.status(200).json({
          usedOpenAI: false,
          usedGemini: false,
          warning: "Gemini non disponibile: usato fallback locale.",
          analysis: normalizeAnalysis({ ...fallback, backendError: "Gemini non disponibile: uso fallback locale." }, fallback, patientName),
        });
        return;
      }
    }

    try {
      const aiAnalysis = await callOpenAI({ message, patientName, context, fallback });
      if (aiAnalysis) {
        res.status(200).json({ usedOpenAI: true, usedGemini: false, analysis: normalizeAnalysis(aiAnalysis, fallback, patientName) });
        return;
      }
    } catch (error) {
      res.status(200).json({
        usedOpenAI: false,
        usedGemini: false,
        warning: "OpenAI non disponibile: usato fallback locale.",
        analysis: normalizeAnalysis({ ...fallback, backendError: "OpenAI non disponibile: uso fallback locale." }, fallback, patientName),
      });
      return;
    }

    res.status(200).json({ usedOpenAI: false, usedGemini: false, analysis: fallback });
  } catch (error) {
    res.status(500).json({ error: "Analisi messaggio non riuscita" });
  }
};

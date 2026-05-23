import { useState, useEffect } from "react";

const sections = [
  { id: "agenda", label: "Agenda", mark: "AG" },
  { id: "fillgap", label: "Fill the Gap", mark: "FG" },
  { id: "followup", label: "Follow-up", mark: "FU" },
  { id: "pazienti", label: "Pazienti", mark: "PZ" },
  { id: "attesa", label: "Lista d'attesa", mark: "LA" },
  { id: "preventivi", label: "Preventivi", mark: "PV" },
  { id: "automazioni", label: "Automazioni", mark: "AU" },
  { id: "messaggi", label: "Messaggi", mark: "MS" },
  { id: "whatsapp", label: "WhatsApp Web", mark: "WA" },
];

const whatsappLocalServerUrl = "http://localhost:8787";

const initialSlots = [
  { time: "09:00", patient: "Roberto Galli", treatment: "Controllo ortodonzia", status: "completato", channel: "Email" },
  { time: "10:00", patient: "Giulia Ferri", treatment: "Igiene dentale", status: "completato", channel: "WhatsApp" },
  { time: "11:00", patient: "Sara Colombo", treatment: "Visita di controllo", status: "confermato", channel: "WhatsApp" },
  { time: "12:00", patient: "Slot libero", treatment: "Disponibile per urgenze", status: "libero", channel: "-" },
  { time: "14:00", patient: "Marco Riva", treatment: "Devitalizzazione", status: "confermato", channel: "SMS" },
  { time: "15:00", patient: "Paola Esposito", treatment: "Sbiancamento", status: "a rischio", channel: "Email" },
  { time: "16:00", patient: "Giulia Ferri", treatment: "Igiene dentale", status: "confermato", channel: "WhatsApp" },
  { time: "17:00", patient: "Luca Bianchi", treatment: "Controllo", status: "confermato", channel: "WhatsApp" },
  { time: "18:00", patient: "Elena Conti", treatment: "Visita implantologia", status: "confermato", channel: "Telefonata" },
];

const demoAgendaDate = "2026-05-25";
const demoAgendaLabel = "Lunedi 25 maggio";
const demoSlotTime = "16:00";

const monthDays = [
  { key: "2026-05-01", day: 1, weekday: "Ven", label: "Venerdi 1 maggio", closed: false, summary: "5 appuntamenti", tone: "slate" },
  { key: "2026-05-02", day: 2, weekday: "Sab", label: "Sabato 2 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-03", day: 3, weekday: "Dom", label: "Domenica 3 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-04", day: 4, weekday: "Lun", label: "Lunedi 4 maggio", closed: false, summary: "6 appuntamenti", tone: "teal" },
  { key: "2026-05-05", day: 5, weekday: "Mar", label: "Martedi 5 maggio", closed: false, summary: "7 appuntamenti", tone: "teal" },
  { key: "2026-05-06", day: 6, weekday: "Mer", label: "Mercoledi 6 maggio", closed: false, summary: "5 appuntamenti", tone: "slate" },
  { key: "2026-05-07", day: 7, weekday: "Gio", label: "Giovedi 7 maggio", closed: false, summary: "6 appuntamenti", tone: "teal" },
  { key: "2026-05-08", day: 8, weekday: "Ven", label: "Venerdi 8 maggio", closed: false, summary: "4 appuntamenti", tone: "slate" },
  { key: "2026-05-09", day: 9, weekday: "Sab", label: "Sabato 9 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-10", day: 10, weekday: "Dom", label: "Domenica 10 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-11", day: 11, weekday: "Lun", label: "Lunedi 11 maggio", closed: false, summary: "6 appuntamenti", tone: "teal" },
  { key: "2026-05-12", day: 12, weekday: "Mar", label: "Martedi 12 maggio", closed: false, summary: "5 appuntamenti", tone: "slate" },
  { key: "2026-05-13", day: 13, weekday: "Mer", label: "Mercoledi 13 maggio", closed: false, summary: "7 appuntamenti", tone: "teal" },
  { key: "2026-05-14", day: 14, weekday: "Gio", label: "Giovedi 14 maggio", closed: false, summary: "6 appuntamenti", tone: "teal" },
  { key: "2026-05-15", day: 15, weekday: "Ven", label: "Venerdi 15 maggio", closed: false, summary: "5 appuntamenti", tone: "slate" },
  { key: "2026-05-16", day: 16, weekday: "Sab", label: "Sabato 16 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-17", day: 17, weekday: "Dom", label: "Domenica 17 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-18", day: 18, weekday: "Lun", label: "Lunedi 18 maggio", closed: false, summary: "6 appuntamenti", tone: "teal" },
  { key: "2026-05-19", day: 19, weekday: "Mar", label: "Martedi 19 maggio", closed: false, summary: "4 appuntamenti", tone: "slate" },
  { key: "2026-05-20", day: 20, weekday: "Mer", label: "Mercoledi 20 maggio", closed: false, summary: "7 appuntamenti", tone: "teal" },
  { key: "2026-05-21", day: 21, weekday: "Gio", label: "Giovedi 21 maggio", closed: false, summary: "6 appuntamenti", tone: "teal" },
  { key: "2026-05-22", day: 22, weekday: "Ven", label: "Venerdi 22 maggio", closed: false, summary: "5 appuntamenti", tone: "slate" },
  { key: "2026-05-23", day: 23, weekday: "Sab", label: "Sabato 23 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-24", day: 24, weekday: "Dom", label: "Domenica 24 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: demoAgendaDate, day: 25, weekday: "Lun", label: demoAgendaLabel, closed: false, summary: "Scenario Fill the Gap", tone: "amber" },
  { key: "2026-05-26", day: 26, weekday: "Mar", label: "Martedi 26 maggio", closed: false, summary: "7 appuntamenti", tone: "teal" },
  { key: "2026-05-27", day: 27, weekday: "Mer", label: "Mercoledi 27 maggio", closed: false, summary: "6 appuntamenti", tone: "teal" },
  { key: "2026-05-28", day: 28, weekday: "Gio", label: "Giovedi 28 maggio", closed: false, summary: "4 appuntamenti", tone: "slate" },
  { key: "2026-05-29", day: 29, weekday: "Ven", label: "Venerdi 29 maggio", closed: false, summary: "5 appuntamenti", tone: "slate" },
  { key: "2026-05-30", day: 30, weekday: "Sab", label: "Sabato 30 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
  { key: "2026-05-31", day: 31, weekday: "Dom", label: "Domenica 31 maggio", closed: true, summary: "Studio chiuso", tone: "slate" },
];

const monthlyAgendaSlots = {
  "2026-05-01": [
    { time: "09:30", patient: "Nadia Villa", treatment: "Igiene dentale", status: "completato", channel: "WhatsApp" },
    { time: "11:00", patient: "Andrea Moretti", treatment: "Controllo annuale", status: "completato", channel: "SMS" },
    { time: "14:30", patient: "Francesca Sala", treatment: "Prima visita", status: "confermato", channel: "Email" },
    { time: "16:00", patient: "Slot libero", treatment: "Disponibile per urgenze", status: "libero", channel: "-" },
    { time: "17:30", patient: "Giorgio Rinaldi", treatment: "Controllo post-intervento", status: "confermato", channel: "Telefonata" },
  ],
  "2026-05-04": [
    { time: "09:00", patient: "Claudia Neri", treatment: "Igiene dentale", status: "completato", channel: "WhatsApp" },
    { time: "10:30", patient: "Matteo Costa", treatment: "Visita bambini", status: "completato", channel: "Email" },
    { time: "12:00", patient: "Slot libero", treatment: "Pausa operativa", status: "libero", channel: "-" },
    { time: "15:00", patient: "Alessia Fontana", treatment: "Sbiancamento", status: "confermato", channel: "SMS" },
    { time: "17:00", patient: "Dario Rizzi", treatment: "Controllo", status: "confermato", channel: "WhatsApp" },
  ],
  "2026-05-05": [
    { time: "09:00", patient: "Marta Longo", treatment: "Controllo", status: "completato", channel: "WhatsApp" },
    { time: "10:00", patient: "Paolo Ricci", treatment: "Igiene dentale", status: "completato", channel: "SMS" },
    { time: "11:30", patient: "Irene Serra", treatment: "Ortodonzia", status: "confermato", channel: "Email" },
    { time: "14:00", patient: "Federico Bassi", treatment: "Devitalizzazione", status: "confermato", channel: "Telefonata" },
    { time: "16:30", patient: "Silvia Monti", treatment: "Visita bambini", status: "confermato", channel: "WhatsApp" },
  ],
  "2026-05-11": [
    { time: "09:00", patient: "Laura Martini", treatment: "Igiene dentale", status: "completato", channel: "WhatsApp" },
    { time: "11:00", patient: "Gianni Russo", treatment: "Controllo", status: "confermato", channel: "SMS" },
    { time: "14:00", patient: "Serena De Luca", treatment: "Prima visita", status: "confermato", channel: "Email" },
    { time: "16:00", patient: "Slot libero", treatment: "Finestra breve", status: "libero", channel: "-" },
    { time: "18:00", patient: "Carlo Villa", treatment: "Controllo ortodonzia", status: "confermato", channel: "WhatsApp" },
  ],
  "2026-05-18": [
    { time: "09:30", patient: "Chiara Greco", treatment: "Igiene dentale", status: "completato", channel: "WhatsApp" },
    { time: "10:30", patient: "Pietro Ferrara", treatment: "Controllo", status: "completato", channel: "SMS" },
    { time: "12:00", patient: "Slot libero", treatment: "Disponibile per urgenze", status: "libero", channel: "-" },
    { time: "15:30", patient: "Valentina Riva", treatment: "Sbiancamento", status: "a rischio", channel: "Email" },
    { time: "17:30", patient: "Nicola Parisi", treatment: "Controllo post-intervento", status: "confermato", channel: "Telefonata" },
  ],
  "2026-05-26": [
    { time: "09:00", patient: "Luca Bianchi", treatment: "Controllo", status: "confermato", channel: "WhatsApp" },
    { time: "10:00", patient: "Elena Conti", treatment: "Chiarimento preventivo", status: "confermato", channel: "Telefonata" },
    { time: "11:30", patient: "Roberto Galli", treatment: "Ortodonzia invisibile", status: "confermato", channel: "Email" },
    { time: "14:30", patient: "Paola Esposito", treatment: "Sbiancamento", status: "confermato", channel: "Email" },
    { time: "17:00", patient: "Antonio Greco", treatment: "Igiene dentale", status: "confermato", channel: "SMS" },
  ],
  "2026-05-27": [
    { time: "09:00", patient: "Sara Colombo", treatment: "Igiene dentale", status: "confermato", channel: "WhatsApp" },
    { time: "10:30", patient: "Marco Riva", treatment: "Controllo post-intervento", status: "confermato", channel: "SMS" },
    { time: "12:00", patient: "Slot libero", treatment: "Finestra gestione urgenze", status: "libero", channel: "-" },
    { time: "15:00", patient: "Giulia Ferri", treatment: "Controllo", status: "confermato", channel: "WhatsApp" },
    { time: "18:00", patient: "Andrea Moretti", treatment: "Controllo annuale", status: "confermato", channel: "WhatsApp" },
  ],
};

function buildDefaultSlots(day) {
  if (!day || day.closed) return [];
  const names = ["Maria Rossi", "Luca Bianchi", "Sara Colombo", "Elena Conti", "Marco Riva", "Giulia Ferri", "Antonio Greco"];
  const treatments = ["Igiene dentale", "Controllo", "Visita di controllo", "Ortodonzia", "Sbiancamento", "Controllo post-intervento"];
  const channels = ["WhatsApp", "SMS", "Email", "Telefonata"];
  const index = day.day;
  return [
    { time: "09:00", patient: names[index % names.length], treatment: treatments[index % treatments.length], status: index < 23 ? "completato" : "confermato", channel: channels[index % channels.length] },
    { time: "10:30", patient: names[(index + 2) % names.length], treatment: treatments[(index + 1) % treatments.length], status: index < 23 ? "completato" : "confermato", channel: channels[(index + 1) % channels.length] },
    { time: "12:00", patient: "Slot libero", treatment: "Disponibile per urgenze", status: "libero", channel: "-" },
    { time: "15:00", patient: names[(index + 4) % names.length], treatment: treatments[(index + 3) % treatments.length], status: index % 9 === 0 ? "a rischio" : "confermato", channel: channels[(index + 2) % channels.length] },
    { time: "17:30", patient: names[(index + 5) % names.length], treatment: treatments[(index + 4) % treatments.length], status: "confermato", channel: channels[(index + 3) % channels.length] },
  ];
}

const patients = [
  {
    name: "Maria Rossi",
    phone: "+39 333 120 4451",
    email: "maria.rossi@email.it",
    lastVisit: "Igiene dentale, 8 mesi fa",
    nextVisit: "Nessun appuntamento",
    consent: true,
    preferredChannel: "WhatsApp",
    treatments: "Igiene, controllo periodico",
    suggested: "Richiamo igiene",
    badges: ["Lista d'attesa", "Alta compatibilita", "Consenso attivo"],
    notes: "Preferisce appuntamenti nel tardo pomeriggio. Disponibile con poco preavviso.",
    timeline: [
      "Ha richiesto un appuntamento anticipato per igiene.",
      "Ha confermato preferenza WhatsApp per comunicazioni operative.",
      "Ultimo messaggio letto senza necessita di risposta.",
    ],
  },
  {
    name: "Luca Bianchi",
    phone: "+39 347 882 1104",
    email: "luca.bianchi@email.it",
    lastVisit: "Controllo, 7 mesi fa",
    nextVisit: "Lunedi 25 maggio, 17:00",
    consent: true,
    preferredChannel: "WhatsApp",
    treatments: "Controllo, igiene",
    suggested: "Conferma appuntamento",
    badges: ["Igiene scaduta", "Consenso attivo"],
    notes: "Risponde spesso dopo le 18:00.",
    timeline: ["Reminder inviato ieri.", "Appuntamento confermato tramite WhatsApp."],
  },
  {
    name: "Sara Colombo",
    phone: "+39 339 551 9088",
    email: "sara.colombo@email.it",
    lastVisit: "Igiene dentale, 6 mesi fa",
    nextVisit: "Oggi 11:00",
    consent: true,
    preferredChannel: "WhatsApp",
    treatments: "Igiene, controllo gengive",
    suggested: "Prossimo richiamo igiene",
    badges: ["Follow-up attivo", "Consenso attivo"],
    notes: "Chiede spesso disponibilita al mattino.",
    timeline: ["Ha chiesto disponibilita per venerdi mattina.", "Messaggio follow-up letto."],
  },
  {
    name: "Elena Conti",
    phone: "+39 320 774 6619",
    email: "elena.conti@email.it",
    lastVisit: "Prima visita implantologia, 12 giorni fa",
    nextVisit: "Oggi 18:00",
    consent: true,
    preferredChannel: "WhatsApp",
    treatments: "Implantologia",
    suggested: "Chiarimento preventivo",
    badges: ["Preventivo aperto", "Telefonata consigliata"],
    notes: "Vuole parlare con il dottore prima di decidere.",
    timeline: ["Preventivo inviato.", "Ha chiesto una chiamata di chiarimento."],
  },
  {
    name: "Roberto Galli",
    phone: "+39 338 010 4330",
    email: "roberto.galli@email.it",
    lastVisit: "Ortodonzia, oggi",
    nextVisit: "Controllo fra 6 settimane",
    consent: false,
    preferredChannel: "Email",
    treatments: "Ortodonzia invisibile",
    suggested: "Comunicazione solo amministrativa",
    badges: ["Consenso non attivo"],
    notes: "Non inviare campagne automatiche.",
    timeline: ["Preferenza email aggiornata.", "Consenso marketing non attivo."],
  },
  {
    name: "Paola Esposito",
    phone: "+39 331 448 2201",
    email: "paola.esposito@email.it",
    lastVisit: "Sbiancamento, 20 giorni fa",
    nextVisit: "Oggi 15:00",
    consent: true,
    preferredChannel: "Email",
    treatments: "Sbiancamento",
    suggested: "Reminder appuntamento",
    badges: ["A rischio", "Consenso attivo"],
    notes: "Ha chiesto conferma sulle istruzioni pre-visita.",
    timeline: ["Email reminder inviata.", "Non ha ancora confermato lettura."],
  },
  {
    name: "Antonio Greco",
    phone: "+39 366 218 7750",
    email: "antonio.greco@email.it",
    lastVisit: "Igiene dentale, 9 mesi fa",
    nextVisit: "Nessun appuntamento",
    consent: true,
    preferredChannel: "SMS",
    treatments: "Igiene, controllo",
    suggested: "Richiamo igiene",
    badges: ["Disponibile pomeriggio", "Consenso attivo"],
    notes: "Preferisce SMS e appuntamenti dopo le 16:00.",
    timeline: ["Inserito tra i pazienti compatibili per slot pomeridiani."],
  },
  {
    name: "Andrea Moretti",
    phone: "+39 349 887 0044",
    email: "andrea.moretti@email.it",
    lastVisit: "Controllo, 14 mesi fa",
    nextVisit: "Nessun appuntamento",
    consent: true,
    preferredChannel: "WhatsApp",
    treatments: "Controllo annuale",
    suggested: "Paziente inattivo",
    badges: ["Inattivo", "Consenso attivo"],
    notes: "Da riattivare con messaggio gentile e non commerciale.",
    timeline: ["Nessuna visita recente.", "Pronto per campagna pazienti inattivi."],
  },
];

const baseFollowUps = [
  { name: "Sara Colombo", reason: "Igiene dentale ogni 6 mesi", due: "Questa settimana", channel: "WhatsApp", status: "Pronto" },
  { name: "Marco Riva", reason: "Controllo post-intervento", due: "Lunedi 25 maggio", channel: "SMS", status: "In programma" },
  { name: "Elena Conti", reason: "Preventivo non confermato", due: "Oggi", channel: "Telefonata", status: "Da richiamare" },
  { name: "Andrea Moretti", reason: "Paziente inattivo", due: "Questa settimana", channel: "WhatsApp", status: "Pronto" },
];

const waitlist = [
  { name: "Maria Rossi", treatment: "Igiene dentale", preference: "Pomeriggio", urgency: "Alta", lastMinute: "Si", channel: "WhatsApp", consent: true, fit: "Alta" },
  { name: "Antonio Greco", treatment: "Igiene dentale", preference: "Dopo le 16:00", urgency: "Media", lastMinute: "Si", channel: "SMS", consent: true, fit: "Buona" },
  { name: "Giulia Ferri", treatment: "Controllo", preference: "Mattina", urgency: "Media", lastMinute: "No", channel: "WhatsApp", consent: true, fit: "Media" },
  { name: "Luca Bianchi", treatment: "Igiene dentale", preference: "Sera", urgency: "Bassa", lastMinute: "Si", channel: "WhatsApp", consent: true, fit: "Buona" },
  { name: "Roberto Galli", treatment: "Ortodonzia", preference: "Mattina", urgency: "Bassa", lastMinute: "No", channel: "Email", consent: false, fit: "Non contattare" },
];

const candidateList = [
  { name: "Maria Rossi", reason: "Lista d'attesa, preferenza pomeriggio, consenso attivo", channel: "WhatsApp", fit: "Molto alta", consent: true, response: "Si, confermo per lunedi 25 maggio alle 16:00." },
  { name: "Luca Bianchi", reason: "Igiene da riprogrammare, usa WhatsApp", channel: "WhatsApp", fit: "Alta", consent: true, response: "Posso solo dopo le 17:00." },
  { name: "Antonio Greco", reason: "Disponibile dopo le 16:00, canale SMS", channel: "SMS", fit: "Buona", consent: true, response: "Resto in attesa di altre date." },
  { name: "Roberto Galli", reason: "Consenso comunicazioni non attivo", channel: "Email", fit: "Escluso", consent: false, response: "Non contattato." },
];

const quotes = [
  { name: "Elena Conti", treatment: "Trattamento implantare", sent: "12 giorni fa", status: "Chiarimento richiesto", probability: "Alta", last: "Messaggio letto", next: "Proporre chiamata con lo studio", timeline: ["Preventivo inviato dopo prima visita.", "Messaggio gentile inviato dopo alcuni giorni.", "La paziente chiede di parlare con il dottore."] },
  { name: "Roberto Galli", treatment: "Ortodonzia invisibile", sent: "5 giorni fa", status: "In valutazione", probability: "Media", last: "Email consegnata", next: "Reminder soft", timeline: ["Preventivo inviato via email.", "Nessuna risposta ancora registrata."] },
  { name: "Paola Esposito", treatment: "Sbiancamento", sent: "20 giorni fa", status: "Da ricontattare", probability: "Media", last: "Nessuna risposta", next: "Messaggio con disponibilita", timeline: ["Preventivo inviato.", "Reminder non ancora aperto."] },
  { name: "Marco Riva", treatment: "Devitalizzazione", sent: "3 giorni fa", status: "Domande aperte", probability: "Alta", last: "Risposta ricevuta", next: "Segnare domanda per il dottore", timeline: ["Ha chiesto chiarimenti sulla procedura.", "La segreteria deve preparare risposta."] },
];

const initialAutomations = [
  { id: 1, name: "Fill the Gap da rinuncia last-minute", active: true, trigger: "Paziente cancella o rinuncia", channel: "WhatsApp, SMS, Email", lastRun: "Oggi", note: "Propone pazienti compatibili e invia solo con consenso." },
  { id: 2, name: "Reminder appuntamento 24 ore prima", active: true, trigger: "Appuntamento confermato", channel: "WhatsApp", lastRun: "Ieri", note: "Riduce dimenticanze e richieste manuali." },
  { id: 3, name: "Reminder appuntamento 2 ore prima", active: true, trigger: "Visita in giornata", channel: "SMS", lastRun: "Oggi", note: "Messaggio breve e operativo." },
  { id: 4, name: "Richiamo igiene ogni 6 mesi", active: false, trigger: "Igiene completata", channel: "WhatsApp", lastRun: "Non attiva", note: "Invita il paziente a prenotare il prossimo controllo." },
  { id: 5, name: "Follow-up preventivi non confermati", active: true, trigger: "Preventivo inviato", channel: "Email e WhatsApp", lastRun: "Questa settimana", note: "Tiene ordinata la sequenza di ricontatto." },
  { id: 6, name: "Recupero pazienti inattivi", active: false, trigger: "Nessuna visita recente", channel: "WhatsApp", lastRun: "Non attiva", note: "Messaggio gentile, non commerciale." },
  { id: 7, name: "Controllo post-intervento", active: true, trigger: "Intervento completato", channel: "SMS", lastRun: "Ieri", note: "Supporta lo staff nel monitoraggio." },
  { id: 8, name: "Richiesta recensione dopo visita", active: true, trigger: "Visita completata", channel: "Email", lastRun: "Oggi", note: "Invio solo ai pazienti idonei." },
];

const initialConversations = [
  {
    id: "maria",
    name: "Maria Rossi",
    channel: "WhatsApp",
    status: "Risposto",
    preview: "Si, confermo per lunedi 25 maggio alle 16:00.",
    messages: [
      { from: "Studio", text: "Ciao Maria, si e appena liberato uno slot lunedi 25 maggio alle 16:00 per igiene dentale presso Demo Studio Dentistico. Vuoi confermare l'appuntamento? Rispondi SI e lo blocchiamo per te." },
      { from: "Maria", text: "Si, confermo per lunedi 25 maggio alle 16:00." },
    ],
  },
  {
    id: "sara",
    name: "Sara Colombo",
    channel: "WhatsApp",
    status: "Risposto",
    preview: "Avete disponibilita venerdi mattina?",
    messages: [
      { from: "Studio", text: "Ciao Sara, sono passati circa 6 mesi dalla tua ultima igiene dentale. Vuoi che ti proponiamo qualche disponibilita?" },
      { from: "Sara", text: "Avete disponibilita venerdi mattina?" },
    ],
  },
  {
    id: "elena",
    name: "Elena Conti",
    channel: "WhatsApp",
    status: "Da richiamare",
    preview: "Vorrei parlare con il dottore del preventivo.",
    messages: [
      { from: "Studio", text: "Ciao Elena, volevamo sapere se hai avuto modo di valutare il preventivo per il trattamento implantare. Possiamo fissare una breve chiamata con lo studio?" },
      { from: "Elena", text: "Vorrei parlare con il dottore del preventivo." },
    ],
  },
  {
    id: "luca",
    name: "Luca Bianchi",
    channel: "WhatsApp",
    status: "Letto",
    preview: "Reminder consegnato.",
    messages: [
      { from: "Studio", text: "Ciao Luca, ti ricordiamo l'appuntamento di lunedi 25 maggio alle 17:00 per il controllo. Rispondi OK per confermare." },
    ],
  },
];

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function statusStyle(status) {
  const styles = {
    completato: "border-slate-200 bg-slate-100 text-slate-600",
    confermato: "border-teal-200 bg-teal-50 text-teal-700",
    libero: "border-slate-200 bg-white text-slate-500",
    "a rischio": "border-amber-200 bg-amber-50 text-amber-700",
    "da riempire": "border-rose-200 bg-rose-50 text-rose-700",
    riempito: "border-teal-300 bg-teal-100 text-teal-800",
  };
  return styles[status] || "border-slate-200 bg-slate-100 text-slate-600";
}

function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return <span className={classNames("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

function Panel({ children, className = "" }) {
  return <div className={classNames("rounded-lg border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

function Button({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  const variants = {
    primary: "bg-teal-700 text-white hover:bg-teal-800",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    muted: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-700 text-white hover:bg-rose-800",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classNames(
        "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

function PageFrame({ title, subtitle, children }) {
  return (
    <div className="mx-auto min-h-[1180px] w-full max-w-[1500px] px-7 py-8 lg:px-9">
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-normal text-slate-950">{title}</h1>
        {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyLine({ children }) {
  return <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">{children}</div>;
}

function DemoStudioDentisticoApp() {
  const [activeSection, setActiveSection] = useState("agenda");
  const [slots, setSlots] = useState(initialSlots);
  const [selectedAgendaDay, setSelectedAgendaDay] = useState(demoAgendaDate);
  const [gapStatus, setGapStatus] = useState("idle");
  const [gapLog, setGapLog] = useState([]);
  const [followupActive, setFollowupActive] = useState(false);
  const [followupQueue, setFollowupQueue] = useState(baseFollowUps);
  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
  const [patientFilter, setPatientFilter] = useState("Tutti");
  const [patientSearch, setPatientSearch] = useState("");
  const [waitFilter, setWaitFilter] = useState("Tutti");
  const [selectedQuote, setSelectedQuote] = useState(quotes[0]);
  const [quoteFilter, setQuoteFilter] = useState("Tutti");
  const [automations, setAutomations] = useState(initialAutomations);
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState(initialConversations[0]);
  const [whatsappStatus, setWhatsappStatus] = useState("not_connected");
  const [realWhatsapp, setRealWhatsapp] = useState({
    available: false,
    status: "offline",
    qr: null,
    studioNumber: null,
    error: null,
  });
  const [patientQr, setPatientQr] = useState({
    phone: "",
    qr: null,
    url: "",
    error: "",
    loading: false,
  });
  const [whatsappEvents, setWhatsappEvents] = useState([
    "Sistema pronto per ricevere messaggi operativi dai pazienti collegati alla demo.",
  ]);

  const activeLabel = sections.find((section) => section.id === activeSection)?.label || "Agenda";
  const whatsappHeaderConnected = whatsappStatus === "connected" || realWhatsapp.status === "connected";
  const targetSlot = slots.find((slot) => slot.time === "16:00");
  const selectedMonthDay = monthDays.find((day) => day.key === selectedAgendaDay) || monthDays.find((day) => day.key === demoAgendaDate);
  const selectedDaySlots =
    selectedAgendaDay === demoAgendaDate
      ? slots
      : monthlyAgendaSlots[selectedAgendaDay] || buildDefaultSlots(selectedMonthDay);

  useEffect(() => {
    const scrollArea = document.querySelector("[data-app-scroll]");
    if (scrollArea) scrollArea.scrollTop = 0;
  }, [activeSection]);

  useEffect(() => {
    const current = conversations.find((conversation) => conversation.id === selectedConversation?.id);
    if (current) setSelectedConversation(current);
  }, [conversations]);

  useEffect(() => {
    let source;
    let closed = false;

    async function connectToLocalBridge() {
      try {
        const response = await fetch(`${whatsappLocalServerUrl}/api/whatsapp/status`, { cache: "no-store" });
        if (!response.ok) throw new Error("Server locale non disponibile");
        const data = await response.json();
        if (closed) return;

        setRealWhatsapp({
          available: true,
          status: data.status || "idle",
          qr: data.qr || null,
          studioNumber: data.studioNumber || null,
          error: data.error || null,
        });

        source = new EventSource(`${whatsappLocalServerUrl}/api/whatsapp/events`);
        source.addEventListener("status", (event) => {
          const payload = JSON.parse(event.data);
          setRealWhatsapp({
            available: true,
            status: payload.status || "idle",
            qr: payload.qr || null,
            studioNumber: payload.studioNumber || null,
            error: payload.error || null,
          });
        });
        source.addEventListener("log", (event) => {
          const payload = JSON.parse(event.data);
          if (payload.message) setWhatsappEvents((events) => [payload.message, ...events]);
        });
        source.addEventListener("cancellation", (event) => {
          handleRealWhatsAppCancellation(JSON.parse(event.data));
        });
      } catch (error) {
        if (!closed) {
          setRealWhatsapp({
            available: false,
            status: "offline",
            qr: null,
            studioNumber: null,
            error: "Server WhatsApp locale non avviato",
          });
        }
      }
    }

    connectToLocalBridge();
    return () => {
      closed = true;
      if (source) source.close();
    };
  }, []);

  function markSlotAsOpen(source = "manual") {
    setSlots((current) =>
      current.map((slot) =>
        slot.time === "16:00"
          ? { ...slot, patient: "Slot da riempire", treatment: "Igiene dentale", status: "da riempire", channel: "WhatsApp" }
          : slot
      )
    );
    setGapStatus("detected");
    setGapLog([
      "Rinuncia ricevuta per lo slot di lunedi 25 maggio alle 16:00.",
      "Sistema in ricerca di pazienti compatibili con consenso attivo.",
    ]);
    if (source === "whatsapp") {
      setWhatsappEvents((events) => [
        "Messaggio ricevuto da Giulia Ferri: devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00.",
        "Demo Studio Dentistico ha rilevato uno slot da riempire e ha preparato la lista dei pazienti compatibili.",
        ...events,
      ]);
    }
  }

  function simulateCancellation() {
    setSelectedAgendaDay(demoAgendaDate);
    markSlotAsOpen("manual");
    addOrUpdateConversation({
      id: "giulia-rinuncia",
      name: "Giulia Ferri",
      channel: "WhatsApp",
      status: "Rinuncia ricevuta",
      preview: "Devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00.",
      messages: [
        { from: "Giulia", text: "Buongiorno, devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00. Mi dispiace." },
        { from: "Studio", text: "Grazie per averci avvisato. Ti proponiamo nuove disponibilita appena possibile." },
      ],
    });
    setActiveSection("fillgap");
  }

  function addOrUpdateConversation(nextConversation) {
    setConversations((current) => {
      const exists = current.some((conversation) => conversation.id === nextConversation.id);
      if (exists) return current.map((conversation) => (conversation.id === nextConversation.id ? nextConversation : conversation));
      return [nextConversation, ...current];
    });
  }

  function runFillGapCampaign(mode = "manual", force = false) {
    if (!force && gapStatus === "filled") return;
    setGapStatus("sending");
    setGapLog([
      mode === "auto" ? "Automazione Fill the Gap avviata dopo rinuncia WhatsApp reale." : "Campagna Fill the Gap avviata dallo staff.",
      "Messaggi preparati solo per pazienti con consenso attivo.",
      "Invio in corso su WhatsApp e SMS secondo preferenza del paziente.",
    ]);

    setTimeout(() => {
      setGapLog((current) => [
        "Maria Rossi ha risposto: Si, confermo per lunedi 25 maggio alle 16:00.",
        "Luca Bianchi ha risposto: posso solo dopo le 17:00.",
        ...current,
      ]);
    }, 700);

    setTimeout(() => {
      setSlots((current) =>
        current.map((slot) =>
          slot.time === "16:00"
            ? { ...slot, patient: "Maria Rossi", treatment: "Igiene dentale", status: "riempito", channel: "WhatsApp" }
            : slot
        )
      );
      setGapStatus("filled");
      setGapLog((current) => ["Slot assegnato automaticamente a Maria Rossi.", "Conferma registrata in agenda.", ...current]);
      addOrUpdateConversation({
        id: "maria",
        name: "Maria Rossi",
        channel: "WhatsApp",
        status: "Risposto",
        preview: "Si, confermo per lunedi 25 maggio alle 16:00.",
        messages: [
          { from: "Studio", text: "Ciao Maria, si e appena liberato uno slot lunedi 25 maggio alle 16:00 per igiene dentale presso Demo Studio Dentistico. Vuoi confermare l'appuntamento? Rispondi SI e lo blocchiamo per te." },
          { from: "Maria", text: "Si, confermo per lunedi 25 maggio alle 16:00." },
          { from: "Studio", text: "Perfetto, appuntamento confermato. A lunedi." },
        ],
      });
    }, 1500);
  }

  function activateFollowup() {
    setFollowupActive(true);
    setAutomations((current) =>
      current.map((automation) =>
        automation.name === "Richiamo igiene ogni 6 mesi"
          ? { ...automation, active: true, lastRun: "Attivata ora" }
          : automation
      )
    );
    setFollowupQueue((current) => {
      if (current.some((item) => item.name === "Maria Rossi" && item.reason === "Richiamo igiene automatico")) return current;
      return [
        { name: "Maria Rossi", reason: "Richiamo igiene automatico", due: "Oggi", channel: "WhatsApp", status: "Pronto" },
        { name: "Antonio Greco", reason: "Richiamo igiene automatico", due: "Lunedi 25 maggio", channel: "SMS", status: "Pronto" },
        ...current,
      ];
    });
  }

  function connectWhatsAppDemo() {
    if (whatsappStatus === "connected") return;
    setWhatsappStatus("pairing");
    setWhatsappEvents((events) => ["QR demo generato. In attesa di collegamento con il dispositivo dello studio.", ...events]);
    setTimeout(() => {
      setWhatsappStatus("connected");
      setWhatsappEvents((events) => ["WhatsApp Web demo collegato. La postazione puo ricevere eventi in tempo reale.", ...events]);
    }, 1000);
  }

  function triggerWhatsappCancellation() {
    if (whatsappStatus !== "connected") return;
    setSelectedAgendaDay(demoAgendaDate);
    markSlotAsOpen("whatsapp");
    addOrUpdateConversation({
      id: "giulia-rinuncia",
      name: "Giulia Ferri",
      channel: "WhatsApp",
      status: "Rinuncia ricevuta",
      preview: "Devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00.",
      messages: [
        { from: "Giulia", text: "Buongiorno, devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00. Mi dispiace." },
        { from: "Studio", text: "Grazie per averci avvisato. Ti proponiamo nuove disponibilita appena possibile." },
      ],
    });
  }

  async function connectRealWhatsApp() {
    try {
      setRealWhatsapp((current) => ({ ...current, available: true, status: "starting", error: null }));
      const response = await fetch(`${whatsappLocalServerUrl}/api/whatsapp/connect`, { method: "POST" });
      if (!response.ok) throw new Error("Server locale non disponibile");
      const data = await response.json();
      setRealWhatsapp({
        available: true,
        status: data.status || "starting",
        qr: data.qr || null,
        studioNumber: data.studioNumber || null,
        error: data.error || null,
      });
      setWhatsappEvents((events) => ["Collegamento reale avviato. Se compare il QR, scansionalo da WhatsApp sul telefono.", ...events]);
    } catch (error) {
      setRealWhatsapp({
        available: false,
        status: "offline",
        qr: null,
        studioNumber: null,
        error: "Avvia prima il server locale con npm.cmd run whatsapp-demo",
      });
      setWhatsappEvents((events) => ["Server WhatsApp locale non raggiungibile. Avvia npm.cmd run whatsapp-demo e ricarica la demo.", ...events]);
    }
  }

  async function disconnectRealWhatsApp() {
    try {
      await fetch(`${whatsappLocalServerUrl}/api/whatsapp/disconnect`, { method: "POST" });
    } catch (error) {
      setWhatsappEvents((events) => ["Non riesco a disconnettere il server locale. Puoi chiudere il terminale del server.", ...events]);
    }
  }

  function handleRealWhatsAppCancellation(payload) {
    const contactName = payload.contactName || "Paziente WhatsApp";
    const messageText = payload.body || "Messaggio di rinuncia ricevuto via WhatsApp.";

    setSelectedAgendaDay(demoAgendaDate);
    markSlotAsOpen("real");
    setWhatsappEvents((events) => [
      `Messaggio reale ricevuto da ${contactName}: ${messageText}`,
      "Il sistema ha riconosciuto una rinuncia e ha preparato lo scenario Fill the Gap.",
      ...events,
    ]);
    addOrUpdateConversation({
      id: "whatsapp-reale-rinuncia",
      name: contactName,
      channel: "WhatsApp reale",
      status: "Rinuncia ricevuta",
      preview: messageText,
      messages: [
        { from: contactName, text: messageText },
        { from: "Studio", text: "Grazie per averci avvisato. Ti proponiamo nuove disponibilita appena possibile." },
      ],
    });
    setActiveSection("fillgap");
    setTimeout(() => runFillGapCampaign("auto", true), 900);
  }

  async function generatePatientQr() {
    const phone = (patientQr.phone || realWhatsapp.studioNumber || "").replace(/[^\d]/g, "");
    const text = "Buongiorno, devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00. Mi dispiace.";

    if (!phone) {
      setPatientQr((current) => ({
        ...current,
        error: "Inserisci il numero WhatsApp dello studio con prefisso internazionale, ad esempio 393331234567.",
      }));
      return;
    }

    try {
      setPatientQr((current) => ({ ...current, phone, loading: true, error: "" }));
      const response = await fetch(`${whatsappLocalServerUrl}/api/whatsapp/chat-qr?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossibile generare il QR paziente");
      setPatientQr({
        phone: data.phone,
        qr: data.qr,
        url: data.url,
        error: "",
        loading: false,
      });
    } catch (error) {
      setPatientQr((current) => ({
        ...current,
        loading: false,
        error: "Avvia il server locale e inserisci un numero WhatsApp valido dello studio.",
      }));
    }
  }

  function resetScenario() {
    setSlots(initialSlots);
    setSelectedAgendaDay(demoAgendaDate);
    setGapStatus("idle");
    setGapLog([]);
    setWhatsappEvents(["Scenario ripristinato. Puoi simulare una nuova rinuncia dall'agenda o da WhatsApp Web."]);
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(patientSearch.toLowerCase());
    const matchesFilter = patientFilter === "Tutti" || patient.badges.some((badge) => badge.toLowerCase().includes(patientFilter.toLowerCase()));
    return matchesSearch && matchesFilter;
  });

  const filteredWaitlist = waitlist.filter((item) => waitFilter === "Tutti" || item.treatment === waitFilter || item.channel === waitFilter || item.fit === waitFilter);
  const filteredQuotes = quotes.filter((quote) => quoteFilter === "Tutti" || quote.status === quoteFilter || quote.probability === quoteFilter);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <aside className="flex h-screen w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-24 flex-shrink-0 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">D</div>
          <div>
            <div className="font-bold text-slate-950">Demo Studio Dentistico</div>
            <div className="text-xs text-slate-500">Studio demo · Milano</div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={classNames(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition",
                  activeSection === section.id ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span className={classNames("flex h-8 w-8 items-center justify-center rounded-md border text-[11px] font-bold", activeSection === section.id ? "border-teal-200 bg-white text-teal-700" : "border-slate-200 bg-slate-50 text-slate-500")}>{section.mark}</span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-shrink-0 border-t border-slate-100 p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            <div className="mb-1 font-semibold text-slate-800">Demo operativa</div>
            Comunicazioni inviate solo a pazienti con consenso attivo. Il sistema supporta lo staff e non sostituisce il medico.
          </div>
        </div>
      </aside>

      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-20 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-7">
          <div>
            <div className="text-sm font-bold text-slate-950">{activeLabel}</div>
            <div className="mt-1 text-xs text-slate-500">Console demo · simulazione studio dentistico</div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={whatsappHeaderConnected ? "teal" : "slate"}>{whatsappHeaderConnected ? "WhatsApp collegato" : "WhatsApp non collegato"}</Badge>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">A</div>
          </div>
        </header>

        <div data-app-scroll className="min-w-0 flex-1 overflow-y-auto">
          {activeSection === "agenda" && (
            <AgendaSectionMonthly
              monthDays={monthDays}
              selectedAgendaDay={selectedAgendaDay}
              setSelectedAgendaDay={setSelectedAgendaDay}
              selectedMonthDay={selectedMonthDay}
              selectedDaySlots={selectedDaySlots}
              targetSlot={targetSlot}
              simulateCancellation={simulateCancellation}
              resetScenario={resetScenario}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "fillgap" && (
            <FillGapSection
              status={gapStatus}
              log={gapLog}
              slot={targetSlot}
              simulateCancellation={simulateCancellation}
              runCampaign={runFillGapCampaign}
              setActiveSection={setActiveSection}
            />
          )}
          {activeSection === "followup" && (
            <FollowUpSection active={followupActive} queue={followupQueue} activateFollowup={activateFollowup} />
          )}
          {activeSection === "pazienti" && (
            <PatientsSection
              patients={filteredPatients}
              selectedPatient={selectedPatient}
              setSelectedPatient={setSelectedPatient}
              filter={patientFilter}
              setFilter={setPatientFilter}
              search={patientSearch}
              setSearch={setPatientSearch}
            />
          )}
          {activeSection === "attesa" && (
            <WaitlistSection items={filteredWaitlist} filter={waitFilter} setFilter={setWaitFilter} setActiveSection={setActiveSection} />
          )}
          {activeSection === "preventivi" && (
            <QuotesSection quotes={filteredQuotes} selectedQuote={selectedQuote} setSelectedQuote={setSelectedQuote} filter={quoteFilter} setFilter={setQuoteFilter} />
          )}
          {activeSection === "automazioni" && (
            <AutomationsSection automations={automations} setAutomations={setAutomations} />
          )}
          {activeSection === "messaggi" && (
            <MessagesSection conversations={conversations} selected={selectedConversation} setSelected={setSelectedConversation} setActiveSection={setActiveSection} />
          )}
          {activeSection === "whatsapp" && (
            <WhatsAppSection
              status={whatsappStatus}
              realWhatsapp={realWhatsapp}
              patientQr={patientQr}
              setPatientQr={setPatientQr}
              events={whatsappEvents}
              connect={connectWhatsAppDemo}
              connectReal={connectRealWhatsApp}
              disconnectReal={disconnectRealWhatsApp}
              generatePatientQr={generatePatientQr}
              triggerCancellation={triggerWhatsappCancellation}
              setActiveSection={setActiveSection}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function AgendaSectionMonthly({
  monthDays,
  selectedAgendaDay,
  setSelectedAgendaDay,
  selectedMonthDay,
  selectedDaySlots,
  targetSlot,
  simulateCancellation,
  resetScenario,
  setActiveSection,
}) {
  const weekLabels = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const leadingEmptyDays = 4;

  return (
    <PageFrame title="Agenda operativa" subtitle="Vista mensile dello studio con dettaglio giornaliero. Il caso Fill the Gap resta evidenziato sul lunedi 25 maggio alle 16:00.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-bold text-slate-950">Maggio 2026</h2>
                <p className="mt-1 text-sm text-slate-500">Calendario completo del mese. Clicca una data per vedere gli slot della giornata.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={simulateCancellation} variant="primary">Simula rinuncia appuntamento</Button>
                <Button onClick={resetScenario} variant="secondary">Ripristina scenario</Button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-6 py-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                {weekLabels.map((label) => <div key={label}>{label}</div>)}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {Array.from({ length: leadingEmptyDays }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[92px] rounded-lg border border-transparent" />
                ))}
                {monthDays.map((day) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedAgendaDay(day.key)}
                    className={classNames(
                      "min-h-[92px] rounded-lg border p-3 text-left transition",
                      selectedAgendaDay === day.key
                        ? "border-teal-500 bg-teal-50 shadow-sm"
                        : day.closed
                          ? "border-slate-100 bg-slate-50 text-slate-400"
                          : "border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={classNames("text-sm font-bold", selectedAgendaDay === day.key ? "text-teal-800" : "text-slate-900")}>{day.day}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{day.weekday}</span>
                    </div>
                    <div className={classNames("mt-3 text-xs leading-5", day.closed ? "text-slate-400" : selectedAgendaDay === day.key ? "text-teal-700" : "text-slate-500")}>{day.summary}</div>
                    {day.key === demoAgendaDate && <div className="mt-2 h-1.5 w-10 rounded-full bg-amber-500" />}
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="font-bold text-slate-950">{selectedMonthDay?.label} - Demo Studio Dentistico</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedMonthDay?.closed ? "Studio chiuso." : "Orario studio: lunedi-venerdi 9:00-19:00"}
                </p>
              </div>
              {selectedAgendaDay !== demoAgendaDate && (
                <Button onClick={() => setSelectedAgendaDay(demoAgendaDate)} variant="secondary">Vai allo scenario Fill the Gap</Button>
              )}
            </div>

            {selectedMonthDay?.closed ? (
              <div className="p-6">
                <EmptyLine>Giornata non operativa. Seleziona un giorno feriale per vedere appuntamenti e slot disponibili.</EmptyLine>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {selectedDaySlots.map((slot) => (
                  <div key={`${selectedAgendaDay}-${slot.time}`} className={classNames("grid grid-cols-[90px_1fr_170px_150px] items-center gap-4 px-6 py-4 text-sm", slot.status === "da riempire" ? "bg-rose-50/70" : slot.status === "riempito" ? "bg-teal-50/80" : "")}>
                    <div className="font-mono text-sm font-bold text-slate-600">{slot.time}</div>
                    <div>
                      <div className="font-semibold text-slate-950">{slot.patient}</div>
                      <div className="mt-0.5 text-slate-500">{slot.treatment}</div>
                    </div>
                    <div className="text-slate-500">{slot.channel}</div>
                    <div className="text-right">
                      <span className={classNames("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusStyle(slot.status))}>{slot.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="p-6">
            <h3 className="font-bold text-slate-950">Scenario demo</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Lo slot delle 16:00 di lunedi 25 maggio e il punto centrale della simulazione. Quando il paziente rinuncia, il sistema prepara il Fill the Gap e suggerisce chi contattare.
            </p>
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot monitorato</div>
              <div className="mt-2 text-lg font-bold text-slate-950">25 maggio, 16:00 - {targetSlot?.treatment}</div>
              <div className="mt-2"><span className={classNames("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusStyle(targetSlot?.status))}>{targetSlot?.status}</span></div>
            </div>
            <Button onClick={() => setActiveSection("fillgap")} variant="secondary" className="mt-5 w-full">Apri Fill the Gap</Button>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-bold text-slate-950">Flusso previsto</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <StepLine step="1" text="Rinuncia ricevuta da agenda o WhatsApp." />
              <StepLine step="2" text="Ricerca pazienti compatibili con consenso attivo." />
              <StepLine step="3" text="Invio messaggi su canale preferito." />
              <StepLine step="4" text="Prima conferma valida aggiorna l'agenda." />
            </div>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}

function AgendaSection({ slots, targetSlot, simulateCancellation, resetScenario, setActiveSection }) {
  return (
    <PageFrame title="Agenda operativa" subtitle="La demo parte da una situazione reale: un paziente rinuncia a un appuntamento e lo studio deve decidere come gestire lo slot senza chiamate manuali disordinate.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="font-bold text-slate-950">Lunedi 25 maggio - Demo Studio Dentistico</h2>
              <p className="mt-1 text-sm text-slate-500">Orario studio: lunedi-venerdi 9:00-19:00</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={simulateCancellation} variant="primary">Simula rinuncia appuntamento</Button>
              <Button onClick={resetScenario} variant="secondary">Ripristina scenario</Button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {slots.map((slot) => (
              <div key={slot.time} className={classNames("grid grid-cols-[90px_1fr_170px_150px] items-center gap-4 px-6 py-4 text-sm", slot.status === "da riempire" ? "bg-rose-50/70" : slot.status === "riempito" ? "bg-teal-50/80" : "")}>
                <div className="font-mono text-sm font-bold text-slate-600">{slot.time}</div>
                <div>
                  <div className="font-semibold text-slate-950">{slot.patient}</div>
                  <div className="mt-0.5 text-slate-500">{slot.treatment}</div>
                </div>
                <div className="text-slate-500">{slot.channel}</div>
                <div className="text-right">
                  <span className={classNames("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusStyle(slot.status))}>{slot.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            <h3 className="font-bold text-slate-950">Scenario demo</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Lo slot delle 16:00 e il punto centrale della simulazione. Quando il paziente rinuncia, il sistema prepara il Fill the Gap e suggerisce chi contattare.
            </p>
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot monitorato</div>
              <div className="mt-2 text-lg font-bold text-slate-950">16:00 · {targetSlot?.treatment}</div>
              <div className="mt-2"><span className={classNames("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", statusStyle(targetSlot?.status))}>{targetSlot?.status}</span></div>
            </div>
            <Button onClick={() => setActiveSection("fillgap")} variant="secondary" className="mt-5 w-full">Apri Fill the Gap</Button>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-bold text-slate-950">Flusso previsto</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <StepLine step="1" text="Rinuncia ricevuta da agenda o WhatsApp." />
              <StepLine step="2" text="Ricerca pazienti compatibili con consenso attivo." />
              <StepLine step="3" text="Invio messaggi su canale preferito." />
              <StepLine step="4" text="Prima conferma valida aggiorna l'agenda." />
            </div>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}

function StepLine({ step, text }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{step}</span>
      <span className="leading-6">{text}</span>
    </div>
  );
}

function FillGapSection({ status, log, slot, simulateCancellation, runCampaign, setActiveSection }) {
  const hasDetectedSlot = status !== "idle" || slot?.status === "da riempire" || slot?.status === "riempito";
  return (
    <PageFrame title="Fill the Gap" subtitle="Simula il recupero operativo di uno slot lasciato libero: il sistema rileva la rinuncia, seleziona pazienti compatibili e aggiorna l'agenda quando arriva una conferma.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Panel className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot da gestire</div>
                <h2 className="mt-2 text-xl font-bold text-slate-950">Lunedi 25 maggio, 16:00 - Igiene dentale</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Stato attuale: <span className={classNames("ml-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusStyle(slot?.status))}>{slot?.status}</span>
                </p>
              </div>
              {!hasDetectedSlot ? (
                <Button onClick={simulateCancellation}>Simula rinuncia</Button>
              ) : (
                <Button onClick={runCampaign} disabled={status === "sending" || status === "filled"}>
                  {status === "filled" ? "Slot gia riempito" : status === "sending" ? "Invio in corso" : "Avvia Fill the Gap"}
                </Button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <WorkflowState active={hasDetectedSlot} done={hasDetectedSlot} label="Rinuncia rilevata" />
              <WorkflowState active={status === "detected" || status === "sending" || status === "filled"} done={status === "sending" || status === "filled"} label="Pazienti selezionati" />
              <WorkflowState active={status === "sending" || status === "filled"} done={status === "filled"} label="Messaggi inviati" />
              <WorkflowState active={status === "filled"} done={status === "filled"} label="Agenda aggiornata" />
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-950">Pazienti suggeriti</h3>
                <p className="mt-1 text-sm text-slate-500">La selezione considera lista d'attesa, preferenza oraria, trattamento richiesto e consenso.</p>
              </div>
              <Badge tone="teal">Consenso verificato</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {candidateList.map((candidate) => (
                <div key={candidate.name} className={classNames("rounded-lg border p-4", candidate.consent ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{candidate.name}</div>
                      <div className="mt-1 text-sm text-slate-500">{candidate.reason}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone={candidate.consent ? "teal" : "slate"}>{candidate.channel}</Badge>
                      <Badge tone={candidate.fit === "Escluso" ? "rose" : candidate.fit === "Buona" ? "slate" : "teal"}>{candidate.fit}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-bold text-slate-950">Anteprima messaggio</h3>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              Ciao Maria, si e appena liberato uno slot lunedi 25 maggio alle 16:00 per igiene dentale presso Demo Studio Dentistico.
              Vuoi confermare l'appuntamento? Rispondi SI e lo blocchiamo per te.
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Invio solo a pazienti con consenso comunicazioni attivo. Ogni messaggio puo includere indicazioni per non ricevere ulteriori comunicazioni non necessarie.
            </p>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="p-6">
            <h3 className="font-bold text-slate-950">Risposte simulate</h3>
            <div className="mt-4 space-y-3">
              {log.length === 0 ? (
                <EmptyLine>Avvia la rinuncia o collega WhatsApp Web per generare gli eventi della simulazione.</EmptyLine>
              ) : (
                log.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">{item}</div>
                ))
              )}
            </div>
          </Panel>

          <Panel className="p-6">
            <h3 className="font-bold text-slate-950">Esito operativo</h3>
            {status === "filled" ? (
              <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-800">
                Maria Rossi ha confermato. Lo slot di lunedi 25 maggio alle 16:00 risulta aggiornato in agenda e la segreteria puo proseguire senza chiamate manuali.
              </div>
            ) : (
              <div className="mt-4 text-sm leading-6 text-slate-600">
                La demo mostra come lo staff passa da una rinuncia a una proposta automatizzata, mantenendo controllo e consenso.
              </div>
            )}
            <div className="mt-5 grid grid-cols-1 gap-3">
              <Button variant="secondary" onClick={() => setActiveSection("agenda")}>Vedi agenda</Button>
              <Button variant="secondary" onClick={() => setActiveSection("messaggi")}>Apri messaggi</Button>
            </div>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}

function WorkflowState({ label, active, done }) {
  return (
    <div className={classNames("rounded-lg border p-4", done ? "border-teal-200 bg-teal-50" : active ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50")}>
      <div className={classNames("mb-3 h-2 w-10 rounded-full", done ? "bg-teal-600" : active ? "bg-slate-500" : "bg-slate-200")} />
      <div className={classNames("text-sm font-semibold", done ? "text-teal-800" : active ? "text-slate-800" : "text-slate-400")}>{label}</div>
    </div>
  );
}

function FollowUpSection({ active, queue, activateFollowup }) {
  return (
    <PageFrame title="Follow-up" subtitle="Qui lo studio vede quali pazienti richiamare e quali automazioni sono pronte per evitare che controlli, igieni e trattamenti consigliati vengano dimenticati.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="font-bold text-slate-950">Coda richiami</h2>
              <p className="mt-1 text-sm text-slate-500">Pazienti ordinati per prossima azione consigliata.</p>
            </div>
            <Button onClick={activateFollowup} disabled={active}>{active ? "Follow-up igiene attivo" : "Attiva follow-up igiene"}</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Paziente</th>
                  <th className="px-6 py-3">Motivo richiamo</th>
                  <th className="px-6 py-3">Quando</th>
                  <th className="px-6 py-3">Canale</th>
                  <th className="px-6 py-3">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item, index) => (
                  <tr key={`${item.name}-${item.reason}-${index}`} className="bg-white">
                    <td className="px-6 py-4 font-semibold text-slate-950">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600">{item.reason}</td>
                    <td className="px-6 py-4 text-slate-600">{item.due}</td>
                    <td className="px-6 py-4 text-slate-600">{item.channel}</td>
                    <td className="px-6 py-4"><Badge tone={item.status === "Da richiamare" ? "amber" : "teal"}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-bold text-slate-950">Builder automazione</h2>
          <div className="mt-5 space-y-4">
            <Field label="Trigger" value="Igiene dentale completata" />
            <Field label="Attesa" value="5 mesi e 20 giorni" />
            <Field label="Canale" value="WhatsApp se consenso attivo, altrimenti email operativa" />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Messaggio</label>
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                Ciao Sara, sono passati circa 6 mesi dalla tua ultima igiene dentale. Ti consigliamo di prenotare un controllo per mantenere denti e gengive in salute. Vuoi che ti proponiamo qualche disponibilita?
              </div>
            </div>
            <Badge tone={active ? "teal" : "slate"}>{active ? "Automazione attiva" : "Automazione in bozza"}</Badge>
          </div>
        </Panel>
      </div>
    </PageFrame>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{value}</div>
    </div>
  );
}

function PatientsSection({ patients, selectedPatient, setSelectedPatient, filter, setFilter, search, setSearch }) {
  return (
    <PageFrame title="Pazienti" subtitle="CRM operativo dello studio: consensi, preferenze, trattamenti e prossima azione consigliata sono visibili in un unico punto.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_430px]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 px-6 py-5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cerca paziente"
              className="min-w-[240px] flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500">
              <option>Tutti</option>
              <option>Lista d'attesa</option>
              <option>Igiene scaduta</option>
              <option>Preventivo aperto</option>
              <option>Inattivo</option>
              <option>Consenso attivo</option>
            </select>
          </div>
          <div className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <button
                key={patient.name}
                type="button"
                onClick={() => setSelectedPatient(patient)}
                className={classNames("block w-full px-6 py-4 text-left transition hover:bg-slate-50", selectedPatient?.name === patient.name ? "bg-teal-50/70" : "bg-white")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{patient.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{patient.lastVisit}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {patient.badges.slice(0, 2).map((badge) => <Badge key={badge} tone={badge.includes("non") ? "rose" : "teal"}>{badge}</Badge>)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <PatientDetail patient={selectedPatient} />
      </div>
    </PageFrame>
  );
}

function PatientDetail({ patient }) {
  if (!patient) return <Panel className="p-6"><EmptyLine>Seleziona un paziente.</EmptyLine></Panel>;
  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{patient.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{patient.phone} · {patient.email}</p>
        </div>
        <Badge tone={patient.consent ? "teal" : "rose"}>{patient.consent ? "Consenso attivo" : "Consenso non attivo"}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 text-sm">
        <Field label="Canale preferito" value={patient.preferredChannel} />
        <Field label="Prossimo appuntamento" value={patient.nextVisit} />
        <Field label="Trattamenti" value={patient.treatments} />
        <Field label="Azione consigliata" value={patient.suggested} />
      </div>
      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Badge</div>
        <div className="flex flex-wrap gap-2">{patient.badges.map((badge) => <Badge key={badge} tone={badge.includes("non") ? "rose" : badge.includes("Telefonata") ? "amber" : "teal"}>{badge}</Badge>)}</div>
      </div>
      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</div>
        <div className="mt-3 space-y-3">
          {patient.timeline.map((line, index) => (
            <div key={`${line}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">{line}</div>
          ))}
        </div>
      </div>
      <p className="mt-5 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600">{patient.notes}</p>
    </Panel>
  );
}

function WaitlistSection({ items, filter, setFilter, setActiveSection }) {
  return (
    <PageFrame title="Lista d'attesa" subtitle="La lista d'attesa alimenta il Fill the Gap: lo staff vede chi puo essere contattato, con quale canale e in quale fascia oraria.">
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500">
            <option>Tutti</option>
            <option>Igiene dentale</option>
            <option>WhatsApp</option>
            <option>Alta</option>
          </select>
          <Button onClick={() => setActiveSection("fillgap")} variant="secondary">Usa nel Fill the Gap</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Paziente</th>
                <th className="px-6 py-3">Trattamento</th>
                <th className="px-6 py-3">Fascia preferita</th>
                <th className="px-6 py-3">Urgenza</th>
                <th className="px-6 py-3">Last-minute</th>
                <th className="px-6 py-3">Canale</th>
                <th className="px-6 py-3">Compatibilita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.name} className="bg-white">
                  <td className="px-6 py-4 font-semibold text-slate-950">{item.name}</td>
                  <td className="px-6 py-4 text-slate-600">{item.treatment}</td>
                  <td className="px-6 py-4 text-slate-600">{item.preference}</td>
                  <td className="px-6 py-4"><Badge tone={item.urgency === "Alta" ? "amber" : "slate"}>{item.urgency}</Badge></td>
                  <td className="px-6 py-4 text-slate-600">{item.lastMinute}</td>
                  <td className="px-6 py-4 text-slate-600">{item.channel}</td>
                  <td className="px-6 py-4"><Badge tone={item.consent ? "teal" : "rose"}>{item.fit}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageFrame>
  );
}

function QuotesSection({ quotes, selectedQuote, setSelectedQuote, filter, setFilter }) {
  return (
    <PageFrame title="Preventivi" subtitle="Una vista ordinata per seguire i preventivi aperti senza lasciare la sequenza di contatto alla memoria della segreteria.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_430px]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 px-6 py-5">
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500">
              <option>Tutti</option>
              <option>Alta</option>
              <option>Media</option>
              <option>Da ricontattare</option>
              <option>Chiarimento richiesto</option>
            </select>
          </div>
          <div className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <button key={`${quote.name}-${quote.treatment}`} type="button" onClick={() => setSelectedQuote(quote)} className={classNames("block w-full px-6 py-4 text-left hover:bg-slate-50", selectedQuote?.name === quote.name ? "bg-teal-50/70" : "bg-white")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{quote.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{quote.treatment} · inviato {quote.sent}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge tone={quote.probability === "Alta" ? "teal" : "slate"}>{quote.probability}</Badge>
                    <Badge tone={quote.status === "Da ricontattare" ? "amber" : "slate"}>{quote.status}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-xl font-bold text-slate-950">{selectedQuote.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{selectedQuote.treatment}</p>
          <div className="mt-5 space-y-3">
            <Field label="Ultimo contatto" value={selectedQuote.last} />
            <Field label="Prossima azione" value={selectedQuote.next} />
            <Field label="Stato" value={selectedQuote.status} />
          </div>
          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline follow-up</div>
            <div className="mt-3 space-y-3">
              {selectedQuote.timeline.map((line, index) => <div key={`${line}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">{line}</div>)}
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            Ciao {selectedQuote.name.split(" ")[0]}, volevamo sapere se hai avuto modo di valutare il preventivo. Se vuoi, possiamo fissare una breve chiamata con lo studio per chiarire ogni dubbio.
          </div>
        </Panel>
      </div>
    </PageFrame>
  );
}

function AutomationsSection({ automations, setAutomations }) {
  function toggleAutomation(id) {
    setAutomations((current) => current.map((automation) => (automation.id === id ? { ...automation, active: !automation.active, lastRun: !automation.active ? "Attivata ora" : "In pausa" } : automation)));
  }

  return (
    <PageFrame title="Automazioni" subtitle="Il titolare vede quali flussi sono attivi, quali sono in pausa e cosa fa ogni automazione.">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {automations.map((automation) => (
          <Panel key={automation.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-950">{automation.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{automation.note}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleAutomation(automation.id)}
                className={classNames("relative h-7 w-12 rounded-full transition", automation.active ? "bg-teal-700" : "bg-slate-300")}
                aria-label={`Cambia stato ${automation.name}`}
              >
                <span className={classNames("absolute top-1 h-5 w-5 rounded-full bg-white transition", automation.active ? "left-6" : "left-1")} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <Field label="Trigger" value={automation.trigger} />
              <Field label="Canale" value={automation.channel} />
              <Field label="Stato" value={automation.active ? "Attiva" : "In pausa"} />
            </div>
          </Panel>
        ))}
      </div>
    </PageFrame>
  );
}

function MessagesSection({ conversations, selected, setSelected, setActiveSection }) {
  return (
    <PageFrame title="Messaggi" subtitle="Inbox simulata per vedere conversazioni WhatsApp, SMS ed email collegate ad agenda, Fill the Gap e follow-up.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <Panel className="overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="font-bold text-slate-950">Conversazioni</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {conversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => setSelected(conversation)} className={classNames("block w-full px-6 py-4 text-left hover:bg-slate-50", selected?.id === conversation.id ? "bg-teal-50/70" : "bg-white")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{conversation.name}</div>
                    <div className="mt-1 line-clamp-1 text-sm text-slate-500">{conversation.preview}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge tone="slate">{conversation.channel}</Badge>
                    <span className="text-xs text-slate-500">{conversation.status}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="flex min-h-[680px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="font-bold text-slate-950">{selected.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{selected.channel} · {selected.status}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setActiveSection("agenda")}>Prenota automaticamente</Button>
              <Button variant="secondary" onClick={() => setActiveSection("followup")}>Segna da richiamare</Button>
            </div>
          </div>
          <div className="flex-1 space-y-4 bg-slate-50 p-6">
            {selected.messages.map((message, index) => (
              <div key={`${message.from}-${index}`} className={classNames("max-w-[78%] rounded-lg border p-4 text-sm leading-6", message.from === "Studio" ? "ml-auto border-teal-100 bg-white text-slate-700" : "border-slate-200 bg-white text-slate-700")}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{message.from}</div>
                {message.text}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-white p-4">
            <div className="flex gap-3">
              <input className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500" placeholder="Scrivi un messaggio simulato" />
              <Button variant="primary">Invia demo</Button>
            </div>
          </div>
        </Panel>
      </div>
    </PageFrame>
  );
}

function WhatsAppSection({
  status,
  realWhatsapp,
  patientQr,
  setPatientQr,
  events,
  connect,
  connectReal,
  disconnectReal,
  generatePatientQr,
  triggerCancellation,
  setActiveSection,
}) {
  const realStatusLabel = {
    offline: "Server locale spento",
    idle: "Pronto",
    starting: "Avvio in corso",
    qr: "QR da scansionare",
    connected: "Collegato",
    disconnected: "Disconnesso",
    error: "Errore",
  }[realWhatsapp.status] || realWhatsapp.status;

  return (
    <PageFrame title="WhatsApp Web" subtitle="Collegamento demo per mostrare al titolare cosa succede quando un paziente rinuncia via WhatsApp e il sistema prepara automaticamente il Fill the Gap.">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[430px_1fr]">
        <Panel className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-950">Setup interno ricezione</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Serve solo al software per leggere i messaggi ricevuti dallo studio. Non e il QR da mostrare al paziente.
              </p>
            </div>
            <Badge tone={realWhatsapp.status === "connected" ? "teal" : realWhatsapp.status === "qr" || realWhatsapp.status === "starting" ? "amber" : "slate"}>
              {realStatusLabel}
            </Badge>
          </div>

          <div className="mt-6 flex justify-center">
            {realWhatsapp.qr ? (
              <img src={realWhatsapp.qr} alt="QR WhatsApp reale demo" className="h-64 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" />
            ) : realWhatsapp.status === "connected" ? (
              <div className="flex h-36 w-full items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-4 text-center text-sm font-semibold leading-6 text-teal-800">
                WhatsApp dello studio collegato. Ora genera il QR paziente.
              </div>
            ) : (
              <div className="flex h-36 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm leading-6 text-slate-500">
                Clicca "Collega WhatsApp dello studio" per generare il QR tecnico di accesso.
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <Button onClick={connectReal} disabled={realWhatsapp.status === "connected" || realWhatsapp.status === "starting"} className="w-full">
              {realWhatsapp.status === "connected" ? "WhatsApp dello studio collegato" : realWhatsapp.status === "starting" ? "Avvio collegamento" : "Collega WhatsApp dello studio"}
            </Button>
            <Button onClick={disconnectReal} disabled={!realWhatsapp.available || realWhatsapp.status === "offline"} variant="secondary" className="w-full">
              Disconnetti collegamento reale
            </Button>
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
            Avvio locale: <span className="font-semibold text-slate-800">npm.cmd run whatsapp-demo</span>. Poi apri <span className="font-semibold text-slate-800">http://localhost:8787</span>.
            {realWhatsapp.error && <div className="mt-2 text-rose-700">{realWhatsapp.error}</div>}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-950">QR paziente per aprire la chat</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Questo e il QR da far inquadrare a un paziente: apre WhatsApp direttamente nella chat dello studio con la rinuncia gia pronta.
                </p>
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                  Usa come numero target quello dello studio. Il QR va inquadrato da un altro WhatsApp: se lo scansioni con lo stesso account dello studio, WhatsApp apre una chat con te stesso.
                </p>
              </div>
              <Badge tone={patientQr.qr ? "teal" : "slate"}>{patientQr.qr ? "QR pronto" : "Da generare"}</Badge>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Numero WhatsApp dello studio</label>
                  <input
                    value={patientQr.phone || realWhatsapp.studioNumber || ""}
                    onChange={(event) => setPatientQr((current) => ({ ...current, phone: event.target.value, error: "" }))}
                    placeholder="393331234567"
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
                  />
                  {realWhatsapp.studioNumber && (
                    <div className="mt-2 text-xs leading-5 text-slate-500">
                      Numero rilevato dal collegamento studio: {realWhatsapp.studioNumber}
                    </div>
                  )}
                </div>
                <Button onClick={generatePatientQr} disabled={patientQr.loading} variant="secondary">
                  {patientQr.loading ? "Genero QR" : "Genera QR chat paziente"}
                </Button>
                {patientQr.url && (
                  <a href={patientQr.url} target="_blank" rel="noreferrer" className="block break-all text-xs leading-5 text-teal-700">
                    {patientQr.url}
                  </a>
                )}
                {patientQr.error && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">{patientQr.error}</div>}
              </div>
              <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4">
                {patientQr.qr ? (
                  <img src={patientQr.qr} alt="QR chat WhatsApp paziente" className="h-44 w-44 rounded-md bg-white p-2" />
                ) : (
                  <div className="text-center text-xs leading-5 text-slate-500">
                    Il QR comparira qui dopo aver inserito il numero dello studio.
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-950">Simulazione senza server</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Resta disponibile come piano B se durante il colloquio non vuoi collegare un account WhatsApp reale.
                </p>
              </div>
              <Badge tone={status === "connected" ? "teal" : status === "pairing" ? "amber" : "slate"}>
                {status === "connected" ? "Collegata" : status === "pairing" ? "In collegamento" : "Non collegata"}
              </Badge>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button onClick={connect} disabled={status === "connected" || status === "pairing"} variant="secondary">
                {status === "connected" ? "Simulazione collegata" : status === "pairing" ? "Collegamento in corso" : "Avvia simulazione"}
              </Button>
              <Button onClick={triggerCancellation} disabled={status !== "connected"} variant="secondary">
                Simula rinuncia su WhatsApp
              </Button>
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">Eventi in tempo reale</h2>
                <p className="mt-1 text-sm text-slate-500">Quando arriva una rinuncia vera, il sistema notifica lo slot, apre il Fill the Gap e avvia automaticamente la campagna demo.</p>
              </div>
              <Button variant="secondary" onClick={() => setActiveSection("fillgap")}>Apri Fill the Gap</Button>
            </div>
            <div className="mt-5 space-y-3">
              {events.map((event, index) => (
                <div key={`${event}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">{event}</div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <h2 className="font-bold text-slate-950">Frase trigger per il colloquio</h2>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              Buongiorno, devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00. Mi dispiace.
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Invia una frase simile al WhatsApp collegato: il server locale riconosce la rinuncia, passa l'evento alla webapp e prepara il Fill the Gap.
            </p>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}

function QrDemo({ active }) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const dark = [0, 1, 2, 6, 7, 8, 14, 18, 20, 21, 26, 27, 28, 30, 34, 36, 40, 42, 43, 44, 48].includes(index) || (active && index % 5 === 0);
    return <div key={index} className={classNames("h-5 w-5 rounded-sm", dark ? "bg-slate-900" : "bg-white")} />;
  });
  return <div className="grid grid-cols-7 gap-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">{cells}</div>;
}

export default function DemoStudioDentistico() {
  return <DemoStudioDentisticoApp />;
}

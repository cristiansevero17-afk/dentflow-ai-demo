import { useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
  { id: "agenda", label: "Agenda", icon: "📅", preview: "Calendario annuale, appuntamenti e rinunce." },
  { id: "fillgap", label: "Fill the Gap", icon: "⚡", preview: "Top 10 pazienti compatibili per ogni slot libero." },
  { id: "followup", label: "Follow-up", icon: "🔁", preview: "Richiami WhatsApp automatici agli intervalli scelti." },
  { id: "patients", label: "Pazienti", icon: "👤", preview: "Anagrafica, preferenze, consenso e storico." },
  { id: "waitlist", label: "Lista d'attesa", icon: "⌛", preview: "Persone pronte ad anticipare un appuntamento." },
  { id: "quotes", label: "Preventivi", icon: "📋", preview: "Follow-up automatico sui trattamenti non confermati." },
  { id: "automations", label: "Automazioni", icon: "⚙️", preview: "Regole operative attive per lo studio." },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", preview: "Collegamento, webhook e bot operativo." },
];

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const MONTHS_SHORT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
const WEEKDAYS_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const TREATMENTS = ["Igiene dentale", "Controllo", "Sbiancamento", "Implantologia", "Ortodonzia", "Devitalizzazione", "Visita bambini"];
const TIME_PREFERENCES = ["Mattina", "Pausa pranzo", "Pomeriggio", "Dopo le 16:00", "Sera"];

function todayISO() {
  const date = new Date();
  return toISODate(date);
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
  return date.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function dayName(value) {
  return fromISODate(value).toLocaleDateString("it-IT", { weekday: "long" });
}

function isSameDate(a, b) {
  return String(a) === String(b);
}

function getDaysInMonth(year, monthIndex) {
  const days = [];
  const count = new Date(year, monthIndex + 1, 0).getDate();
  for (let day = 1; day <= count; day += 1) {
    days.push(toISODate(new Date(year, monthIndex, day)));
  }
  return days;
}

function monthStartOffset(year, monthIndex) {
  const jsDay = new Date(year, monthIndex, 1).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCancellationIntentText(value) {
  const text = normalizeText(value);
  return ["non posso", "non riesco", "rinunc", "annull", "disdett", "cancell", "non vengo", "devo saltare"].some((keyword) => text.includes(keyword));
}

function timeBucket(time) {
  const hour = Number(String(time || "00:00").slice(0, 2));
  if (hour < 12) return "Mattina";
  if (hour < 14) return "Pausa pranzo";
  if (hour < 16) return "Pomeriggio";
  if (hour < 19) return "Dopo le 16:00";
  return "Sera";
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Local persistence is a convenience for this front-end build.
    }
  }, [key, value]);

  return [value, setValue];
}

const currentYear = new Date().getFullYear();
const today = todayISO();

const INITIAL_PATIENTS = [
  {
    id: "p-maria",
    name: "Maria Rossi",
    phone: "+39 333 123 4567",
    consent: true,
    preferredTimes: ["Pomeriggio", "Dopo le 16:00"],
    treatments: ["Igiene dentale", "Controllo"],
    distanceMinutes: 8,
    responseRate: 94,
    waitingList: true,
    lastVisit: addDays(today, -180),
    notes: "Preferisce WhatsApp e appuntamenti dopo il lavoro.",
  },
  {
    id: "p-luca",
    name: "Luca Bianchi",
    phone: "+39 347 333 2121",
    consent: true,
    preferredTimes: ["Sera", "Dopo le 16:00"],
    treatments: ["Igiene dentale", "Devitalizzazione"],
    distanceMinutes: 14,
    responseRate: 82,
    waitingList: false,
    lastVisit: addDays(today, -215),
    notes: "Storico risposte rapido entro un'ora.",
  },
  {
    id: "p-sara",
    name: "Sara Colombo",
    phone: "+39 349 888 9090",
    consent: true,
    preferredTimes: ["Mattina"],
    treatments: ["Igiene dentale", "Controllo"],
    distanceMinutes: 20,
    responseRate: 76,
    waitingList: false,
    lastVisit: addDays(today, -205),
    notes: "Chiede spesso disponibilita' il venerdi mattina.",
  },
  {
    id: "p-giulia",
    name: "Giulia Ferri",
    phone: "+39 338 444 1010",
    consent: true,
    preferredTimes: ["Pomeriggio"],
    treatments: ["Controllo", "Igiene dentale"],
    distanceMinutes: 11,
    responseRate: 73,
    waitingList: false,
    lastVisit: addDays(today, -90),
    notes: "Cliente abituale, molto puntuale nelle conferme.",
  },
  {
    id: "p-antonio",
    name: "Antonio Greco",
    phone: "+39 331 884 9911",
    consent: true,
    preferredTimes: ["Dopo le 16:00", "Sera"],
    treatments: ["Igiene dentale", "Sbiancamento"],
    distanceMinutes: 6,
    responseRate: 88,
    waitingList: true,
    lastVisit: addDays(today, -230),
    notes: "Disponibile con poco preavviso se lo slot e' nel pomeriggio.",
  },
  {
    id: "p-elena",
    name: "Elena Conti",
    phone: "+39 339 332 1122",
    consent: true,
    preferredTimes: ["Pausa pranzo", "Pomeriggio"],
    treatments: ["Implantologia", "Controllo"],
    distanceMinutes: 18,
    responseRate: 69,
    waitingList: false,
    lastVisit: addDays(today, -45),
    notes: "Preventivo implantologia aperto.",
  },
  {
    id: "p-roberto",
    name: "Roberto Galli",
    phone: "+39 340 555 7171",
    consent: true,
    preferredTimes: ["Mattina"],
    treatments: ["Ortodonzia", "Controllo"],
    distanceMinutes: 25,
    responseRate: 63,
    waitingList: false,
    lastVisit: addDays(today, -120),
    notes: "Preferisce appuntamenti prima delle 11:00.",
  },
  {
    id: "p-paola",
    name: "Paola Esposito",
    phone: "+39 366 777 1212",
    consent: false,
    preferredTimes: ["Pomeriggio"],
    treatments: ["Sbiancamento"],
    distanceMinutes: 12,
    responseRate: 71,
    waitingList: false,
    lastVisit: addDays(today, -330),
    notes: "Consenso WhatsApp non attivo.",
  },
];

const INITIAL_APPOINTMENTS = [
  {
    id: "a-1",
    patientId: "p-sara",
    patientName: "Sara Colombo",
    phone: "+39 349 888 9090",
    date: today,
    time: "09:00",
    duration: 60,
    treatment: "Igiene dentale",
    status: "confermato",
    notes: "Richiamo periodico.",
  },
  {
    id: "a-2",
    patientId: "p-giulia",
    patientName: "Giulia Ferri",
    phone: "+39 338 444 1010",
    date: today,
    time: "16:00",
    duration: 60,
    treatment: "Igiene dentale",
    status: "confermato",
    notes: "Slot ideale per Fill the Gap se disdetto.",
  },
  {
    id: "a-3",
    patientId: "p-luca",
    patientName: "Luca Bianchi",
    phone: "+39 347 333 2121",
    date: addDays(today, 1),
    time: "17:00",
    duration: 45,
    treatment: "Controllo",
    status: "confermato",
    notes: "",
  },
  {
    id: "a-4",
    patientId: "p-elena",
    patientName: "Elena Conti",
    phone: "+39 339 332 1122",
    date: addDays(today, 3),
    time: "14:30",
    duration: 60,
    treatment: "Implantologia",
    status: "confermato",
    notes: "Prima visita implantologia.",
  },
  {
    id: "a-5",
    patientId: "p-roberto",
    patientName: "Roberto Galli",
    phone: "+39 340 555 7171",
    date: addDays(today, 7),
    time: "10:00",
    duration: 45,
    treatment: "Ortodonzia",
    status: "confermato",
    notes: "",
  },
  {
    id: "a-6",
    patientId: "p-maria",
    patientName: "Maria Rossi",
    phone: "+39 333 123 4567",
    date: addDays(today, 14),
    time: "15:30",
    duration: 60,
    treatment: "Igiene dentale",
    status: "confermato",
    notes: "",
  },
];

const INITIAL_WAITLIST = [
  { id: "w-1", patientId: "p-maria", name: "Maria Rossi", treatment: "Igiene dentale", preferredTimes: "Pomeriggio", notes: "Vuole anticipare se si libera uno slot." },
  { id: "w-2", patientId: "p-antonio", name: "Antonio Greco", treatment: "Igiene dentale", preferredTimes: "Dopo le 16:00", notes: "Disponibile anche con preavviso breve." },
  { id: "w-3", patientId: "p-sara", name: "Sara Colombo", treatment: "Controllo", preferredTimes: "Mattina", notes: "Preferisce venerdi." },
];

const INITIAL_QUOTES = [
  { id: "q-1", patientId: "p-elena", name: "Elena Conti", treatment: "Implantologia", sentAt: addDays(today, -12), status: "Follow-up automatico", nextAction: "WhatsApp chiarimento" },
  { id: "q-2", patientId: "p-roberto", name: "Roberto Galli", treatment: "Ortodonzia invisibile", sentAt: addDays(today, -5), status: "Reminder leggero", nextAction: "Disponibilita' per domande" },
  { id: "q-3", patientId: "p-paola", name: "Paola Esposito", treatment: "Sbiancamento", sentAt: addDays(today, -20), status: "Consenso da verificare", nextAction: "Telefonata staff" },
];

const INITIAL_RULES = [
  {
    id: "rule-hygiene",
    name: "Igiene ogni 6 mesi",
    trigger: "Igiene dentale completata",
    delay: "5 mesi e 20 giorni",
    active: true,
    template: "Ciao {nome}, e' quasi il momento della prossima igiene. Vuoi che ti proponiamo qualche disponibilita'?",
  },
  {
    id: "rule-control",
    name: "Controllo annuale",
    trigger: "Ultimo controllo oltre 11 mesi",
    delay: "11 mesi",
    active: true,
    template: "Ciao {nome}, ti ricordiamo il controllo annuale. Possiamo proporti alcune date?",
  },
  {
    id: "rule-quote",
    name: "Preventivo non confermato",
    trigger: "Preventivo inviato",
    delay: "3, 7, 14 giorni",
    active: true,
    template: "Ciao {nome}, hai avuto modo di valutare il preventivo? Lo studio e' disponibile per chiarire ogni dubbio.",
  },
  {
    id: "rule-inactive",
    name: "Paziente inattivo",
    trigger: "Nessun appuntamento da 12 mesi",
    delay: "12 mesi",
    active: false,
    template: "Ciao {nome}, se vuoi possiamo aiutarti a programmare un controllo.",
  },
];

const INITIAL_AUTOMATIONS = [
  { id: "auto-inbound", label: "Lettura messaggi WhatsApp", active: true, detail: "Classifica richieste, rinunce, spostamenti e conferme." },
  { id: "auto-gap", label: "Fill the Gap top 10", active: true, detail: "Contatta prima i pazienti piu' compatibili con lo slot libero." },
  { id: "auto-timeout", label: "Timeout 1h 30m", active: true, detail: "Se nessuno risponde, apre una nuova ondata di candidati." },
  { id: "auto-followup", label: "Follow-up automatici", active: true, detail: "Invia richiami WhatsApp in base alle regole impostate." },
  { id: "auto-quotes", label: "Preventivi", active: true, detail: "Segue i preventivi aperti con messaggi progressivi." },
];

function rankCandidate(patient, slot, waitlist) {
  const treatmentMatch = patient.treatments.includes(slot.treatment) ? 30 : 0;
  const preferredTime = patient.preferredTimes.includes(timeBucket(slot.time)) ? 24 : 0;
  const waitlistBoost = waitlist.some((item) => item.patientId === patient.id && item.treatment === slot.treatment) ? 18 : 0;
  const consent = patient.consent ? 14 : -100;
  const response = Math.round(patient.responseRate * 0.12);
  const distance = patient.distanceMinutes <= 10 ? 10 : patient.distanceMinutes <= 20 ? 6 : 2;
  const recentNeed = daysSince(patient.lastVisit) > 150 ? 8 : 2;
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

function daysSince(isoDate) {
  const diff = Date.now() - fromISODate(isoDate).getTime();
  return Math.round(diff / 86400000);
}

function buildTopCandidates(patients, slot, waitlist) {
  return patients
    .filter((patient) => patient.id !== slot.patientId)
    .map((patient) => rankCandidate(patient, slot, waitlist))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
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
      const matchesPreference = !preference || preference === "non specificata" || normalizeText(timeBucket(time)).includes(normalizeText(preference));
      if (!taken && matchesPreference) {
        options.push({ date, time });
      }
      if (options.length >= 5) break;
    }
  }
  return options;
}

function appointmentMatchesRequest(appointment, analysis) {
  const detectedText = Array.isArray(analysis?.detected) ? analysis.detected.join(" ").toLowerCase() : "";
  const hasDate = detectedText.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)/);
  const hasTomorrow = detectedText.includes("domani");
  const hasToday = detectedText.includes("oggi");
  const hasTime = detectedText.match(/(\d{1,2}):(\d{2})/);
  let dateOk = true;
  let timeOk = true;

  if (hasDate) {
    const monthIndex = MONTHS.map((month) => normalizeText(month)).indexOf(normalizeText(hasDate[2]));
    const expected = toISODate(new Date(currentYear, monthIndex, Number(hasDate[1])));
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
  if (exactAppointment) {
    return { appointment: exactAppointment, match: "exact" };
  }

  const upcomingAppointment = activeAppointments.find((appointment) => appointment.date >= todayISO());
  if (upcomingAppointment) {
    return { appointment: upcomingAppointment, match: "next" };
  }

  return activeAppointments[0] ? { appointment: activeAppointments[0], match: "history" } : { appointment: null, match: "none" };
}

function Pill({ children, tone = "slate" }) {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    slate: "border-slate-200 bg-white text-slate-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-teal-700 text-white shadow-sm shadow-teal-900/10 hover:bg-teal-800",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-teal-200 hover:text-teal-700",
    soft: "border border-teal-100 bg-teal-50 text-teal-700 hover:bg-teal-100",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Panel({ children, className = "" }) {
  return <div className={`rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)] ${className}`}>{children}</div>;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return <input className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-50 ${className}`} {...props} />;
}

function Select({ className = "", ...props }) {
  return <select className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-50 ${className}`} {...props} />;
}

function Textarea({ className = "", ...props }) {
  return <textarea className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-50 ${className}`} {...props} />;
}

function SectionHeader({ eyebrow, title, description, right }) {
  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</div> : null}
        <h1 className="text-[2rem] font-bold tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="mt-2 text-base leading-7 text-slate-600">{description}</p> : null}
      </div>
      {right}
    </div>
  );
}

function HomeScreen({ setActiveSection }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8fbf7_0,#f6f8fb_34%,#f8fafc_100%)] px-6 py-8 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <header className="flex h-24 items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-600 text-xl font-bold text-white shadow-lg shadow-teal-900/15">S</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">StudioFlow Dental</h1>
              <p className="text-sm text-slate-500">Webapp operativa per studio dentistico</p>
            </div>
          </div>
          <Pill tone="green">Sistema operativo</Pill>
        </header>

        <section className="py-12">
          <div className="max-w-4xl">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Console principale</div>
            <h2 className="mt-3 text-5xl font-bold tracking-tight text-slate-950">Gestione automatica di agenda, WhatsApp e follow-up.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Ogni sezione serve a far lavorare lo studio su processi reali: appuntamenti, rinunce, richiami, lista d'attesa e bot WhatsApp.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="group rounded-3xl border border-slate-200/80 bg-white/95 p-5 text-left shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 text-xl shadow-sm">{item.icon}</div>
                <h3 className="text-lg font-bold text-slate-950">{item.label}</h3>
                <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-slate-600">{item.preview}</p>
                <span className="mt-4 inline-flex text-sm font-bold text-teal-700">Apri sezione</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({ activeSection, setActiveSection, setHome }) {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-80 border-r border-slate-200/80 bg-white xl:block">
      <div className="flex h-full flex-col">
        <div className="flex h-24 items-center border-b border-slate-200/80 px-6">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-600 font-bold text-white shadow-md shadow-teal-900/15">S</div>
            <div>
              <div className="text-base font-bold text-slate-950">StudioFlow Dental</div>
              <div className="text-sm text-slate-500">Studio dentistico · Milano</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5 overflow-hidden p-4">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  active ? "bg-teal-50 text-teal-800 ring-1 ring-teal-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-base shadow-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function AppShell({ activeSection, setActiveSection, children }) {
  const active = NAV_ITEMS.find((item) => item.id === activeSection);
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} setHome={() => setActiveSection("home")} />
      <div className="xl:pl-80">
        <header className="sticky top-0 z-20 h-24 border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
            <div>
              <div className="text-base font-bold text-slate-950">{active?.label || "Home"}</div>
              <div className="mt-1 text-sm text-slate-500">{active?.preview}</div>
            </div>
            <Button variant="secondary" onClick={() => setActiveSection("home")}>
              Home
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

function AgendaSection({ patients, appointments, setAppointments, selectedDate, setSelectedDate, onCancelAppointment, onCreateAppointment }) {
  const [monthIndex, setMonthIndex] = useState(fromISODate(selectedDate).getMonth());
  const [form, setForm] = useState({
    patientId: patients[0]?.id || "",
    patientName: patients[0]?.name || "",
    phone: patients[0]?.phone || "",
    date: selectedDate,
    time: "16:00",
    duration: 60,
    treatment: "Igiene dentale",
    status: "confermato",
    notes: "",
  });

  useEffect(() => {
    setForm((current) => ({ ...current, date: selectedDate }));
  }, [selectedDate]);

  const days = getDaysInMonth(currentYear, monthIndex);
  const selectedAppointments = appointments
    .filter((appointment) => appointment.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const choosePatient = (patientId) => {
    const patient = patients.find((item) => item.id === patientId);
    setForm((current) => ({
      ...current,
      patientId,
      patientName: patient?.name || current.patientName,
      phone: patient?.phone || current.phone,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    onCreateAppointment(form);
    setForm((current) => ({ ...current, time: "16:00", notes: "" }));
  };

  return (
    <>
      <SectionHeader
        eyebrow="Agenda annuale"
        title="Calendario operativo"
        description="Tutti i giorni dell'anno sono disponibili. Il giorno odierno viene evidenziato e ogni rinuncia puo' attivare automaticamente Fill the Gap."
        right={<Pill tone="teal">Oggi: {formatDate(todayISO())}</Pill>}
      />

      <Panel className="mb-6 p-5">
        <div className="flex flex-wrap gap-2">
          {MONTHS_SHORT.map((month, index) => (
            <button
              key={month}
              onClick={() => {
                setMonthIndex(index);
                setSelectedDate(toISODate(new Date(currentYear, index, 1)));
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                index === monthIndex ? "border-teal-400 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{MONTHS[monthIndex]} {currentYear}</h2>
              <p className="text-sm text-slate-500">Seleziona un giorno per vedere appuntamenti e slot.</p>
            </div>
            <Pill tone="slate">{formatDate(selectedDate)}</Pill>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center">
            {WEEKDAYS_SHORT.map((day) => (
              <div key={day} className="py-2 text-xs font-bold uppercase tracking-wide text-slate-400">{day}</div>
            ))}
            {Array.from({ length: monthStartOffset(currentYear, monthIndex) }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {days.map((date) => {
              const hasAppointments = appointments.some((appointment) => appointment.date === date);
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[82px] rounded-2xl border p-2 text-left transition ${
                    isSameDate(date, selectedDate)
                      ? "border-teal-400 bg-teal-50"
                      : isSameDate(date, todayISO())
                        ? "border-slate-300 bg-white ring-2 ring-teal-100"
                        : "border-slate-200 bg-white hover:border-teal-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{fromISODate(date).getDate()}</span>
                    {isSameDate(date, todayISO()) ? <span className="text-[10px] font-bold uppercase text-teal-700">oggi</span> : null}
                  </div>
                  {hasAppointments ? <div className="mt-3 h-1.5 rounded-full bg-teal-500" /> : <div className="mt-3 h-1.5 rounded-full bg-slate-100" />}
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <h2 className="text-xl font-bold">Appuntamenti del giorno</h2>
            <p className="mt-1 text-sm text-slate-500">{dayName(selectedDate)} · {formatDate(selectedDate)}</p>
            <div className="mt-5 space-y-3">
              {selectedAppointments.length ? (
                selectedAppointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-500">{appointment.time} · {appointment.duration} min</div>
                        <div className="mt-1 text-lg font-bold">{appointment.patientName}</div>
                        <div className="text-sm text-slate-600">{appointment.treatment}</div>
                      </div>
                      <Pill tone={appointment.status === "annullato" ? "rose" : appointment.status === "da riempire" ? "amber" : "green"}>
                        {appointment.status}
                      </Pill>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="danger" disabled={appointment.status === "annullato"} onClick={() => onCancelAppointment(appointment.id)}>
                        Registra rinuncia
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setAppointments((current) =>
                            current.map((item) => (item.id === appointment.id ? { ...item, status: "confermato" } : item))
                          )
                        }
                      >
                        Conferma
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Nessun appuntamento inserito per questo giorno.</div>
              )}
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-xl font-bold">Inserisci appuntamento</h2>
            <form className="mt-5 grid gap-4" onSubmit={submit}>
              <Field label="Paziente">
                <Select value={form.patientId} onChange={(event) => choosePatient(event.target.value)}>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.name}</option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Data">
                  <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                </Field>
                <Field label="Ora">
                  <Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Trattamento">
                  <Select value={form.treatment} onChange={(event) => setForm({ ...form, treatment: event.target.value })}>
                    {TREATMENTS.map((treatment) => (
                      <option key={treatment}>{treatment}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Durata">
                  <Select value={form.duration} onChange={(event) => setForm({ ...form, duration: Number(event.target.value) })}>
                    {[30, 45, 60, 90].map((duration) => (
                      <option key={duration} value={duration}>{duration} minuti</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Note">
                <Textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
              </Field>
              <Button type="submit">Aggiungi in agenda</Button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}

function FillGapSection({ gaps, patients, appointments, waitlist, onRunGap, onCloseGap }) {
  return (
    <>
      <SectionHeader
        eyebrow="Recupero slot"
        title="Fill the Gap automatico"
        description="Quando uno slot si libera, il sistema ordina i pazienti per compatibilita', contatta prima i migliori 10 e apre una seconda ondata se nessuno risponde entro 1h 30m."
      />

      <div className="space-y-6">
        {gaps.length ? (
          gaps.map((gap) => {
            const slot = appointments.find((appointment) => appointment.id === gap.appointmentId) || gap.slot;
            const top = gap.candidates?.length ? gap.candidates : buildTopCandidates(patients, slot, waitlist);
            return (
              <Panel key={gap.id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <Pill tone={gap.status === "riempito" ? "green" : "amber"}>{gap.status}</Pill>
                    <h2 className="mt-3 text-2xl font-bold">Slot libero · {formatDate(slot.date)} alle {slot.time}</h2>
                    <p className="mt-1 text-slate-600">{slot.treatment} · paziente originario: {slot.patientName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onRunGap(gap.id)}>Avvia gestione automatica</Button>
                    <Button variant="secondary" onClick={() => onCloseGap(gap.id)}>Archivia</Button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-4">
                  {["Slot liberato", "Top 10 selezionata", "WhatsApp inviati", "Conferma o nuova ondata"].map((step, index) => (
                    <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 h-1.5 w-12 rounded-full bg-teal-600" />
                      <div className="font-bold">{index + 1}. {step}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-500">
                        {index === 3 ? "Chiusura invii e messaggio agli altri contatti." : "Processo gestito dal motore operativo."}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Top</th>
                        <th className="px-4 py-3">Paziente</th>
                        <th className="px-4 py-3">Score</th>
                        <th className="px-4 py-3">Fattori</th>
                        <th className="px-4 py-3">Stato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {top.map((candidate, index) => (
                        <tr key={candidate.patientId}>
                          <td className="px-4 py-4 font-bold">{index + 1}</td>
                          <td className="px-4 py-4">
                            <div className="font-bold">{candidate.name}</div>
                            <div className="text-xs text-slate-500">{candidate.phone}</div>
                          </td>
                          <td className="px-4 py-4">
                            <Pill tone={candidate.score >= 80 ? "green" : candidate.score >= 65 ? "teal" : "slate"}>{candidate.score}/100</Pill>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{candidate.reasons.join(" · ")}</td>
                          <td className="px-4 py-4">{candidate.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            );
          })
        ) : (
          <Panel className="p-8 text-center">
            <h2 className="text-2xl font-bold">Nessuno slot da riempire</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">Quando viene registrata una rinuncia in agenda o arriva da WhatsApp, qui compare automaticamente la procedura Fill the Gap.</p>
          </Panel>
        )}
      </div>
    </>
  );
}

function FollowUpSection({ patients, rules, setRules }) {
  const duePatients = patients
    .filter((patient) => patient.consent && daysSince(patient.lastVisit) > 160)
    .map((patient) => ({
      ...patient,
      dueReason: daysSince(patient.lastVisit) > 300 ? "Paziente inattivo" : "Igiene o controllo vicino alla scadenza",
    }));

  return (
    <>
      <SectionHeader
        eyebrow="Richiami automatici"
        title="Follow-up WhatsApp"
        description="Il titolare sceglie le regole. Il sistema invia i messaggi WhatsApp agli intervalli impostati, senza conferma manuale dello staff."
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="p-6">
          <h2 className="text-xl font-bold">Regole attive</h2>
          <div className="mt-5 space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold">{rule.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{rule.trigger} · {rule.delay}</div>
                  </div>
                  <button
                    onClick={() => setRules((current) => current.map((item) => (item.id === rule.id ? { ...item, active: !item.active } : item)))}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${rule.active ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"}`}
                  >
                    {rule.active ? "Attiva" : "Spenta"}
                  </button>
                </div>
                <Textarea
                  className="mt-4"
                  rows="3"
                  value={rule.template}
                  onChange={(event) => setRules((current) => current.map((item) => (item.id === rule.id ? { ...item, template: event.target.value } : item)))}
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-xl font-bold">Coda follow-up</h2>
          <p className="mt-1 text-sm text-slate-500">Pazienti che rispettano le regole attive e hanno consenso WhatsApp.</p>
          <div className="mt-5 space-y-3">
            {duePatients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <div>
                  <div className="font-bold">{patient.name}</div>
                  <div className="text-sm text-slate-500">{patient.dueReason} · ultimo appuntamento {daysSince(patient.lastVisit)} giorni fa</div>
                </div>
                <Pill tone="teal">Invio automatico</Pill>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function PatientsSection({ patients, setPatients }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    preferredTimes: ["Pomeriggio"],
    treatments: ["Igiene dentale"],
    consent: true,
    notes: "",
  });

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setPatients((current) => [
      ...current,
      {
        ...form,
        id: makeId("p"),
        distanceMinutes: 15,
        responseRate: 70,
        waitingList: false,
        lastVisit: addDays(todayISO(), -180),
      },
    ]);
    setForm({ name: "", phone: "", preferredTimes: ["Pomeriggio"], treatments: ["Igiene dentale"], consent: true, notes: "" });
  };

  return (
    <>
      <SectionHeader
        eyebrow="CRM pazienti"
        title="Anagrafica e preferenze"
        description="Ogni paziente contiene i dati usati dal bot: consenso WhatsApp, preferenze orarie, trattamenti, storico e note operative."
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-6">
          <h2 className="text-xl font-bold">Nuovo paziente</h2>
          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <Field label="Nome e cognome">
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Es. Laura Verdi" />
            </Field>
            <Field label="Telefono WhatsApp">
              <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+39 ..." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fascia preferita">
                <Select value={form.preferredTimes[0]} onChange={(event) => setForm({ ...form, preferredTimes: [event.target.value] })}>
                  {TIME_PREFERENCES.map((time) => <option key={time}>{time}</option>)}
                </Select>
              </Field>
              <Field label="Trattamento principale">
                <Select value={form.treatments[0]} onChange={(event) => setForm({ ...form, treatments: [event.target.value] })}>
                  {TREATMENTS.map((treatment) => <option key={treatment}>{treatment}</option>)}
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} />
              Consenso comunicazioni WhatsApp attivo
            </label>
            <Field label="Note">
              <Textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </Field>
            <Button type="submit">Salva paziente</Button>
          </form>
        </Panel>

        <Panel className="overflow-hidden">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Paziente</th>
                <th className="px-5 py-4">Numero WhatsApp</th>
                <th className="px-5 py-4">Preferenze</th>
                <th className="px-5 py-4">Consenso</th>
                <th className="px-5 py-4">Storico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <tr key={patient.id} className="bg-white">
                  <td className="px-5 py-4">
                    <div className="font-bold">{patient.name}</div>
                    <div className="text-xs text-slate-500">{patient.notes}</div>
                  </td>
                  <td className="px-5 py-4">{patient.phone}</td>
                  <td className="px-5 py-4">{patient.preferredTimes.join(", ")} · {patient.treatments.join(", ")}</td>
                  <td className="px-5 py-4"><Pill tone={patient.consent ? "green" : "rose"}>{patient.consent ? "Attivo" : "Assente"}</Pill></td>
                  <td className="px-5 py-4 text-slate-600">{daysSince(patient.lastVisit)} giorni fa</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

function WaitlistSection({ waitlist, setWaitlist, patients }) {
  const [form, setForm] = useState({ patientId: patients[0]?.id || "", treatment: "Igiene dentale", preferredTimes: "Pomeriggio", notes: "" });
  const submit = (event) => {
    event.preventDefault();
    const patient = patients.find((item) => item.id === form.patientId);
    if (!patient) return;
    setWaitlist((current) => [...current, { ...form, id: makeId("w"), name: patient.name }]);
    setForm({ patientId: patients[0]?.id || "", treatment: "Igiene dentale", preferredTimes: "Pomeriggio", notes: "" });
  };

  return (
    <>
      <SectionHeader
        eyebrow="Lista d'attesa"
        title="Pazienti disponibili ad anticipare"
        description="La lista d'attesa alimenta il Fill the Gap con trattamento richiesto, fascia preferita e note operative. WhatsApp e' l'unico canale di contatto."
      />
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Panel className="p-6">
          <h2 className="text-xl font-bold">Aggiungi alla lista</h2>
          <form className="mt-5 grid gap-4" onSubmit={submit}>
            <Field label="Paziente">
              <Select value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
              </Select>
            </Field>
            <Field label="Trattamento">
              <Select value={form.treatment} onChange={(event) => setForm({ ...form, treatment: event.target.value })}>
                {TREATMENTS.map((treatment) => <option key={treatment}>{treatment}</option>)}
              </Select>
            </Field>
            <Field label="Fascia preferita">
              <Select value={form.preferredTimes} onChange={(event) => setForm({ ...form, preferredTimes: event.target.value })}>
                {TIME_PREFERENCES.map((time) => <option key={time}>{time}</option>)}
              </Select>
            </Field>
            <Field label="Note">
              <Textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </Field>
            <Button type="submit">Inserisci</Button>
          </form>
        </Panel>
        <Panel className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Paziente</th>
                <th className="px-5 py-4">Trattamento</th>
                <th className="px-5 py-4">Fascia preferita</th>
                <th className="px-5 py-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waitlist.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-bold">{item.name}</td>
                  <td className="px-5 py-4">{item.treatment}</td>
                  <td className="px-5 py-4">{item.preferredTimes}</td>
                  <td className="px-5 py-4 text-slate-600">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </>
  );
}

function QuotesSection({ quotes }) {
  return (
    <>
      <SectionHeader
        eyebrow="Preventivi"
        title="Trattamenti da seguire"
        description="I preventivi non restano fermi: la regola automatica invia follow-up WhatsApp progressivi e registra le risposte."
      />
      <Panel className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">Paziente</th>
              <th className="px-5 py-4">Trattamento</th>
              <th className="px-5 py-4">Invio</th>
              <th className="px-5 py-4">Stato</th>
              <th className="px-5 py-4">Prossima azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((quote) => (
              <tr key={quote.id}>
                <td className="px-5 py-4 font-bold">{quote.name}</td>
                <td className="px-5 py-4">{quote.treatment}</td>
                <td className="px-5 py-4">{formatDate(quote.sentAt)}</td>
                <td className="px-5 py-4"><Pill tone="teal">{quote.status}</Pill></td>
                <td className="px-5 py-4 text-slate-600">{quote.nextAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

function AutomationsSection({ automations, setAutomations }) {
  return (
    <>
      <SectionHeader
        eyebrow="Motore operativo"
        title="Automazioni"
        description="Le automazioni sono pensate per funzionare in background: WhatsApp in ingresso, agenda, Fill the Gap, follow-up e preventivi."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {automations.map((automation) => (
          <Panel key={automation.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">{automation.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{automation.detail}</p>
              </div>
              <button
                onClick={() => setAutomations((current) => current.map((item) => (item.id === automation.id ? { ...item, active: !item.active } : item)))}
                className={`rounded-full px-4 py-2 text-xs font-bold ${automation.active ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-500"}`}
              >
                {automation.active ? "Attiva" : "Spenta"}
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function WhatsAppSection({ patients, appointments, setAppointments, onCreateGap, log, setLog }) {
  const [studioPhone, setStudioPhone] = useStoredState("studioflow-whatsapp-phone", "393331234567");
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || "");
  const [message, setMessage] = useState("Non posso piu' venire all'appuntamento di oggi alle 16:00.");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) || patients[0];
  const waUrl = `https://wa.me/${studioPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent("Buongiorno, vorrei gestire il mio appuntamento.")}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(waUrl)}`;
  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/whatsapp-webhook` : "/api/whatsapp-webhook";

  const processMessage = async () => {
    if (!selectedPatient || !message.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/analyze-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          patientName: selectedPatient.name,
          context: {
            source: "product-whatsapp",
            appointments: appointments.filter((item) => item.patientId === selectedPatient.id).slice(0, 10),
          },
        }),
      });
      const payload = await response.json();
      const analysis = payload.analysis || {};
      const ownAppointments = appointments.filter((item) => item.patientId === selectedPatient.id && item.status !== "annullato");
      const cancellationTarget = pickAppointmentForCancellation(ownAppointments, analysis);
      const options = findOpenSlots(appointments, todayISO(), "");
      const isCancellation = analysis.intent === "rinuncia" || isCancellationIntentText(message);
      const finalAnalysis = isCancellation ? { ...analysis, intent: "rinuncia", intentLabel: "Rinuncia appuntamento", confidence: analysis.confidence || "Alta" } : analysis;
      let operationalReply = analysis.reply || `Ciao ${selectedPatient.name.split(" ")[0]}, abbiamo preso in carico la richiesta.`;
      let action = "Nessuna modifica automatica";

      if (isCancellation && cancellationTarget.appointment) {
        const appointmentToFree = cancellationTarget.appointment;
        setAppointments((current) => current.map((item) => (item.id === appointmentToFree.id ? { ...item, status: "da riempire" } : item)));
        onCreateGap(appointmentToFree);
        action = "Slot liberato e Fill the Gap avviato";
        const matchText = cancellationTarget.match === "exact" ? "per l'appuntamento indicato" : "collegandola al tuo prossimo appuntamento registrato in agenda";
        operationalReply = `Grazie ${selectedPatient.name.split(" ")[0]}, abbiamo registrato la rinuncia ${matchText}: ${formatDate(appointmentToFree.date)} alle ${appointmentToFree.time}. Lo studio sta riorganizzando lo slot; intanto ti proponiamo queste alternative: ${options.slice(0, 2).map((item) => `${formatDate(item.date)} alle ${item.time}`).join(" oppure ")}.`;
      } else if ((analysis.intent === "spostamento" || analysis.intent === "richiesta_disponibilita") && options.length) {
        action = "Agenda consultata e nuove disponibilita' proposte";
        operationalReply = `Ciao ${selectedPatient.name.split(" ")[0]}, abbiamo controllato l'agenda. Le prime disponibilita' compatibili sono ${options.slice(0, 2).map((item) => `${formatDate(item.date)} alle ${item.time}`).join(" oppure ")}. Quale preferisci?`;
      } else if (analysis.intent === "conferma") {
        action = "Conferma registrata";
      } else if (isCancellation && !cancellationTarget.appointment) {
        action = "Agenda consultata e nuova disponibilita' proposta";
        operationalReply = `Ciao ${selectedPatient.name.split(" ")[0]}, abbiamo ricevuto la rinuncia e controllato l'agenda. Non risultano appuntamenti attivi associati al tuo contatto; ti proponiamo comunque queste disponibilita': ${options.slice(0, 2).map((item) => `${formatDate(item.date)} alle ${item.time}`).join(" oppure ")}.`;
      }

      const entry = {
        id: makeId("log"),
        createdAt: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        patient: selectedPatient.name,
        message,
        action,
        reply: operationalReply,
        engine: payload.usedGemini ? "Gemini backend" : payload.usedOpenAI ? "OpenAI backend" : "Fallback locale",
      };
      setResult({ ...finalAnalysis, action, reply: operationalReply, engine: entry.engine });
      setLog((current) => [entry, ...current].slice(0, 12));
    } catch (error) {
      setResult({
        intentLabel: "Errore analisi",
        confidence: "Bassa",
        action: "Richiede controllo",
        reply: "Il sistema non riesce a completare l'analisi in questo momento.",
        engine: "Non disponibile",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SectionHeader
        eyebrow="Canale unico"
        title="WhatsApp operativo"
        description="Il prodotto usa WhatsApp come canale principale. Per il prodotto cloud il collegamento corretto e' WhatsApp Business API; il QR serve solo ad aprire rapidamente la chat dello studio."
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-6">
          <h2 className="text-xl font-bold">Collegamento WhatsApp</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Per automazione reale servono numero Business, webhook Meta e token di accesso. WhatsApp Web con QR non e' stabile su Vercel per un servizio sempre acceso.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Numero studio in formato internazionale">
              <Input value={studioPhone} onChange={(event) => setStudioPhone(event.target.value)} />
            </Field>
            <div className="flex items-end">
              <a className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white" href={waUrl} target="_blank" rel="noreferrer">
                Apri chat
              </a>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center">
            <img className="h-36 w-36 rounded-xl border border-slate-200 bg-white p-2" src={qrUrl} alt="QR WhatsApp" />
            <div>
              <div className="font-bold">QR avvio chat</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Inquadra il QR per aprire la chat dello studio. Per il bot automatico, collega invece WhatsApp Business API.</p>
              <div className="mt-3 break-all text-xs text-slate-500">{waUrl}</div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600">
            Variabili server richieste: <strong>WHATSAPP_ACCESS_TOKEN</strong>, <strong>WHATSAPP_PHONE_NUMBER_ID</strong>, <strong>WHATSAPP_VERIFY_TOKEN</strong>.
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Webhook WhatsApp Business</div>
            <div className="mt-2 break-all rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{webhookUrl}</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">Questo URL riceve i messaggi reali, li passa a Gemini e invia la risposta automatica tramite WhatsApp Cloud API.</p>
          </div>
        </Panel>

        <Panel className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Motore messaggi in ingresso</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">La stessa logica viene usata dal webhook WhatsApp: comprende il messaggio, consulta agenda e produce l'azione successiva.</p>
            </div>
            <Pill tone="teal">Gemini API</Pill>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Contatto WhatsApp">
              <Select value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)}>
                {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
              </Select>
            </Field>
            <Field label="Messaggio ricevuto">
              <Textarea rows="4" value={message} onChange={(event) => setMessage(event.target.value)} />
            </Field>
            <Button onClick={processMessage} disabled={loading}>{loading ? "Analisi in corso..." : "Elabora messaggio"}</Button>
          </div>
          {result ? (
            <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
              <div className="flex flex-wrap gap-2">
                <Pill tone="teal">{result.intentLabel || "Analisi completata"}</Pill>
                <Pill tone="slate">{result.confidence || "Confidenza"}</Pill>
                <Pill tone="green">{result.engine}</Pill>
              </div>
              <h3 className="mt-4 text-lg font-bold">{result.action}</h3>
              <p className="mt-3 text-sm font-semibold text-slate-700">Risposta WhatsApp automatica</p>
              <p className="mt-2 rounded-2xl border border-teal-200 bg-white p-4 text-sm leading-6 text-slate-700">{result.reply}</p>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel className="mt-6 p-6">
        <h2 className="text-xl font-bold">Registro operativo</h2>
        <div className="mt-5 space-y-3">
          {log.length ? (
            log.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold">{entry.createdAt} · {entry.patient}</div>
                  <Pill tone="slate">{entry.engine}</Pill>
                </div>
                <p className="mt-2 text-sm text-slate-600">{entry.message}</p>
                <p className="mt-2 text-sm font-semibold text-teal-700">{entry.action}</p>
                <p className="mt-2 text-sm text-slate-600">{entry.reply}</p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Nessun evento WhatsApp ancora registrato.</div>
          )}
        </div>
      </Panel>
    </>
  );
}

function ProductApp() {
  const [activeSection, setActiveSection] = useState("home");
  const [patients, setPatients] = useStoredState("studioflow-patients", INITIAL_PATIENTS);
  const [appointments, setAppointments] = useStoredState("studioflow-appointments", INITIAL_APPOINTMENTS);
  const [waitlist, setWaitlist] = useStoredState("studioflow-waitlist", INITIAL_WAITLIST);
  const [quotes] = useStoredState("studioflow-quotes", INITIAL_QUOTES);
  const [rules, setRules] = useStoredState("studioflow-rules", INITIAL_RULES);
  const [automations, setAutomations] = useStoredState("studioflow-automations", INITIAL_AUTOMATIONS);
  const [gaps, setGaps] = useStoredState("studioflow-gaps", []);
  const [log, setLog] = useStoredState("studioflow-log", []);
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const createGap = (appointment) => {
    setGaps((current) => {
      if (current.some((gap) => gap.appointmentId === appointment.id && gap.status !== "archiviato")) return current;
      const candidates = buildTopCandidates(patients, appointment, waitlist);
      return [
        {
          id: makeId("gap"),
          appointmentId: appointment.id,
          slot: appointment,
          status: "da gestire",
          createdAt: new Date().toISOString(),
          candidates,
        },
        ...current,
      ];
    });
  };

  const cancelAppointment = (appointmentId) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
    if (!appointment) return;
    setAppointments((current) => current.map((item) => (item.id === appointmentId ? { ...item, status: "da riempire" } : item)));
    createGap({ ...appointment, status: "da riempire" });
    setActiveSection("fillgap");
  };

  const createAppointment = (form) => {
    const patient = patients.find((item) => item.id === form.patientId);
    const appointment = {
      ...form,
      id: makeId("a"),
      patientName: patient?.name || form.patientName,
      phone: patient?.phone || form.phone,
      status: form.status || "confermato",
    };
    setAppointments((current) => [...current, appointment]);
    setSelectedDate(appointment.date);
  };

  const runGap = (gapId) => {
    setGaps((current) =>
      current.map((gap) => {
        if (gap.id !== gapId) return gap;
        const candidate = gap.candidates.find((item) => item.status !== "Non contattare") || gap.candidates[0];
        return {
          ...gap,
          status: candidate ? `WhatsApp inviati · in attesa di ${candidate.name}` : "Nessun candidato contattabile",
          candidates: gap.candidates.map((item, index) => {
            if (index < 10 && item.status !== "Non contattare") return { ...item, status: index === 0 ? "Primo contatto inviato" : "Invio in coda top 10" };
            return item;
          }),
        };
      })
    );
  };

  const closeGap = (gapId) => {
    setGaps((current) => current.map((gap) => (gap.id === gapId ? { ...gap, status: "archiviato" } : gap)).filter((gap) => gap.status !== "archiviato"));
  };

  const visibleGaps = useMemo(() => gaps.filter((gap) => gap.status !== "archiviato"), [gaps]);

  if (activeSection === "home") {
    return <HomeScreen setActiveSection={setActiveSection} />;
  }

  return (
    <AppShell activeSection={activeSection} setActiveSection={setActiveSection}>
      {activeSection === "agenda" ? (
        <AgendaSection
          patients={patients}
          appointments={appointments}
          setAppointments={setAppointments}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onCancelAppointment={cancelAppointment}
          onCreateAppointment={createAppointment}
        />
      ) : null}
      {activeSection === "fillgap" ? (
        <FillGapSection gaps={visibleGaps} patients={patients} appointments={appointments} waitlist={waitlist} onRunGap={runGap} onCloseGap={closeGap} />
      ) : null}
      {activeSection === "followup" ? <FollowUpSection patients={patients} rules={rules} setRules={setRules} /> : null}
      {activeSection === "patients" ? <PatientsSection patients={patients} setPatients={setPatients} /> : null}
      {activeSection === "waitlist" ? <WaitlistSection waitlist={waitlist} setWaitlist={setWaitlist} patients={patients} /> : null}
      {activeSection === "quotes" ? <QuotesSection quotes={quotes} /> : null}
      {activeSection === "automations" ? <AutomationsSection automations={automations} setAutomations={setAutomations} /> : null}
      {activeSection === "whatsapp" ? (
        <WhatsAppSection
          patients={patients}
          appointments={appointments}
          setAppointments={setAppointments}
          onCreateGap={createGap}
          log={log}
          setLog={setLog}
        />
      ) : null}
    </AppShell>
  );
}

export default function ProdottoStudioDentistico() {
  return <ProductApp />;
}

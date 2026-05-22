import { useState, useEffect } from "react";

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const PAZIENTI = [
  { id:1, nome:"Maria Rossi",    tel:"340 123 4567", email:"maria.rossi@gmail.com",    ultimoApp:"12/11/2024", prossimoApp:"—",           consenso:true,  trattamenti:["Igiene","Controllo"],          consigliati:["Igiene scaduta"],        valoreStorico:640,  probRitorno:92, badge:["In lista d'attesa","Igiene scaduta","Alta probabilità risposta"], note:"Disponibile pomeriggio" },
  { id:2, nome:"Luca Bianchi",   tel:"347 234 5678", email:"luca.bianchi@libero.it",   ultimoApp:"05/10/2024", prossimoApp:"—",           consenso:true,  trattamenti:["Igiene","Sbiancamento"],       consigliati:["Igiene scaduta"],        valoreStorico:890,  probRitorno:81, badge:["Igiene scaduta"],                                               note:"" },
  { id:3, nome:"Sara Colombo",   tel:"333 345 6789", email:"sara.colombo@hotmail.com", ultimoApp:"20/11/2024", prossimoApp:"—",           consenso:true,  trattamenti:["Igiene"],                      consigliati:["Prossima igiene"],       valoreStorico:360,  probRitorno:74, badge:[],                                                               note:"Preferisce mattina" },
  { id:4, nome:"Elena Conti",    tel:"329 456 7890", email:"elena.conti@gmail.com",    ultimoApp:"03/09/2024", prossimoApp:"—",           consenso:true,  trattamenti:["Visita","Controllo"],          consigliati:["Preventivo impianto"],   valoreStorico:420,  probRitorno:68, badge:["Preventivo aperto"],                                            note:"Interessata a implantologia" },
  { id:5, nome:"Roberto Galli",  tel:"338 567 8901", email:"roberto.galli@gmail.com",  ultimoApp:"18/10/2024", prossimoApp:"28/01/2025",  consenso:true,  trattamenti:["Ortodonzia"],                  consigliati:["Ortodonzia follow-up"],  valoreStorico:1200, probRitorno:85, badge:["Paziente VIP"],                                                  note:"" },
  { id:6, nome:"Paola Esposito", tel:"366 678 9012", email:"paola.esposito@yahoo.it",  ultimoApp:"14/06/2024", prossimoApp:"—",           consenso:true,  trattamenti:["Igiene","Sbiancamento"],       consigliati:["Sbiancamento"],          valoreStorico:710,  probRitorno:55, badge:["Preventivo aperto"],                                            note:"" },
  { id:7, nome:"Antonio Greco",  tel:"335 789 0123", email:"antonio.greco@gmail.com",  ultimoApp:"29/07/2024", prossimoApp:"—",           consenso:true,  trattamenti:["Controllo","Devitalizzazione"],consigliati:["Controllo annuale"],    valoreStorico:980,  probRitorno:69, badge:["Inattivo"],                                                     note:"Disponibile pomeriggio" },
  { id:8, nome:"Giulia Ferri",   tel:"342 890 1234", email:"giulia.ferri@gmail.com",   ultimoApp:"10/12/2024", prossimoApp:"10/02/2025",  consenso:true,  trattamenti:["Igiene","Controllo"],          consigliati:[],                        valoreStorico:540,  probRitorno:76, badge:[],                                                               note:"" },
  { id:9, nome:"Marco Riva",     tel:"351 901 2345", email:"marco.riva@libero.it",     ultimoApp:"08/01/2024", prossimoApp:"—",           consenso:false, trattamenti:["Controllo"],                   consigliati:["Controllo annuale"],     valoreStorico:210,  probRitorno:42, badge:["Inattivo"],                                                     note:"Consenso non attivo" },
  { id:10,nome:"Andrea Moretti", tel:"344 012 3456", email:"andrea.moretti@gmail.com", ultimoApp:"15/02/2024", prossimoApp:"—",           consenso:true,  trattamenti:["Igiene","Visita bambini"],     consigliati:["Igiene scaduta"],        valoreStorico:480,  probRitorno:63, badge:["Inattivo"],                                                     note:"Porta anche i figli" },
];

const AGENDA_BASE = [
  { id:"a1", ora:"09:00", paziente:"Roberto Galli",  trattamento:"Ortodonzia controllo",    valore:120, stato:"completato" },
  { id:"a2", ora:"10:00", paziente:"Giulia Ferri",   trattamento:"Igiene dentale",           valore:90,  stato:"completato" },
  { id:"a3", ora:"11:00", paziente:"Sara Colombo",   trattamento:"Visita di controllo",      valore:70,  stato:"confermato" },
  { id:"a4", ora:"12:00", paziente:"—",              trattamento:"Slot libero",              valore:0,   stato:"libero" },
  { id:"a5", ora:"14:00", paziente:"Marco Riva",     trattamento:"Devitalizzazione",         valore:380, stato:"confermato" },
  { id:"a6", ora:"15:00", paziente:"Paola Esposito", trattamento:"Sbiancamento",             valore:350, stato:"rischio" },
  { id:"a7", ora:"16:00", paziente:"—",              trattamento:"Igiene dentale — paziente ha cancellato", valore:90,  stato:"da riempire" },
  { id:"a8", ora:"17:00", paziente:"Luca Bianchi",   trattamento:"Controllo",                valore:70,  stato:"confermato" },
  { id:"a9", ora:"18:00", paziente:"Elena Conti",    trattamento:"Visita implantologia",     valore:150, stato:"confermato" },
];

const PREVENTIVI_BASE = [
  { id:"p1", paziente:"Elena Conti",    trattamento:"Impianto dentale",     valore:2400, inviato:"12 giorni fa", probChiusura:68, ultimoContatto:"8 giorni fa",  prossimaAzione:"Follow-up consigliato", stato:"Aperto",  canale:"WhatsApp" },
  { id:"p2", paziente:"Roberto Galli",  trattamento:"Ortodonzia invisibile",valore:3200, inviato:"5 giorni fa",  probChiusura:75, ultimoContatto:"5 giorni fa",  prossimaAzione:"Reminder soft",         stato:"Aperto",  canale:"Email" },
  { id:"p3", paziente:"Paola Esposito", trattamento:"Sbiancamento premium", valore:350,  inviato:"20 giorni fa", probChiusura:41, ultimoContatto:"20 giorni fa", prossimaAzione:"Offerta limitata",      stato:"Aperto",  canale:"SMS" },
  { id:"p4", paziente:"Antonio Greco",  trattamento:"Protesi parziale",     valore:1800, inviato:"3 giorni fa",  probChiusura:55, ultimoContatto:"3 giorni fa",  prossimaAzione:"Messaggio gentile",     stato:"Aperto",  canale:"WhatsApp" },
  { id:"p5", paziente:"Andrea Moretti", trattamento:"Apparecchio fisso",    valore:2100, inviato:"45 giorni fa", probChiusura:22, ultimoContatto:"30 giorni fa", prossimaAzione:"Chiudi o rimanda",      stato:"Freddo",  canale:"Email" },
];

const AUTOMAZIONI_BASE = [
  { id:"au1", nome:"Fill the Gap — Cancellazioni",       trigger:"Cancellazione last-minute",      canale:"WhatsApp/SMS", inviati:47, conversioni:31, fattRecuperato:2790, attivo:true  },
  { id:"au2", nome:"Reminder Appuntamento 24h",          trigger:"24h prima appuntamento",         canale:"WhatsApp",     inviati:198,conversioni:187,fattRecuperato:0,    attivo:true  },
  { id:"au3", nome:"Reminder Appuntamento 2h",           trigger:"2h prima appuntamento",          canale:"SMS",          inviati:156,conversioni:148,fattRecuperato:0,    attivo:true  },
  { id:"au4", nome:"Richiamo Igiene 6 mesi",             trigger:"6 mesi da ultima igiene",        canale:"WhatsApp",     inviati:87, conversioni:54, fattRecuperato:4860, attivo:true  },
  { id:"au5", nome:"Follow-up Preventivi",               trigger:"Preventivo non confermato >3gg", canale:"WhatsApp/Email",inviati:23,conversioni:8,  fattRecuperato:9600, attivo:true  },
  { id:"au6", nome:"Recupero Pazienti Inattivi",         trigger:"Nessun appuntamento >12 mesi",   canale:"WhatsApp",     inviati:34, conversioni:18, fattRecuperato:2160, attivo:true  },
  { id:"au7", nome:"Controllo Post-Intervento",          trigger:"7 giorni dopo intervento",       canale:"WhatsApp",     inviati:62, conversioni:58, fattRecuperato:0,    attivo:true  },
  { id:"au8", nome:"Richiesta Recensione Google",        trigger:"Visita completata",              canale:"WhatsApp/SMS", inviati:89, conversioni:41, fattRecuperato:0,    attivo:false },
  { id:"au9", nome:"Messaggio Compleanno",               trigger:"Giorno del compleanno",          canale:"WhatsApp",     inviati:12, conversioni:5,  fattRecuperato:450,  attivo:false },
  { id:"au10",nome:"Reminder Pagamento Saldo",           trigger:"Saldo non registrato >30gg",     canale:"Email",        inviati:8,  conversioni:6,  fattRecuperato:1200, attivo:false },
];

const MESSAGGI_BASE = [
  { id:"m1", paziente:"Maria Rossi",    testo:"Ciao Maria, si è appena liberato uno slot domani alle 16:00 per igiene dentale. Offriamo uno sconto del 20%. Confermi? Rispondi SÌ.",   canale:"WhatsApp", stato:"risposto",  risposta:"SÌ, confermo per domani alle 16:00! Grazie mille 😊", ora:"14:32" },
  { id:"m2", paziente:"Sara Colombo",   testo:"Ciao Sara, sono passati 6 mesi dalla tua ultima igiene. Vuoi prenotare la prossima? Abbiamo disponibilità questa settimana.",           canale:"WhatsApp", stato:"risposto",  risposta:"Avete disponibilità venerdì mattina?",               ora:"10:15" },
  { id:"m3", paziente:"Elena Conti",    testo:"Ciao Elena, volevamo sapere se hai avuto modo di valutare il preventivo per l'impianto. Possiamo fissare una chiamata con il dottore.", canale:"WhatsApp", stato:"risposto",  risposta:"Vorrei parlare con il dottore del preventivo.",       ora:"09:48" },
  { id:"m4", paziente:"Luca Bianchi",   testo:"Ciao Luca, si è liberato uno slot domani alle 16:00 per igiene dentale. Sconto 20% disponibile. Ti interessa?",                        canale:"SMS",      stato:"inviato",   risposta:"",                                                   ora:"14:33" },
  { id:"m5", paziente:"Antonio Greco",  testo:"Buongiorno Antonio, ti ricordiamo che sono passati 14 mesi dalla tua ultima visita. Quando vuoi rientrare siamo disponibili.",           canale:"WhatsApp", stato:"consegnato", risposta:"",                                                  ora:"11:20" },
  { id:"m6", paziente:"Paola Esposito", testo:"Ciao Paola, hai ancora tempo per approfittare dell'offerta sul sbiancamento. Risponde entro venerdì per il prezzo speciale.",           canale:"Email",    stato:"letto",     risposta:"",                                                   ora:"08:55" },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => `€${n.toLocaleString("it-IT")}`;

const badgeColor = {
  "In lista d'attesa":         "bg-blue-100 text-blue-700",
  "Igiene scaduta":            "bg-amber-100 text-amber-700",
  "Preventivo aperto":         "bg-purple-100 text-purple-700",
  "Paziente VIP":              "bg-yellow-100 text-yellow-700",
  "Inattivo":                  "bg-gray-200 text-gray-600",
  "Alta probabilità risposta": "bg-emerald-100 text-emerald-700",
};

const statoColor = {
  confermato: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  rischio:    "bg-amber-100 text-amber-700 border border-amber-200",
  cancellato:  "bg-red-100 text-red-700 border border-red-200",
  "da riempire": "bg-red-100 text-red-700 border border-red-200",
  libero:      "bg-gray-100 text-gray-500 border border-dashed border-gray-300",
  riempito:    "bg-blue-100 text-blue-700 border border-blue-200",
  completato:  "bg-slate-100 text-slate-500 border border-slate-200",
};

const canaleIcon = { WhatsApp:"💬", SMS:"📱", Email:"✉️", "WhatsApp/SMS":"💬", "WhatsApp/Email":"💬" };

// ── COMPONENTS ───────────────────────────────────────────────────────────────

function Badge({ label }) {
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor[label] || "bg-gray-100 text-gray-600"}`}>{label}</span>;
}

function Card({ children, className="", ...props }) {
  return <div className={`bg-white rounded-lg shadow-sm border border-slate-100 ${className}`} {...props}>{children}</div>;
}

function KpiCard({ label, value, sub, color="text-teal-600", icon }) {
  return (
    <Card className="p-5 flex items-start gap-4">
      <div className={`text-3xl`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      {sub && <p className="text-sm text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ kpi, setSection }) {
  return (
    <div>
      <SectionHeader title="Dashboard" sub="Panoramica dello Studio Dentistico Aurora — oggi" />

      <Card className="p-5 mb-6 bg-gradient-to-r from-teal-600 to-blue-600 text-white border-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">DentFlow AI per studi dentistici</p>
            <h1 className="text-2xl font-bold mt-1">Nessuno slot lasciato vuoto.</h1>
            <p className="text-sm text-teal-50 mt-2 max-w-2xl">Il sistema lavora sul portafoglio pazienti esistente dello studio: recupera cancellazioni, richiama pazienti inattivi e segue i preventivi prima che diventino fatturato perso.</p>
          </div>
          <button onClick={()=>setSection("fillgap")} className="bg-white text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors">
            Trasforma in un'opportunità
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard icon="💶" label="Fatturato recuperato" value={fmt(kpi.fattRecuperato)} sub="questo mese" color="text-teal-600" />
        <KpiCard icon="🕐" label="Ore buche evitate" value={`${kpi.oreBuche}h`} sub="questo mese" color="text-blue-600" />
        <KpiCard icon="📅" label="App. recuperati" value={kpi.appRecuperati} sub="tramite Fill the Gap" color="text-indigo-600" />
        <KpiCard icon="🤖" label="Pazienti contattati" value={kpi.pazientiContattati} sub="automaticamente" color="text-purple-600" />
        <KpiCard icon="📋" label="Preventivi seguiti" value={kpi.preventiviSeguiti} sub="in follow-up attivo" color="text-orange-500" />
        <KpiCard icon="💬" label="Tasso risposta" value={`${kpi.tassoRisposta}%`} sub="ai messaggi automatici" color="text-pink-600" />
        <KpiCard icon="✅" label="Automazioni attive" value={kpi.automazioniAttive} sub="in esecuzione" color="text-emerald-600" />
        <KpiCard icon="⭐" label="ROI stimato" value={`${kpi.roi}x`} sub="costo servizio €400/mese" color="text-yellow-600" />
      </div>

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2"><span className="text-lg">🔔</span> Opportunità di oggi</h3>
          <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">4 nuove</span>
        </div>
        <div className="space-y-3">
          {[
            { icon:"🚨", msg:"Cancellazione domani alle 16:00 — Igiene dentale — possibile recupero €90", cta:"Fill the Gap →", action:()=>setSection("fillgap"), color:"border-l-4 border-l-red-400 bg-red-50" },
            { icon:"⏳", msg:"Paziente in lista d'attesa compatibile: Maria Rossi", cta:"Vedi lista →", action:()=>setSection("listattesa"), color:"border-l-4 border-l-blue-400 bg-blue-50" },
            { icon:"📩", msg:"3 pazienti da richiamare per controllo semestrale", cta:"Follow-up →", action:()=>setSection("followup"), color:"border-l-4 border-l-amber-400 bg-amber-50" },
            { icon:"💰", msg:"2 preventivi implantologia non ancora confermati — valore €5.600", cta:"Preventivi →", action:()=>setSection("preventivi"), color:"border-l-4 border-l-purple-400 bg-purple-50" },
          ].map((o,i)=>(
            <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg ${o.color}`}>
              <p className="text-sm text-slate-700">{o.icon} {o.msg}</p>
              <button onClick={o.action} className="text-xs font-semibold text-teal-600 hover:text-teal-800 whitespace-nowrap ml-4">{o.cta}</button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><span>📊</span> Fatturato recuperato (ultimi 6 mesi)</h3>
          <div className="flex items-end gap-2 h-28">
            {[1800,2400,1600,3100,2800,kpi.fattRecuperato].map((v,i)=>(
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] text-slate-400">€{(v/1000).toFixed(1)}k</span>
                <div className="w-full rounded-t-lg bg-teal-500 transition-all" style={{height:`${(v/4000)*100}%`, minHeight:8}}></div>
                <span className="text-[10px] text-slate-400">{["Ago","Set","Ott","Nov","Dic","Gen"][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><span>🎯</span> Performance automazioni</h3>
          <div className="space-y-3">
            {[
              { label:"Fill the Gap", pct:66, color:"bg-teal-500" },
              { label:"Richiamo Igiene", pct:62, color:"bg-blue-500" },
              { label:"Follow-up Preventivi", pct:35, color:"bg-purple-500" },
              { label:"Pazienti Inattivi", pct:53, color:"bg-amber-500" },
            ].map((a,i)=>(
              <div key={i}>
                <div className="flex justify-between text-xs text-slate-500 mb-1"><span>{a.label}</span><span>{a.pct}% conversione</span></div>
                <div className="h-2 bg-slate-100 rounded-full"><div className={`h-2 rounded-full ${a.color} transition-all`} style={{width:`${a.pct}%`}}></div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── AGENDA ───────────────────────────────────────────────────────────────────
function Agenda({ agenda, onSimulaCanc, fillGapAlert, setSection }) {
  return (
    <div>
      <SectionHeader title="Agenda Oggi" sub="Lunedì 27 gennaio 2025 — Studio Dentistico Aurora" />

      <div className="flex gap-3 mb-6 flex-wrap">
        {["completato","confermato","rischio","libero","da riempire","riempito"].map(s=>(
          <div key={s} className="flex items-center gap-1.5 text-xs">
            <div className={`w-3 h-3 rounded-full ${s==="confermato"?"bg-emerald-400":s==="completato"?"bg-slate-300":s==="rischio"?"bg-amber-400":s==="libero"?"bg-gray-300":s==="da riempire"?"bg-red-400":"bg-blue-400"}`}></div>
            <span className="text-slate-500 capitalize">{s}</span>
          </div>
        ))}
        <button onClick={onSimulaCanc} className="ml-auto bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          ⚡ Simula cancellazione 16:00
        </button>
      </div>

      {fillGapAlert && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 animate-pulse">
          <span className="text-2xl">🚨</span>
          <div className="flex-1">
            <p className="font-semibold text-red-700">Nuova opportunità Fill the Gap rilevata!</p>
            <p className="text-sm text-red-500">Slot 16:00 — Igiene dentale — €90 a rischio. Vuoi avviare il workflow?</p>
          </div>
          <button onClick={()=>setSection("fillgap")} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
            Avvia recupero
          </button>
        </div>
      )}

      <Card>
        <div className="divide-y divide-slate-50">
          {agenda.map(slot=>(
            <div key={slot.id} className={`flex items-center gap-4 px-5 py-3.5 ${slot.stato==="da riempire"||slot.stato==="cancellato"?"bg-red-50":slot.stato==="rischio"?"bg-amber-50":slot.stato==="riempito"?"bg-blue-50":""}`}>
              <div className="w-14 text-sm font-mono font-bold text-slate-500">{slot.ora}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">{slot.paziente === "—" ? <span className="text-slate-300 italic">Slot libero</span> : slot.paziente}</p>
                <p className="text-xs text-slate-400">{slot.trattamento}</p>
              </div>
              <div className="text-sm font-semibold text-slate-600">{slot.valore>0?fmt(slot.valore):"—"}</div>
              <div><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statoColor[slot.stato]||statoColor.libero}`}>{slot.stato}</span></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── FILL THE GAP ─────────────────────────────────────────────────────────────
function FillTheGap({ agenda, kpi, setKpi, setAgenda }) {
  const [fase, setFase] = useState(0);
  const [invio, setInvio] = useState(false);
  const [confermato, setConfermato] = useState(false);

  const candidates = [
    { nome:"Maria Rossi",    motivo:"In lista d'attesa",    prob:92 },
    { nome:"Luca Bianchi",   motivo:"Igiene scaduta",       prob:81 },
    { nome:"Giulia Ferri",   motivo:"Paziente abituale",    prob:76 },
    { nome:"Antonio Greco",  motivo:"Disponibile pomeriggio",prob:69 },
  ];
  const risposte = [
    { nome:"Maria Rossi", testo:"SÌ, confermo per domani alle 16:00.", stato:"conferma" },
    { nome:"Luca Bianchi", testo:"Non riesco domani, grazie.", stato:"no" },
    { nome:"Giulia Ferri", testo:"Letto, valuto tra poco.", stato:"letto" },
    { nome:"Antonio Greco", testo:"Nessuna risposta ancora", stato:"attesa" },
  ];
  const slotDemo = agenda.find(s=>s.id==="a7");

  useEffect(()=>{
    if (slotDemo?.stato === "riempito") {
      setFase(3);
      setInvio(true);
      setConfermato(true);
    }
  },[slotDemo?.stato]);

  const avvia = () => { setFase(1); };
  const invia = () => {
    setInvio(true);
    setTimeout(()=>{
      setFase(2);
      setTimeout(()=>{
        setConfermato(true);
        setFase(3);
        if (slotDemo?.stato !== "riempito") {
          setKpi(k=>({...k, fattRecuperato:k.fattRecuperato+90, appRecuperati:k.appRecuperati+1, oreBuche:k.oreBuche+1, pazientiContattati:k.pazientiContattati+4}));
        }
        setAgenda(ag=>ag.map(s=>s.id==="a7"?{...s, stato:"riempito", paziente:"Maria Rossi (recuperata)"}:s));
      },2000);
    },2500);
  };

  return (
    <div>
      <SectionHeader title="Fill the Gap" sub="Recupera automaticamente gli slot vuoti causati da cancellazioni" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card className="p-5 col-span-2">
          <div className="flex items-start gap-4 mb-5">
            <div className="text-4xl">🕳️</div>
            <div>
              <p className="font-bold text-lg text-slate-800">Slot vuoto — Domani 16:00</p>
              <p className="text-slate-500 text-sm">Igiene dentale · 1h · <span className="font-semibold text-red-500">€90 a rischio</span></p>
              <span className={`mt-2 inline-block text-xs font-medium px-3 py-1 rounded-full ${fase===3?"bg-blue-100 text-blue-700":"bg-red-100 text-red-700"}`}>
                {fase===3?"✅ Slot riempito":"⚠️ Slot vuoto da riempire"}
              </span>
            </div>
          </div>

          {fase===0 && (
            <div className="bg-slate-50 rounded-lg p-4 mb-4 text-sm text-slate-600">
              <p className="font-semibold mb-2">Senza DentFlow AI:</p>
              <ul className="space-y-1 text-slate-500">
                <li>❌ Slot rimane vuoto per tutta la giornata</li>
                <li>❌ €90 persi</li>
                <li>❌ La segreteria deve chiamare manualmente ogni paziente</li>
              </ul>
            </div>
          )}

          {fase===0 && (
            <button onClick={avvia} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors">
              🚀 Avvia Fill the Gap
            </button>
          )}

          {fase>=1 && (
            <div>
              <p className="font-semibold text-slate-700 mb-3">Pazienti compatibili identificati:</p>
              <div className="space-y-2 mb-4">
                {candidates.map((c,i)=>(
                  <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${confermato&&i===0?"bg-emerald-50 border-emerald-200":"bg-white border-slate-100"}`}>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{c.nome}</p>
                      <p className="text-xs text-slate-400">{c.motivo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${c.prob>=80?"text-emerald-600":c.prob>=70?"text-blue-600":"text-amber-600"}`}>{c.prob}%</p>
                        <p className="text-xs text-slate-400">probabilità</p>
                      </div>
                      {confermato && i===0 && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">✓ Confermata</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wide">Anteprima messaggio WhatsApp</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  💬 <em>"Ciao Maria, si è appena liberato uno slot domani alle 16:00 per igiene dentale presso Studio Dentistico Aurora. Per riempire l'orario offriamo uno sconto del 20%. Vuoi confermare l'appuntamento? Rispondi <strong>SÌ</strong> e lo blocchiamo per te."</em>
                </p>
                <p className="text-[11px] text-slate-400 mt-2">🔒 Invio solo a pazienti con consenso marketing attivo · Opt-out sempre disponibile</p>
              </div>

              {fase===1 && !invio && (
                <button onClick={invia} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors">
                  📤 Invia campagna a 4 pazienti
                </button>
              )}
              {invio && fase<3 && (
                <div className="text-center py-3 text-teal-600 font-semibold animate-pulse">⏳ Messaggi inviati — in attesa di risposta…</div>
              )}
              {fase>=2 && (
                <div className="bg-white border border-slate-100 rounded-lg p-4 mb-4">
                  <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wide">Risposte simulate in tempo reale</p>
                  <div className="space-y-2">
                    {risposte.map((r,i)=>(
                      <div key={i} className={`flex items-center justify-between gap-3 text-sm px-3 py-2 rounded-lg ${r.stato==="conferma"?"bg-emerald-50 text-emerald-700":r.stato==="no"?"bg-slate-50 text-slate-500":"bg-amber-50 text-amber-700"}`}>
                        <span className="font-semibold">{r.nome}</span>
                        <span className="text-right">{r.testo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {fase===3 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="font-bold text-emerald-700">Slot riempito automaticamente!</p>
                  <p className="text-sm text-emerald-600">Maria Rossi ha confermato · €90 recuperati · segreteria non ha fatto nulla</p>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-slate-700 mb-4">💡 Il valore del Fill the Gap</p>
          <div className="space-y-4 text-sm">
            {[
              { label:"Slot recuperati / mese", val:"4–8" },
              { label:"Valore medio per slot", val:"€90" },
              { label:"Fatturato recuperabile", val:"€360–720/mese" },
              { label:"Tempo segreteria risparmiato", val:"3–5 ore/mese" },
            ].map((r,i)=>(
              <div key={i} className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">{r.label}</span>
                <span className="font-bold text-teal-600">{r.val}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 italic">"Anche recuperando solo 2–3 slot al mese, il sistema può ripagarsi da solo."</p>
        </Card>
      </div>
    </div>
  );
}

// ── FOLLOW-UP ────────────────────────────────────────────────────────────────
function FollowUp() {
  const [autoAttiva, setAutoAttiva] = useState(false);
  const basePazienti = [
    { nome:"Sara Colombo",  data:"20 Nov 2024", tratt:"Richiamo igiene",          scad:"20 Mag 2025", canale:"WhatsApp", stato:"Da inviare", valore:90,   color:"bg-amber-50" },
    { nome:"Marco Riva",    data:"08 Gen 2024", tratt:"Controllo annuale",         scad:"Scaduto",     canale:"Email",    stato:"Urgente",    valore:70,   color:"bg-red-50" },
    { nome:"Elena Conti",   data:"03 Set 2024", tratt:"Follow-up preventivo imp.", scad:"Ora",         canale:"WhatsApp", stato:"Urgente",    valore:2400, color:"bg-red-50" },
    { nome:"Andrea Moretti",data:"15 Feb 2024", tratt:"Paziente inattivo",         scad:"Scaduto",     canale:"WhatsApp", stato:"Urgente",    valore:120,  color:"bg-red-50" },
    { nome:"Luca Bianchi",  data:"05 Ott 2024", tratt:"Richiamo igiene",           scad:"05 Apr 2025", canale:"WhatsApp", stato:"Prossimo",   valore:90,   color:"bg-white" },
    { nome:"Antonio Greco", data:"29 Lug 2024", tratt:"Controllo annuale",         scad:"Scaduto",     canale:"WhatsApp", stato:"Urgente",    valore:70,   color:"bg-red-50" },
  ];
  const extraQueue = [
    { nome:"Maria Rossi",   data:"12 Nov 2024", tratt:"Richiamo igiene",           scad:"12 Mag 2025", canale:"WhatsApp", stato:"In coda",    valore:90,   color:"bg-emerald-50" },
    { nome:"Giulia Ferri",  data:"10 Dic 2024", tratt:"Controllo semestrale",      scad:"10 Giu 2025", canale:"SMS",      stato:"In coda",    valore:70,   color:"bg-emerald-50" },
  ];
  const pazienti = autoAttiva ? [...extraQueue, ...basePazienti] : basePazienti;
  const attivaFollowup = () => setAutoAttiva(true);

  return (
    <div>
      <SectionHeader title="Follow-up Automatici" sub="Richiama i pazienti prima che si dimentichino dello studio" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard icon="🔔" label="Richiami urgenti" value="4" sub="da inviare oggi" color="text-red-500" />
        <KpiCard icon="📈" label="Valore potenziale" value={fmt(2750)} sub="pazienti da richiamare" color="text-teal-600" />
        <KpiCard icon="⚡" label="Tasso riattivazione" value="62%" sub="pazienti che rispondono" color="text-blue-600" />
      </div>

      <Card className="mb-6">
        {autoAttiva && (
          <div className="m-4 mb-0 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-emerald-700">Automazione igiene attivata: 2 pazienti aggiunti alla coda follow-up.</p>
            <p className="text-xs text-emerald-600 mt-1">I messaggi partiranno solo verso pazienti con consenso comunicazioni attivo e con opt-out disponibile.</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Paziente</th>
                <th className="text-left px-4 py-3">Ultimo app.</th>
                <th className="text-left px-4 py-3">Trattamento</th>
                <th className="text-left px-4 py-3">Scadenza</th>
                <th className="text-left px-4 py-3">Canale</th>
                <th className="text-left px-4 py-3">Valore</th>
                <th className="text-left px-4 py-3">Stato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pazienti.map((p,i)=>(
                <tr key={i} className={p.color}>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-700">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.data}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.tratt}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.scad}</td>
                  <td className="px-4 py-3 text-sm">{canaleIcon[p.canale]} {p.canale}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-teal-600">{fmt(p.valore)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.stato==="Urgente"?"bg-red-100 text-red-700":p.stato==="Da inviare"?"bg-amber-100 text-amber-700":p.stato==="In coda"?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{p.stato}</span></td>
                  <td className="px-4 py-3"><button className="text-xs bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold px-3 py-1.5 rounded-lg transition-colors">Invia</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">⚙️ Automazione: Richiamo Igiene 6 Mesi</h3>
          <button onClick={attivaFollowup} className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${autoAttiva?"bg-emerald-100 text-emerald-700":"bg-teal-600 hover:bg-teal-700 text-white"}`}>
            {autoAttiva?"Attiva e in esecuzione":"Attiva follow-up igiene"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label:"Trigger",      val:"6 mesi da ultima igiene" },
            { label:"Attesa",       val:"5 mesi e 20 giorni" },
            { label:"Canale",       val:"WhatsApp" },
            { label:"Stato",        val:autoAttiva?"✅ Attiva":"⏸️ Pausa" },
          ].map((f,i)=>(
            <div key={i} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">{f.label}</p>
              <p className="font-semibold text-slate-700">{f.val}</p>
            </div>
          ))}
        </div>
        {autoAttiva && (
          <div className="mt-4 bg-emerald-50 rounded-lg p-4">
            <p className="text-sm font-medium text-emerald-700 mb-1">✅ Automazione attiva — esempio messaggio:</p>
            <p className="text-sm text-emerald-700 italic">"Ciao Sara, sono passati circa 6 mesi dalla tua ultima igiene dentale. Ti consigliamo di prenotare un controllo per mantenere denti e gengive in salute. Vuoi che ti proponiamo qualche disponibilità?"</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── PAZIENTI ─────────────────────────────────────────────────────────────────
function Pazienti() {
  const [sel, setSel] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tutti");
  const filtered = PAZIENTI.filter(p=>{
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==="Tutti" || p.badge.includes(filter) || (filter==="Consenso attivo" && p.consenso) || (filter==="Consenso mancante" && !p.consenso);
    return matchSearch && matchFilter;
  });

  if (sel) return (
    <div>
      <button onClick={()=>setSel(null)} className="mb-4 text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1">← Torna alla lista</button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-1">
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">{sel.nome[0]}</div>
            <h3 className="font-bold text-lg text-slate-800">{sel.nome}</h3>
            <p className="text-sm text-slate-400">{sel.email}</p>
            <p className="text-sm text-slate-400">{sel.tel}</p>
          </div>
          <div className="flex flex-wrap gap-1 justify-center mb-4">{sel.badge.map(b=><Badge key={b} label={b}/>)}</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">Valore storico</span><span className="font-semibold text-teal-600">{fmt(sel.valoreStorico)}</span></div>
            <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">Prob. ritorno</span><span className="font-semibold">{sel.probRitorno}%</span></div>
            <div className="flex justify-between border-b border-slate-50 pb-1"><span className="text-slate-400">Consenso</span><span className={sel.consenso?"text-emerald-600 font-semibold":"text-red-500 font-semibold"}>{sel.consenso?"Attivo":"Non attivo"}</span></div>
            <div className="flex justify-between pb-1"><span className="text-slate-400">Ultimo app.</span><span>{sel.ultimoApp}</span></div>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-700 mb-4">📋 Timeline paziente</h3>
          <div className="space-y-3">
            {[
              { ico:"📅", txt:`Ultimo appuntamento: ${sel.ultimoApp}`, sub:"Visita completata" },
              { ico:"🦷", txt:`Trattamenti effettuati: ${sel.trattamenti.join(", ")}`, sub:"Storico clinico sintetico" },
              { ico:"💬", txt:"Messaggio WhatsApp inviato automaticamente", sub:"Richiamo igiene" },
              { ico:sel.consenso?"✅":"⚠️", txt:`Consenso comunicazioni: ${sel.consenso?"attivo":"non attivo"}`, sub:sel.consenso?"GDPR compliant":"Escludere da campagne automatiche" },
              { ico:"💡", txt:`Prossima azione AI: ${sel.consigliati[0]||"Nessuna azione urgente"}`, sub:"Raccomandazione sistema" },
            ].map((t,i)=>(
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-xl">{t.ico}</span>
                <div><p className="text-sm font-medium text-slate-700">{t.txt}</p><p className="text-xs text-slate-400">{t.sub}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div>
      <SectionHeader title="CRM Pazienti" sub="Gestisci e monitora tutti i pazienti dello studio" />
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Cerca paziente..." className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
        <select value={filter} onChange={e=>setFilter(e.target.value)} className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300">
          {["Tutti","In lista d'attesa","Igiene scaduta","Preventivo aperto","Paziente VIP","Inattivo","Alta probabilità risposta","Consenso attivo","Consenso mancante"].map(f=><option key={f}>{f}</option>)}
        </select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Paziente</th>
                <th className="text-left px-4 py-3">Ultimo app.</th>
                <th className="text-left px-4 py-3">Badge</th>
                <th className="text-left px-4 py-3">Prob. ritorno</th>
                <th className="text-left px-4 py-3">Valore</th>
                <th className="text-left px-4 py-3">Consenso</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p=>(
                <tr key={p.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={()=>setSel(p)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">{p.nome[0]}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{p.nome}</p>
                        <p className="text-xs text-slate-400">{p.tel}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.ultimoApp}</td>
                  <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{p.badge.slice(0,2).map(b=><Badge key={b} label={b}/>)}</div></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full"><div className="h-1.5 rounded-full bg-teal-500" style={{width:`${p.probRitorno}%`}}></div></div>
                      <span className="text-xs text-slate-500">{p.probRitorno}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-teal-600">{fmt(p.valoreStorico)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.consenso?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-600"}`}>{p.consenso?"✓ Attivo":"✗ No"}</span></td>
                  <td className="px-4 py-3 text-teal-500 text-sm">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── LISTA D'ATTESA ───────────────────────────────────────────────────────────
function ListaAttesa({ setSection }) {
  const [trattamento, setTrattamento] = useState("Tutti");
  const [fascia, setFascia] = useState("Tutte");
  const [probMin, setProbMin] = useState("0");
  const [soloConsenso, setSoloConsenso] = useState(true);
  const lista = [
    { nome:"Maria Rossi",    tratt:"Igiene dentale",  fasce:"Pomeriggio",   urgenza:"Alta",   lastMinute:true,  prob:92, canale:"WhatsApp", consenso:true,  valore:90 },
    { nome:"Luca Bianchi",   tratt:"Igiene dentale",  fasce:"Qualsiasi",    urgenza:"Media",  lastMinute:true,  prob:81, canale:"WhatsApp", consenso:true,  valore:90 },
    { nome:"Sara Colombo",   tratt:"Controllo",       fasce:"Mattina",      urgenza:"Bassa",  lastMinute:false, prob:65, canale:"WhatsApp", consenso:true,  valore:70 },
    { nome:"Antonio Greco",  tratt:"Controllo",       fasce:"Pomeriggio",   urgenza:"Media",  lastMinute:true,  prob:69, canale:"SMS",      consenso:true,  valore:70 },
    { nome:"Andrea Moretti", tratt:"Igiene bambini",  fasce:"Sabato matt.", urgenza:"Bassa",  lastMinute:false, prob:55, canale:"Email",    consenso:true,  valore:120 },
    { nome:"Marco Riva",     tratt:"Controllo",       fasce:"Sera",         urgenza:"Media",  lastMinute:true,  prob:42, canale:"Email",    consenso:false, valore:70 },
  ];
  const filtered = lista.filter(p=>
    (trattamento==="Tutti" || p.tratt===trattamento) &&
    (fascia==="Tutte" || p.fasce===fascia || p.fasce==="Qualsiasi") &&
    p.prob>=Number(probMin) &&
    (!soloConsenso || p.consenso)
  );

  return (
    <div>
      <SectionHeader title="Lista d'Attesa" sub="Pazienti pronti a occupare uno slot disponibile" />
      <Card className="p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <label className="text-xs text-slate-500 flex-1">Trattamento
            <select value={trattamento} onChange={e=>setTrattamento(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              {["Tutti","Igiene dentale","Controllo","Igiene bambini"].map(v=><option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-500 flex-1">Fascia oraria
            <select value={fascia} onChange={e=>setFascia(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              {["Tutte","Mattina","Pomeriggio","Sera","Sabato matt."].map(v=><option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-500 flex-1">Probabilità minima
            <select value={probMin} onChange={e=>setProbMin(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
              {["0","60","75","90"].map(v=><option key={v} value={v}>{v}%+</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
            <input type="checkbox" checked={soloConsenso} onChange={e=>setSoloConsenso(e.target.checked)} />
            Solo consenso attivo
          </label>
          <button onClick={()=>setSection("fillgap")} className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            Usa per Fill the Gap
          </button>
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Paziente</th>
                <th className="text-left px-4 py-3">Trattamento</th>
                <th className="text-left px-4 py-3">Fasce orarie</th>
                <th className="text-left px-4 py-3">Urgenza</th>
                <th className="text-left px-4 py-3">Last-minute</th>
                <th className="text-left px-4 py-3">Prob.</th>
                <th className="text-left px-4 py-3">Valore</th>
                <th className="text-left px-4 py-3">Consenso</th>
                <th className="text-left px-4 py-3">Canale</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p,i)=>(
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm font-semibold text-slate-700">{p.nome}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.tratt}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.fasce}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.urgenza==="Alta"?"bg-red-100 text-red-700":p.urgenza==="Media"?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-500"}`}>{p.urgenza}</span></td>
                  <td className="px-4 py-3 text-sm">{p.lastMinute?"✅ Sì":"—"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-teal-600">{p.prob}%</td>
                  <td className="px-4 py-3 text-sm font-semibold text-teal-600">{fmt(p.valore)}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.consenso?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-600"}`}>{p.consenso?"Attivo":"No"}</span></td>
                  <td className="px-4 py-3 text-sm">{canaleIcon[p.canale]} {p.canale}</td>
                  <td className="px-4 py-3"><button onClick={()=>setSection("fillgap")} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-3 py-1.5 rounded-lg">Seleziona</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── PREVENTIVI ───────────────────────────────────────────────────────────────
function Preventivi() {
  const [sel, setSel] = useState(null);
  const [filter, setFilter] = useState("Tutti");
  const [search, setSearch] = useState("");
  const totale = PREVENTIVI_BASE.reduce((s,p)=>s+p.valore,0);
  const filtered = PREVENTIVI_BASE.filter(p=>{
    const matchSearch = p.paziente.toLowerCase().includes(search.toLowerCase()) || p.trattamento.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter==="Tutti" || (filter==="Alta probabilità" && p.probChiusura>=65) || (filter==="Follow-up consigliato" && parseInt(p.inviato)>=7) || p.stato===filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <SectionHeader title="Preventivi" sub="Segui ogni preventivo fino alla chiusura — non perdere nemmeno un euro" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard icon="📋" label="Preventivi aperti" value={PREVENTIVI_BASE.length} color="text-slate-700" />
        <KpiCard icon="💰" label="Valore totale" value={fmt(totale)} color="text-teal-600" />
        <KpiCard icon="🎯" label="Alta probabilità" value={PREVENTIVI_BASE.filter(p=>p.probChiusura>=65).length} sub="≥65% prob." color="text-emerald-600" />
        <KpiCard icon="⚠️" label="Senza follow-up" value={PREVENTIVI_BASE.filter(p=>p.stato==="Aperto"&&parseInt(p.inviato)>7).length} sub="da oltre 7 giorni" color="text-red-500" />
      </div>

      <Card className="p-4 mb-5">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca paziente o trattamento..." className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-teal-300">
            {["Tutti","Aperto","Freddo","Alta probabilità","Follow-up consigliato"].map(f=><option key={f}>{f}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-400 mt-3">Sequenza automatica: giorno 3 messaggio gentile, giorno 7 reminder, giorno 14 proposta call, giorno 30 chiusura o ricontatto futuro.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(p=>(
          <Card key={p.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={()=>setSel(sel?.id===p.id?null:p)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-slate-800">{p.paziente}</p>
                <p className="text-sm text-slate-500">{p.trattamento}</p>
              </div>
              <p className="text-xl font-bold text-teal-600">{fmt(p.valore)}</p>
            </div>
            <div className="flex items-center gap-3 mb-3 text-xs text-slate-400">
              <span>📤 Inviato {p.inviato}</span>
              <span>·</span>
              <span>Ultimo contatto {p.ultimoContatto}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full"><div className="h-1.5 rounded-full bg-teal-500" style={{width:`${p.probChiusura}%`}}></div></div>
              <span className="text-xs font-semibold text-slate-500">{p.probChiusura}%</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.stato==="Aperto"?"bg-blue-100 text-blue-700":"bg-gray-100 text-gray-500"}`}>{p.stato}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">💡 {p.prossimaAzione}</span>
              <button className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 font-semibold px-3 py-1.5 rounded-lg transition-colors">Invia follow-up</button>
            </div>
            {sel?.id===p.id && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Timeline follow-up automatica</p>
                <div className="bg-slate-50 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-400 mb-1">Template messaggio</p>
                  <p className="text-sm text-slate-600 italic">"Ciao {p.paziente.split(" ")[0]}, volevamo sapere se hai avuto modo di valutare il preventivo per {p.trattamento.toLowerCase()}. Se vuoi, possiamo fissare una breve chiamata con lo studio per chiarire ogni dubbio."</p>
                </div>
                {[
                  {d:"Giorno 3",  txt:"Messaggio gentile di conferma",        done:true  },
                  {d:"Giorno 7",  txt:"Reminder con disponibilità per call",  done:parseInt(p.inviato)>=7 },
                  {d:"Giorno 14", txt:"Proposta chiamata con il dottore",      done:parseInt(p.inviato)>=14 },
                  {d:"Giorno 30", txt:"Chiusura o ricontatto futuro",          done:parseInt(p.inviato)>=30 },
                ].map((t,i)=>(
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${t.done?"bg-teal-500 text-white":"bg-slate-100 text-slate-400"}`}>{t.done?"✓":i+1}</span>
                    <span className="text-xs text-slate-400 w-16">{t.d}</span>
                    <span className="text-xs text-slate-600">{t.txt}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── AUTOMAZIONI ──────────────────────────────────────────────────────────────
function Automazioni({ automazioni, setAutomazioni }) {
  const toggle = id => setAutomazioni(a=>a.map(x=>x.id===id?{...x,attivo:!x.attivo}:x));
  return (
    <div>
      <SectionHeader title="Automazioni" sub="Tutte le automazioni attive del tuo studio" />
      <div className="space-y-3">
        {automazioni.map(a=>(
          <Card key={a.id} className="p-4">
            <div className="flex items-center gap-4">
              <button onClick={()=>toggle(a.id)} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${a.attivo?"bg-teal-500":"bg-slate-200"}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${a.attivo?"translate-x-6":"translate-x-1"}`}/>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm">{a.nome}</p>
                <p className="text-xs text-slate-400 truncate">{a.trigger} · {canaleIcon[a.canale]} {a.canale}</p>
              </div>
              <div className="hidden md:flex items-center gap-6 text-xs text-center">
                <div><p className="text-slate-400">Inviati</p><p className="font-bold text-slate-700">{a.inviati}</p></div>
                <div><p className="text-slate-400">Conversioni</p><p className="font-bold text-emerald-600">{a.conversioni}</p></div>
                <div><p className="text-slate-400">Recuperato</p><p className="font-bold text-teal-600">{a.fattRecuperato>0?fmt(a.fattRecuperato):"—"}</p></div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.attivo?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-400"}`}>{a.attivo?"Attiva":"Pausa"}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── MESSAGGI ─────────────────────────────────────────────────────────────────
function Messaggi() {
  const [messaggi, setMessaggi] = useState(MESSAGGI_BASE);
  const [selId, setSelId] = useState(MESSAGGI_BASE[0].id);
  const [draft, setDraft] = useState("Ciao Maria, si è appena liberato uno slot domani alle 16:00 per igiene dentale presso Studio Dentistico Aurora. Per riempire l'orario offriamo uno sconto del 20%. Vuoi confermare?");
  const sel = messaggi.find(m=>m.id===selId) || messaggi[0];
  const templates = [
    { label:"Fill the Gap", testo:"Ciao Maria, si è appena liberato uno slot domani alle 16:00 per igiene dentale presso Studio Dentistico Aurora. Per riempire l'orario offriamo uno sconto del 20%. Vuoi confermare?" },
    { label:"Richiamo igiene", testo:"Ciao Sara, sono passati circa 6 mesi dalla tua ultima igiene dentale. Vuoi che ti proponiamo qualche disponibilità?" },
    { label:"Preventivo", testo:"Ciao Elena, volevamo sapere se hai avuto modo di valutare il preventivo. Possiamo fissare una breve chiamata con il dottore per chiarire ogni dubbio." },
  ];
  const statoMsg = { inviato:"bg-slate-100 text-slate-500", consegnato:"bg-blue-100 text-blue-600", letto:"bg-indigo-100 text-indigo-600", risposto:"bg-emerald-100 text-emerald-600" };
  const inviaDemo = () => {
    if (!draft.trim()) return;
    const nuovo = { id:`demo-${Date.now()}`, paziente:sel?.paziente||"Maria Rossi", testo:draft.trim(), canale:"WhatsApp", stato:"inviato", risposta:"", ora:"Ora" };
    setMessaggi(m=>[nuovo,...m]);
    setSelId(nuovo.id);
    setDraft("");
  };
  const aggiornaSelezionato = patch => {
    setMessaggi(ms=>ms.map(m=>m.id===sel.id?{...m,...patch}:m));
  };
  return (
    <div>
      <SectionHeader title="Messaggi" sub="Conversazioni con i pazienti su tutti i canali" />
      <Card className="p-4 mb-5">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Template messaggi</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {templates.map(t=>(
            <button key={t.label} onClick={()=>setDraft(t.testo)} className="text-xs bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-600 font-semibold px-3 py-2 rounded-lg transition-colors">
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={2} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
          <button onClick={inviaDemo} className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            Simula invio
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">I template includono opt-out e vengono usati solo su pazienti con consenso comunicazioni attivo.</p>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-1 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {messaggi.map(m=>(
              <div key={m.id} onClick={()=>setSelId(m.id)} className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${sel?.id===m.id?"bg-teal-50 border-r-2 border-r-teal-500":""}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{m.paziente[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-sm font-semibold text-slate-700 truncate">{m.paziente}</p>
                    <span className="text-xs text-slate-400">{m.ora}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{m.risposta||m.testo}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statoMsg[m.stato]}`}>{m.stato}</span>
              </div>
            ))}
          </div>
        </Card>
        {sel && (
          <Card className="md:col-span-2 p-5">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold">{sel.paziente[0]}</div>
              <div>
                <p className="font-semibold text-slate-800">{sel.paziente}</p>
                <p className="text-xs text-slate-400">{canaleIcon[sel.canale]} {sel.canale} · {sel.ora}</p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              <div className="flex justify-end">
                <div className="bg-teal-500 text-white text-sm rounded-lg rounded-tr-sm px-4 py-3 max-w-xs">{sel.testo}</div>
              </div>
              {sel.risposta && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-700 text-sm rounded-lg rounded-tl-sm px-4 py-3 max-w-xs">{sel.risposta}</div>
                </div>
              )}
              {!sel.risposta && (
                <p className="text-center text-xs text-slate-400 italic">Nessuna risposta ancora · stato: {sel.stato}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>aggiornaSelezionato({stato:"risposto", risposta:"Appuntamento prenotato automaticamente in agenda."})} className="flex-1 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold py-2.5 rounded-lg transition-colors">📅 Prenota automaticamente</button>
              <button onClick={()=>aggiornaSelezionato({stato:"letto", risposta:"Segnata per richiamo manuale della segreteria."})} className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-semibold py-2.5 rounded-lg transition-colors">📌 Segna da richiamare</button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics() {
  const rows = [
    { label:"Slot riempiti con Fill the Gap", n:14, unit:"slot", price:90,   tot:1260  },
    { label:"Preventivi recuperati",           n:2,  unit:"prev",price:2400, tot:4800  },
    { label:"Pazienti riattivati",             n:18, unit:"paz.", price:90,   tot:1620  },
  ];
  const totale = rows.reduce((s,r)=>s+r.tot,0);
  const costo = 400;
  const roi = (totale/costo).toFixed(1);
  const annuale = totale * 12;

  return (
    <div>
      <SectionHeader title="Analytics & ROI" sub="Misura il ritorno economico del tuo sistema di automazione" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard icon="📈" label="Fatturato recuperato" value={fmt(totale)} sub="questo mese" color="text-teal-600" />
        <KpiCard icon="🏁" label="Potenziale annuale" value={fmt(annuale)} sub="proiezione a 12 mesi" color="text-emerald-600" />
        <KpiCard icon="💶" label="Costo servizio" value={fmt(costo)} sub="al mese" color="text-slate-600" />
        <KpiCard icon="🚀" label="ROI stimato" value={`${roi}x`} sub="ritorno sull'investimento" color="text-yellow-500" />
        <KpiCard icon="⏱️" label="Ore risparmiate" value="12h" sub="di lavoro manuale" color="text-blue-600" />
        <KpiCard icon="⚡" label="Slot riempiti" value="14" sub="cancellazioni recuperate" color="text-indigo-600" />
        <KpiCard icon="📋" label="Preventivi recuperati" value="2" sub="trattamenti chiusi" color="text-purple-600" />
        <KpiCard icon="👥" label="Pazienti riattivati" value="18" sub="dal database esistente" color="text-pink-600" />
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-semibold text-slate-700 mb-4">🧮 Breakdown fatturato recuperato</h3>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wide">
            <th className="text-left py-2">Fonte</th><th className="text-right py-2">N.</th><th className="text-right py-2">Val. medio</th><th className="text-right py-2">Totale</th>
          </tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className="border-b border-slate-50">
                <td className="py-3 text-slate-700">{r.label}</td>
                <td className="py-3 text-right text-slate-500">{r.n} {r.unit}</td>
                <td className="py-3 text-right text-slate-500">{fmt(r.price)}</td>
                <td className="py-3 text-right font-bold text-teal-600">{fmt(r.tot)}</td>
              </tr>
            ))}
            <tr className="bg-teal-50">
              <td className="py-3 font-bold text-slate-800 rounded-l-xl px-2" colSpan={3}>Totale recuperato</td>
              <td className="py-3 text-right font-bold text-teal-700 text-lg rounded-r-xl px-2">{fmt(totale)}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-teal-500 to-blue-600 text-white">
        <p className="text-lg font-bold mb-2">💡 La matematica è semplice</p>
        <p className="text-teal-100 text-sm leading-relaxed">Con un costo di <strong className="text-white">€400/mese</strong>, lo studio recupera in media <strong className="text-white">{fmt(totale)}/mese</strong> — un ROI di <strong className="text-white">{roi}x</strong>. Anche recuperando solo 2–3 slot e un preventivo al mese, il sistema può ripagarsi da solo con il primo appuntamento.</p>
        <div className="mt-4 flex gap-3 flex-wrap">
          <div className="bg-white/20 rounded-lg px-4 py-2 text-center"><p className="text-2xl font-bold">{roi}x</p><p className="text-xs text-teal-100">ROI</p></div>
          <div className="bg-white/20 rounded-lg px-4 py-2 text-center"><p className="text-2xl font-bold">{fmt(totale-costo)}</p><p className="text-xs text-teal-100">Profitto netto</p></div>
          <div className="bg-white/20 rounded-lg px-4 py-2 text-center"><p className="text-2xl font-bold">12h</p><p className="text-xs text-teal-100">Ore risparmiate</p></div>
        </div>
      </Card>
    </div>
  );
}

// ── APP ROOT ─────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",  label:"Dashboard",    icon:"🏠" },
  { id:"agenda",     label:"Agenda",       icon:"📅" },
  { id:"fillgap",    label:"Fill the Gap", icon:"⚡" },
  { id:"followup",   label:"Follow-up",    icon:"🔔" },
  { id:"pazienti",   label:"Pazienti",     icon:"👥" },
  { id:"listattesa", label:"Lista d'attesa",icon:"⏳" },
  { id:"preventivi", label:"Preventivi",   icon:"💰" },
  { id:"automazioni",label:"Automazioni",  icon:"🤖" },
  { id:"messaggi",   label:"Messaggi",     icon:"💬" },
  { id:"analytics",  label:"Analytics / ROI",icon:"📊" },
];

export default function DentFlowAI() {
  const [section, setSection] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [agenda, setAgenda] = useState(AGENDA_BASE);
  const [automazioni, setAutomazioni] = useState(AUTOMAZIONI_BASE);
  const [fillGapAlert, setFillGapAlert] = useState(false);
  const [kpi, setKpi] = useState({
    fattRecuperato: 3240,
    oreBuche: 14,
    appRecuperati: 23,
    pazientiContattati: 87,
    preventiviSeguiti: 12,
    tassoRisposta: 42,
    automazioniAttive: AUTOMAZIONI_BASE.filter(a=>a.attivo).length,
    roi: 19.2,
  });

  useEffect(()=>{
    setKpi(k=>({...k, automazioniAttive:automazioni.filter(a=>a.attivo).length}));
  },[automazioni]);

  const simulaCanc = () => {
    setAgenda(ag=>ag.map(s=>s.id==="a7"?{...s,stato:"da riempire",paziente:"—",trattamento:"Igiene dentale — paziente ha cancellato"}:s));
    setFillGapAlert(true);
    setTimeout(()=>setFillGapAlert(false),8000);
  };

  const renderSection = () => {
    switch(section) {
      case "dashboard":   return <Dashboard kpi={kpi} setSection={setSection}/>;
      case "agenda":      return <Agenda agenda={agenda} onSimulaCanc={simulaCanc} fillGapAlert={fillGapAlert} setSection={setSection}/>;
      case "fillgap":     return <FillTheGap agenda={agenda} kpi={kpi} setKpi={setKpi} setAgenda={setAgenda}/>;
      case "followup":    return <FollowUp/>;
      case "pazienti":    return <Pazienti/>;
      case "listattesa":  return <ListaAttesa setSection={setSection}/>;
      case "preventivi":  return <Preventivi/>;
      case "automazioni": return <Automazioni automazioni={automazioni} setAutomazioni={setAutomazioni}/>;
      case "messaggi":    return <Messaggi/>;
      case "analytics":   return <Analytics/>;
      default:            return <Dashboard kpi={kpi} setSection={setSection}/>;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans overflow-hidden" style={{fontFamily:"'DM Sans', system-ui, sans-serif"}}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-100 flex flex-col transform transition-transform md:relative md:translate-x-0 ${menuOpen?"translate-x-0":"-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">D</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-none">DentFlow AI</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Studio Aurora · Milano</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>{setSection(n.id);setMenuOpen(false);}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${section===n.id?"bg-teal-50 text-teal-700":"text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
              <span className="text-base">{n.icon}</span>
              {n.label}
              {n.id==="fillgap" && fillGapAlert && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="bg-teal-50 rounded-lg p-3 text-center">
            <p className="text-xs text-teal-700 font-semibold">ROI questo mese</p>
            <p className="text-2xl font-bold text-teal-600">{kpi.roi}x</p>
            <p className="text-[10px] text-teal-500">su costo €400/mese</p>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={()=>setMenuOpen(false)}/>}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center gap-4 flex-shrink-0">
          <button className="md:hidden text-slate-500 text-xl" onClick={()=>setMenuOpen(o=>!o)}>☰</button>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">{NAV.find(n=>n.id===section)?.label}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {kpi.automazioniAttive} automazioni attive
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">A</div>
          </div>
        </header>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7">
          <div className="w-full min-h-[980px] lg:min-h-[1180px]">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
}


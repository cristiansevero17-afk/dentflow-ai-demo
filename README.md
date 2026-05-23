# Demo Studio Dentistico

Demo front-end operativa per uno studio dentistico, focalizzata su simulazione agenda, Fill the Gap, follow-up pazienti, preventivi e messaggi.

## Avvio locale

Questa cartella non richiede installazione npm. Avvia un server statico dalla cartella del progetto:

```powershell
python -m http.server 5173
```

Poi apri:

```text
http://localhost:5173
```

La demo usa dati mock e simula tutte le automazioni lato front-end.

## WhatsApp reale per colloquio

Per mostrare una rinuncia ricevuta davvero da WhatsApp, usa il server locale:

```powershell
npm.cmd install
npm.cmd run whatsapp-demo
```

Poi apri:

```text
http://localhost:8787
```

Nella sezione WhatsApp Web clicca `Collega WhatsApp reale`, scansiona il QR dal telefono e fai arrivare un messaggio simile a:

```text
Buongiorno, devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00. Mi dispiace.
```

La webapp riconosce la rinuncia, aggiorna lo slot dell'agenda e apre il flusso Fill the Gap. Questa modalita e pensata solo per demo locale; per produzione va usato un canale WhatsApp Business autorizzato.

## Deploy

Il progetto è pronto per hosting statico.

### Vercel

- Framework Preset: Other
- Build Command: vuoto
- Output Directory: `.`

### Render

- New > Static Site
- Build Command: vuoto
- Publish Directory: `.`

Il file `render.yaml` consente anche il deploy tramite Blueprint collegando il repository GitHub.

## Deploy automatico da terminale

Usa deploy hook URL, non password account.

### Render

Render Dashboard > servizio `demo-studio-dentistico` > Settings > Deploy Hook.

### Vercel

Vercel Project > Settings > Git > Deploy Hooks.

Salva gli hook nelle variabili utente di Windows:

```powershell
.\scripts\set-deploy-secrets.ps1
```

Apri un nuovo terminale e lancia:

```powershell
.\scripts\deploy.ps1 -Message "Update demo"
```

Per triggerare solo gli hook senza commit/push:

```powershell
.\scripts\deploy.ps1 -HooksOnly
```

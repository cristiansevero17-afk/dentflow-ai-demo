# DentFlow AI demo

Demo front-end per Studio Dentistico Aurora, focalizzata su recupero slot vuoti, follow-up pazienti, preventivi e ROI.

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

Render Dashboard > servizio `dentflow-ai-demo` > Settings > Deploy Hook.

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

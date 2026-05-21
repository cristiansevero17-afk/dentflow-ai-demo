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

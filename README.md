# Studio Dentistico

Demo front-end operativa per uno studio dentistico, focalizzata su simulazione agenda, Fill the Gap, follow-up pazienti, preventivi e messaggi.

Include anche una seconda webapp separata pensata come base prodotto:

```text
/prodotto.html
```

Su Vercel con clean URL e' raggiungibile anche da:

```text
/prodotto
```

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

Per aprire la versione prodotto:

```text
http://localhost:5173/prodotto.html
```

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

La navigazione principale della demo resta focalizzata su agenda, Fill the Gap e follow-up. Il bridge WhatsApp locale e disponibile solo come supporto tecnico per test controllati: collega un account studio separato e fai arrivare un messaggio simile a:

```text
Buongiorno, devo rinunciare all'appuntamento di lunedi 25 maggio alle 16:00. Mi dispiace.
```

La webapp riconosce la rinuncia, aggiorna lo slot dell'agenda e apre il flusso Fill the Gap. Questa modalita e pensata solo per demo locale; per produzione va usato un canale WhatsApp Business autorizzato.

Se prepari un QR paziente esterno alla UI, usa il numero WhatsApp dello studio con prefisso internazionale, ad esempio `393331234567`: il QR deve aprire una chat WhatsApp verso quello studio con il messaggio di rinuncia gia compilato. Il paziente dovra solo premere invio.

Per evitare la chat con se stessi, usa due account WhatsApp distinti: uno collegato come studio nella demo e uno usato come paziente per scansionare il QR. Se scansioni il QR paziente con lo stesso numero indicato come studio, WhatsApp aprira una chat con te stesso.

Quando il messaggio di rinuncia arriva al WhatsApp collegato come studio, la demo rileva automaticamente la rinuncia, aggiorna lo slot del 25 maggio alle 16:00 e avvia il flusso Fill the Gap.

## Deploy

Il progetto è pronto per hosting statico.

## Variabili ambiente produzione

Per la lettura AI dei messaggi puoi riutilizzare la stessa chiave Gemini usata nella demo. Per produzione e' meglio creare una chiave dedicata al prodotto, con restrizioni e rotazione.

```text
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_AUTOREPLY=true
```

Webhook WhatsApp Business:

```text
https://tuo-dominio/api/whatsapp-webhook
```

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

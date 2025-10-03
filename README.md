# Sito Richiesta Unban per Server Discord Hashira

Questo è un sito web per gestire le richieste di unban dal server Discord Hashira.

## Architettura del Sistema

Il sistema è composto da due parti principali:
- **Frontend**: Le pagine HTML/CSS/JS che compongono l'interfaccia utente
- **Backend** (opzionale per lo sviluppo, richiesto in produzione): Il server che gestisce l'autenticazione e i dati

## Installazione per Sviluppo Locale

1. Assicurati di avere Node.js installato
2. Scarica tutti i file del progetto
3. Installa le dipendenze con:
   ```bash
   npm install
   ```
4. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Sicurezza e Distribuzione in Produzione

### Sistema di Autenticazione Amministratore

**IMPORTANTE**: Questo progetto include un sistema di autenticazione amministratore. Per motivi di sicurezza:

1. **La versione pubblica su GitHub non contiene credenziali reali**
2. **In produzione, è richiesto un backend server per autenticazione sicura**
3. **Le credenziali devono essere gestite come variabili d'ambiente**

### Implementazione Sicura in Produzione

Per implementare correttamente la sicurezza quando distribuisci in produzione:

1. **Configura il backend**:
   - Usa il file `server.js` fornito come base
   - Imposta una chiave JWT sicura come variabile d'ambiente
   - Configura un database per memorizzare le richieste e le credenziali

2. **Gestisci le credenziali**:
   - Crea un utente amministratore con password sicura
   - Usa bcrypt per criptare le password
   - Non salvare mai credenziali nel codice sorgente

3. **Abilita HTTPS**:
   - Usa un certificato SSL valido
   - Reindirizza tutto il traffico HTTP a HTTPS

4. **Implementa controlli anti-spam**:
   - Usa rate limiting per limitare le richieste
   - Implementa sistemi di verifica aggiuntivi

### File Sensibili

In locale, i dati delle richieste sono memorizzati in localStorage del browser. In produzione, questi devono essere:
- Memorizzati in un database sicuro (es: MongoDB, PostgreSQL)
- Criptati
- Accessibili solo tramite autenticazione server-side

## File Inclusi

- `server.js`: Codice backend per autenticazione sicura e gestione webhook
- `package.json`: Dipendenze del progetto
- `admin.html`: Pagina admin (funzionante solo con backend)
- Tutti gli altri file: Frontend del sito

## Sicurezza Webhook Discord

**IMPORTANTE**: Per motivi di sicurezza, il link del webhook Discord:
- Non è visibile nel codice frontend pubblico
- Deve essere configurato come variabile d'ambiente nel backend
- In produzione, gestisci il webhook solo attraverso il tuo server

Nel file `server.js`, troverai:
```javascript
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
```

Quando distribuisci in produzione:
1. Imposta la variabile d'ambiente `DISCORD_WEBHOOK_URL` con il tuo vero webhook
2. Non salvare il webhook nel codice sorgente
3. Il frontend invia i dati al tuo backend, che poi li inoltra al webhook Discord

## Funzionalità

- Richiesta unban tramite modulo
- Sistema anti-bot con CAPTCHA
- Verifica richieste tramite ID Discord
- Pannello amministratore (richiede sistema backend in produzione)
- Sistema di stato richieste
- Salvataggio temporaneo modulo
- Animazioni e design responsive

## Come Implementare la Versione Amministratore Sicura

Quando distribuisci in produzione:

1. **Configura il backend**:
   - Imposta una variabile d'ambiente `JWT_SECRET` con una chiave sicura
   - Crea un utente amministratore nel database
   - Imposta le credenziali in modo sicuro

2. **Aggiorna i percorsi API**:
   - Nel frontend, aggiorna gli endpoint API per puntare al tuo backend
   - Implementa le chiamate API sicure per le funzionalità admin

3. **Proteggi le risorse**:
   - Usa middleware di autenticazione per proteggere le route sensibili
   - Implementa logica di autorizzazione appropriata

## Note di Sicurezza Importanti

Questo codice è progettato per essere sia una demo che un punto di partenza per un sistema sicuro:

1. Il frontend fornito è sicuro per l'uso pubblico
2. In produzione, implementa SEMPRE un backend per autenticazione
3. Non memorizzare dati sensibili in localStorage in produzione
4. Usa sempre HTTPS
5. Implementa sistemi di rate limiting e protezione da attacchi

## Licenza

Questo progetto è fornito "così com'è" per scopi dimostrativi e di apprendimento.
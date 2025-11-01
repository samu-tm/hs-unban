# Guida alla Distribuzione in Produzione

Questa guida spiega come distribuire il sito in modo sicuro con autenticazione amministratore.

## Prerequisiti

- Node.js installato
- Un servizio di hosting che supporti applicazioni Node.js (es. Heroku, Vercel, DigitalOcean, ecc.)
- Un database per memorizzare le richieste (MongoDB, PostgreSQL, ecc.)

## Passaggi per la Distribuzione Sicura

### 1. Preparare il Backend

1.1. Installare le dipendenze:
```bash
npm install
```

1.2. Creare un file `.env` con le variabili di ambiente sicure:
```env
JWT_SECRET=chiavesegretasufficientementelungaecompleta
DB_CONNECTION=tuostringadiconnessionealdb
ADMIN_USERNAME=tuonomeutenteadmin
ADMIN_PASSWORD_HASH=hashbcryptdellapassword
NODE_ENV=production
PORT=3000
```

**NOTA**: Non salvare il file `.env` nel repository pubblico! Aggiungi `.env` al file `.gitignore`.

### 2. Configurare l'Autenticazione

2.1. Creare un utente amministratore con password sicura:
```javascript
// Usa bcrypt per creare un hash della password
const bcrypt = require('bcrypt');
const saltRounds = 10;
const password = 'tuapasswordamministratore';
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

2.2. Memorizzare il hash della password nel database, mai la password in chiaro

### 3. Aggiornare le Chiamate API nel Frontend

Aggiornare tutti i percorsi API nei file frontend per puntare al backend sicuro:

```javascript
// Esempio: login
const response = await fetch('https://tuodominio.com/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
});

// Esempio: caricare richieste
const response = await fetch('https://tuodominio.com/api/unban-requests', {
    headers: {'Authorization': 'Bearer ' + token}
});
```

### 4. Sicurezza HTTPS

- Configurare un certificato SSL valido
- Reindirizzare tutto il traffico HTTP a HTTPS
- Assicurarsi che tutte le comunicazioni API utilizzino HTTPS

### 5. Ulteriori Misure di Sicurezza

- Implementare rate limiting per prevenire attacchi
- Aggiungere log attività per monitorare accessi
- Implementare controlli di autorizzazione appropriati
- Effettuare regolari backup dei dati

### 6. File da Ignorare in Git

Assicurati che il tuo file `.gitignore` contenga:
```
node_modules/
.env
.env.local
.env.production
*.env
.env*
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

## File Sicuri per Pubblicazione

I seguenti file sono sicuri da pubblicare su GitHub:
- `index.html`, `home.html`, `unban-form.html`, `confirmation.html`, `status.html`
- `styles.css`, `script.js`, `unban-script.js`
- `server.js` (senza credenziali)
- `package.json`, `package-lock.json`
- `README.md`, `.gitignore`

## File da Non Pubblicare Mai

Non pubblicare mai su GitHub:
- File `.env` contenenti credenziali
- File con password in chiaro
- File di configurazione con dati sensibili

## Verifica della Sicurezza

Dopo la distribuzione, verificare:
- Nessuna credenziale visibile nel codice frontend
- Le API richiedono autenticazione
- Nessun accesso diretto ai dati sensibili senza autorizzazione
- Funzionamento corretto del sistema di autenticazione

## Risorse di Sicurezza

Per ulteriore sicurezza, considerare:
- Implementare l'autenticazione a due fattori (2FA)
- Usare Content Security Policy (CSP)
- Implementare sistemi di registrazione attività (logging)
- Effettuare test di penetrazione regolari
- Aggiornare regolarmente le dipendenze

Ricorda: la sicurezza è un processo continuo, non una destinazione finale.
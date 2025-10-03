const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Rate limiting per la protezione da attacchi
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // limita ogni IP a 5 tentativi di login
  message: 'Troppi tentativi di login, riprova più tardi'
});

// Configurazione JWT
const JWT_SECRET = process.env.JWT_SECRET || 'inserisci_chiave_segreta_casuale_qui';

// Dati amministratore (in produzione, questi dovrebbero essere in un database)
const ADMIN_USER = {
  username: 'admin',
  passwordHash: '$2b$10$...' // hash della password usando bcrypt
};

// Endpoint per il login
app.post('/api/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  // Verifica credenziali
  if (username === 'admin' && await bcrypt.compare(password, ADMIN_USER.passwordHash)) {
    // Genera token JWT
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Credenziali non valide' });
  }
});

// Middleware per verificare il token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

// Endpoint per ottenere le richieste unban (solo per admin autenticati)
app.get('/api/unban-requests', authenticateToken, (req, res) => {
  // Leggi le richieste da un database o file sicuro
  // In produzione, non usare localStorage ma un database reale
  res.json({ /* dati richieste */ });
});

// Endpoint per inviare richiesta unban al webhook Discord
app.post('/api/send-unban-request', (req, res) => {
  // In produzione, aggiungi qui il tuo webhook Discord reale
  // Usa una variabile d'ambiente per proteggere il webhook
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return res.status(500).json({ error: 'Webhook non configurato' });
  }
  
  // Invia la richiesta al webhook Discord
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req.body)
  })
  .then(response => {
    if (response.ok) {
      res.json({ success: true });
    } else {
      throw new Error('Errore nell\'invio al webhook');
    }
  })
  .catch(error => {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore nell\'invio della richiesta' });
  });
});

// Endpoint per gestire le richieste (approva/rifiuta)
app.post('/api/update-request/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Logica per aggiornare lo stato della richiesta
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
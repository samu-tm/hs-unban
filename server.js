const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config(); // Carica le variabili d'ambiente dal file .env
const { 
  addRequest, 
  getAllRequests, 
  getRequestById, 
  updateRequestStatus, 
  deleteRequest 
} = require('./fileStorage');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve i file statici dalla cartella corrente

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
  passwordHash: '$2b$10$hz5x.QaxcBlSiI/4CV7AduR8Ges35flKwPYO96bGxupR5EqQjx0ZW' // hash della password usando bcrypt
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
  try {
    const { search, status } = req.query;
    const requests = getAllRequests(search || null, status || null);
    res.json(requests);
  } catch (error) {
    console.error('Errore nel recupero delle richieste:', error);
    res.status(500).json({ error: 'Errore nel recupero delle richieste' });
  }
});

// Endpoint per ottenere una richiesta specifica per ID
app.get('/api/unban-requests/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const request = getRequestById(id);
    
    if (!request) {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Errore nel recupero della richiesta:', error);
    res.status(500).json({ error: 'Errore nel recupero della richiesta' });
  }
});

// Endpoint per creare una nuova richiesta di unban
app.post('/api/unban-requests', (req, res) => {
  const { discordName, discordUsername, discordId, banReason, unbanReason } = req.body;
  
  // Validazione dei dati
  if (!discordName || !discordUsername || !discordId || !banReason || !unbanReason) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
  }
  
  // Controllo che l'ID Discord contenga tra 17 e 20 cifre numeriche
  if (!/^\d{17,20}$/.test(discordId)) {
    return res.status(400).json({ error: 'ID Discord non valido' });
  }
  
  try {
    const newRequest = addRequest({
      discordName,
      discordUsername,
      discordId,
      banReason,
      unbanReason
    });
    
    res.json({ 
      success: true, 
      id: newRequest.id,
      message: 'Richiesta di unban inviata con successo' 
    });
  } catch (error) {
    if (error.message === 'Una richiesta con questo ID Discord esiste già') {
      return res.status(409).json({ error: 'Una richiesta con questo ID Discord esiste già' });
    }
    
    console.error('Errore nell\'inserimento della richiesta:', error);
    res.status(500).json({ error: 'Errore nell\'inserimento della richiesta' });
  }
});

// Endpoint per inviare richiesta unban al webhook Discord e salvarla nel file
app.post('/api/unban-requests-webhook', (req, res) => {
  const { discordName, discordUsername, discordId, banReason, unbanReason } = req.body;
  
  // Validazione dei dati
  if (!discordName || !discordUsername || !discordId || !banReason || !unbanReason) {
    return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
  }
  
  // Controllo che l'ID Discord contenga tra 17 e 20 cifre numeriche
  if (!/^\d{17,20}$/.test(discordId)) {
    return res.status(400).json({ error: 'ID Discord non valido' });
  }
  
  try {
    // Prima salva la richiesta nel file
    const newRequest = addRequest({
      discordName,
      discordUsername,
      discordId,
      banReason,
      unbanReason
    });
    
    // Ora invia la richiesta al webhook Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return res.json({ 
        success: true, 
        id: newRequest.id,
        message: 'Richiesta salvata con successo, ma webhook non configurato' 
      });
    }
    
    // Crea il payload per il webhook Discord
    const webhookData = {
      embeds: [{
        title: 'Nuova Richiesta Unban',
        fields: [
          { name: 'Nome Discord', value: discordName, inline: true },
          { name: 'Username Discord', value: discordUsername, inline: true },
          { name: 'ID Discord', value: discordId, inline: true },
          { name: 'Perché sei stato bannato', value: banReason },
          { name: 'Perché vuoi essere unbannato', value: unbanReason }
        ],
        footer: { text: `ID Utente: ${discordId}` },
        timestamp: new Date().toISOString(),
        color: 0x00ff00
      }]
    };
    
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookData)
    })
    .then(webhookResponse => {
      if (webhookResponse.ok) {
        res.json({ 
          success: true, 
          id: newRequest.id,
          message: 'Richiesta inviata al webhook e salvata con successo' 
        });
      } else {
        console.error('Errore nell\'invio al webhook Discord');
        // Anche se il webhook fallisce, la richiesta è comunque salvata
        res.json({ 
          success: true, 
          id: newRequest.id,
          message: 'Richiesta salvata ma errore nell\'invio al webhook' 
        });
      }
    })
    .catch(webhookError => {
      console.error('Errore nel collegamento con il webhook Discord:', webhookError);
      // Anche se il webhook fallisce, la richiesta è comunque salvata
      res.json({ 
        success: true, 
        id: newRequest.id,
        message: 'Richiesta salvata ma errore nell\'invio al webhook' 
      });
    });
  } catch (error) {
    if (error.message === 'Una richiesta con questo ID Discord esiste già') {
      return res.status(409).json({ error: 'Una richiesta con questo ID Discord esiste già' });
    }
    
    console.error('Errore nel salvataggio della richiesta:', error);
    res.status(500).json({ error: 'Errore nel salvataggio della richiesta' });
  }
});

// Endpoint per aggiornare lo stato di una richiesta di unban
app.post('/api/unban-requests/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  
  // Validazione dello stato
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Stato non valido' });
  }
  
  try {
    const updatedRequest = updateRequestStatus(id, status, adminNote || '');
    res.json({ success: true, message: 'Richiesta aggiornata con successo', request: updatedRequest });
  } catch (error) {
    if (error.message === 'Richiesta non trovata') {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    } else if (error.message === 'Stato non valido') {
      return res.status(400).json({ error: 'Stato non valido' });
    }
    
    console.error('Errore nell\'aggiornamento della richiesta:', error);
    res.status(500).json({ error: 'Errore nell\'aggiornamento della richiesta' });
  }
});

// Endpoint per eliminare una richiesta di unban
app.delete('/api/unban-requests/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    deleteRequest(id);
    res.json({ success: true, message: 'Richiesta eliminata con successo' });
  } catch (error) {
    if (error.message === 'Richiesta non trovata') {
      return res.status(404).json({ error: 'Richiesta non trovata' });
    }
    
    console.error('Errore nell\'eliminazione della richiesta:', error);
    res.status(500).json({ error: 'Errore nell\'eliminazione della richiesta' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
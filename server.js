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
  deleteRequest,
  addVisitorIp
} = require('./fileStorage');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve i file statici dalla cartella corrente

// Middleware per registrare gli IP dei visitatori
app.use((req, res, next) => {
    // Ottiene l'IP del client considerando eventuali proxy
    const ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.headers['x-client-ip'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '::ffff:127.0.0.1';
    
    // Estrae l'IP reale se è una stringa con più indirizzi
    const realIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
    
    // Ottiene l'User-Agent
    const userAgent = req.headers['user-agent'];
    
    // Aggiunge l'IP e le informazioni del visitatore
    addVisitorIp(realIp, new Date().toISOString(), userAgent);
    
    next();
});

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

// Endpoint per la verifica anti-bot
app.post('/api/verify-human', (req, res) => {
  const { 
    userAgent, 
    language, 
    platform, 
    cookieEnabled, 
    onLine, 
    screenResolution, 
    timezone, 
    hasJS, 
    plugins, 
    webdriver, 
    automation, 
    documentHidden, 
    documentVisibility, 
    inIframe, 
    windowDimensions,
    loadingTime
  } = req.body;

  // Calcola un punteggio di sospettosità (più alto = più sospetto)
  let suspiciousScore = 0;
  let reasons = [];

  // Verifica se è in un iframe
  if (inIframe) {
    suspiciousScore += 20;
    reasons.push("accesso in iframe");
  }

  // Verifica webdriver (indicazione di automazione)
  if (webdriver === true) {
    suspiciousScore += 30;
    reasons.push("rilevato webdriver");
  }

  // Verifica plugin automation
  if (automation) {
    suspiciousScore += 25;
    reasons.push("rilevata estensione chrome automation");
  }

  // Verifica dimensioni finestra insolite
  if (windowDimensions.width < 400 || windowDimensions.height < 300) {
    suspiciousScore += 15;
    reasons.push("dimensioni finestra insolite");
  }

  // Verifica tempo di caricamento molto rapido (indicativo di automazione)
  if (loadingTime < 100) {
    suspiciousScore += 20;
    reasons.push("caricamento pagina troppo rapido");
  }

  // Verifica se document è hidden all'inizio (indicazione di testa)
  if (documentHidden === true) {
    suspiciousScore += 15;
    reasons.push("pagina caricata in background");
  }

  // Verifica user agent sospetti
  const suspiciousUserAgents = [
    'bot', 'crawl', 'slurp', 'spider', 'facebook', 'twitter', 'linkedin',
    'pinterest', 'whatsapp', 'telegram', 'discordbot', 'google', 'bing',
    'baidu', 'yahoo', 'duckduckbot', 'yandex', 'barkrowler', 'mj12bot',
    'ahrefsbot', 'seznambot', 'exabot', 'gigabot', 'netcraft', 'siteexplorer',
    'phantomjs', 'headless', 'selenium', 'webdriver', 'puppeteer', 'playwright'
  ];

  if (userAgent && suspiciousUserAgents.some(susp => userAgent.toLowerCase().includes(susp))) {
    suspiciousScore += 30;
    reasons.push("user agent sospetto");
  }

  // Verifica se JavaScript è disabilitato (impossibile con questo sistema, ma per completezza)
  if (!hasJS) {
    suspiciousScore += 50;
    reasons.push("javascript disabilitato");
  }

  // Verifica risoluzione schermo insolita
  const commonResolutions = [
    '1920x1080', '1366x768', '1536x864', '1440x900', '1280x720',
    '360x640', '414x896', '375x667', '414x736', '375x812'
  ];
  
  if (!commonResolutions.includes(screenResolution)) {
    // Non aggiungiamo un punteggio elevato per questo, molti utenti hanno risoluzioni diverse
    suspiciousScore += 5;
  }

  // Se il punteggio supera una certa soglia, considera come sospetto
  const isAllowed = suspiciousScore < 50;
  
  // Aggiorna il punteggio sospettosità per l'IP
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.headers['x-client-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
             '::ffff:127.0.0.1';
  
  const realIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim();
  addVisitorIp(realIp, new Date().toISOString(), userAgent, suspiciousScore);

  res.json({ 
    allowed: isAllowed, 
    suspiciousScore,
    reasons: reasons,
    message: isAllowed ? 'Verifica superata. Benvenuto!' : 'Verifica fallita.',
    redirect: isAllowed ? '/home.html' : null
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
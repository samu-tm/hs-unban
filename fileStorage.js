const fs = require('fs');
const path = require('path');

// Percorsi dei file per salvare le richieste e gli IP
const filePath = path.join(__dirname, 'data', 'unban_requests.json');
const ipFilePath = path.join(__dirname, 'data', 'visitor_ips.json');

// Crea la cartella data se non esiste
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Funzione per leggere le richieste dal file
function readRequests() {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    return [];
}

// Funzione per scrivere le richieste nel file
function writeRequests(requests) {
    fs.writeFileSync(filePath, JSON.stringify(requests, null, 2));
}

// Funzione per aggiungere una nuova richiesta
function addRequest(request) {
    const requests = readRequests();
    
    // Controlla se esiste già una richiesta con lo stesso ID Discord
    const existingRequest = requests.find(r => r.discord_id === request.discordId);
    if (existingRequest) {
        throw new Error('Una richiesta con questo ID Discord esiste già');
    }
    
    // Crea un nuovo oggetto richiesta
    const newRequest = {
        id: Date.now(), // ID univoco basato sul timestamp
        discord_name: request.discordName,
        discord_username: request.discordUsername,
        discord_id: request.discordId,
        ban_reason: request.banReason,
        unban_reason: request.unbanReason,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        admin_note: ''
    };
    
    requests.push(newRequest);
    writeRequests(requests);
    return newRequest;
}

// Funzione per ottenere tutte le richieste
function getAllRequests(searchTerm = null, statusFilter = null) {
    let requests = readRequests();
    
    // Applica i filtri se specificati
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        requests = requests.filter(request => 
            request.discord_name.toLowerCase().includes(term) ||
            request.discord_username.toLowerCase().includes(term) ||
            request.discord_id.includes(term)
        );
    }
    
    if (statusFilter) {
        requests = requests.filter(request => request.status === statusFilter);
    }
    
    // Ordina per data di creazione (più recenti prima)
    requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return requests;
}

// Funzione per ottenere una richiesta specifica per ID
function getRequestById(discordId) {
    const requests = readRequests();
    return requests.find(r => r.discord_id === discordId);
}

// Funzione per aggiornare lo stato di una richiesta
function updateRequestStatus(discordId, status, adminNote = '') {
    const requests = readRequests();
    const requestIndex = requests.findIndex(r => r.discord_id === discordId);
    
    if (requestIndex === -1) {
        throw new Error('Richiesta non trovata');
    }
    
    // Validazione dello stato
    if (!['pending', 'approved', 'rejected'].includes(status)) {
        throw new Error('Stato non valido');
    }
    
    requests[requestIndex].status = status;
    requests[requestIndex].admin_note = adminNote;
    requests[requestIndex].updated_at = new Date().toISOString();
    
    writeRequests(requests);
    return requests[requestIndex];
}

// Funzione per eliminare una richiesta
function deleteRequest(discordId) {
    let requests = readRequests();
    const initialLength = requests.length;
    
    requests = requests.filter(r => r.discord_id !== discordId);
    
    if (requests.length === initialLength) {
        throw new Error('Richiesta non trovata');
    }
    
    writeRequests(requests);
    return true;
}

// Funzione per leggere gli IP dei visitatori dal file
function readVisitorIps() {
    if (fs.existsSync(ipFilePath)) {
        const data = fs.readFileSync(ipFilePath, 'utf8');
        return JSON.parse(data);
    }
    return [];
}

// Funzione per scrivere gli IP dei visitatori nel file
function writeVisitorIps(ips) {
    fs.writeFileSync(ipFilePath, JSON.stringify(ips, null, 2));
}

// Funzione per aggiungere un nuovo IP di visitatore
function addVisitorIp(ip, timestamp = new Date().toISOString(), userAgent = null, suspiciousScore = 0) {
    const ips = readVisitorIps();
    
    // Controlla se esiste già un record per questo IP
    const existingIp = ips.find(r => r.ip === ip);
    if (existingIp) {
        // Aggiorna il timestamp dell'ultimo accesso
        existingIp.lastVisit = timestamp;
        existingIp.visitCount = (existingIp.visitCount || 1) + 1;
        if (userAgent && !existingIp.userAgents?.includes(userAgent)) {
            existingIp.userAgents = existingIp.userAgents || [];
            existingIp.userAgents.push(userAgent);
        }
        if (suspiciousScore > existingIp.suspiciousScore) {
            existingIp.suspiciousScore = suspiciousScore;
        }
    } else {
        // Crea un nuovo record per l'IP
        const newIpRecord = {
            ip: ip,
            firstVisit: timestamp,
            lastVisit: timestamp,
            visitCount: 1,
            userAgents: userAgent ? [userAgent] : [],
            suspiciousScore: suspiciousScore
        };
        ips.push(newIpRecord);
    }
    
    writeVisitorIps(ips);
    return ips;
}

module.exports = {
    addRequest,
    getAllRequests,
    getRequestById,
    updateRequestStatus,
    deleteRequest,
    addVisitorIp,
    readVisitorIps
};
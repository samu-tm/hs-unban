document.addEventListener('DOMContentLoaded', function() {
    // Controlla il rate limiting (1 richiesta ogni 24 ore)
    function checkRateLimit() {
        const lastSubmission = localStorage.getItem('lastUnbanSubmission');
        const now = new Date().getTime();
        
        // Limite di 1 richiesta ogni 24 ore (86400000 ms)
        if (lastSubmission && (now - parseInt(lastSubmission)) < 86400000) {
            const remainingTimeMs = 86400000 - (now - parseInt(lastSubmission));
            const remainingHours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
            const remainingMinutes = Math.ceil((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (remainingHours > 0) {
                alert(`Puoi inviare una nuova richiesta tra ${remainingHours} ore e ${remainingMinutes} minuti. Devi attendere 24 ore tra una richiesta e l'altra.`);
            } else {
                alert(`Puoi inviare una nuova richiesta tra ${remainingMinutes} minuti. Devi attendere 24 ore tra una richiesta e l'altra.`);
            }
            return false;
        }
        return true;
    }
    
    // Genera testo casuale per la verifica visiva
    function generateTextCaptcha() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let captcha = '';
        
        // Genera una stringa casuale di 5-6 caratteri
        const length = Math.floor(Math.random() * 2) + 5; // 5 o 6 caratteri
        for (let i = 0; i < length; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        document.getElementById('correctTextCaptcha').value = captcha;
        
        // Disegna il testo sul canvas con effetti visivi
        const canvas = document.getElementById('textCaptcha');
        const ctx = canvas.getContext('2d');
        
        // Sfondo con colore casuale
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${Math.random() * 360}, 50%, 80%)`);
        gradient.addColorStop(1, `hsl(${Math.random() * 360}, 50%, 80%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Linee di disturbo
        ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
        
        // Cerchi di disturbo
        ctx.strokeStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width, 
                Math.random() * canvas.height, 
                Math.random() * 10 + 5, 
                0, 
                Math.PI * 2
            );
            ctx.stroke();
        }
        
        // Testo distorto
        for (let i = 0; i < captcha.length; i++) {
            ctx.save();
            ctx.translate(20 + i * 30, canvas.height / 2);
            
            // Rotazione e scala casuali per ogni carattere
            const angle = (Math.random() - 0.5) * 0.6; // -0.3 a 0.3 radianti
            const scaleX = 0.8 + Math.random() * 0.4; // 0.8 a 1.2
            const scaleY = 0.8 + Math.random() * 0.4; // 0.8 a 1.2
            
            ctx.transform(scaleX, 0, 0, scaleY, 0, 0);
            ctx.rotate(angle);
            
            // Colore casuale per ogni carattere
            ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 40%)`;
            ctx.font = `bold ${20 + Math.random() * 10}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillText(captcha[i], 0, 0);
            ctx.restore();
        }
        
        // Resetta il campo della risposta
        document.getElementById('textCaptchaInput').value = '';
    }
    
    // Inizializza la verifica quando la pagina viene caricata
    generateTextCaptcha();
    
    // Aggiungi evento per rigenerare il CAPTCHA quando si clicca sull'immagine
    document.getElementById('textCaptcha').addEventListener('click', generateTextCaptcha);
    
    const form = document.getElementById('unbanForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Previene l'invio normale del modulo
        
        // Ottieni i valori dei campi
        const discordName = document.getElementById('discordName').value.trim();
        const discordUsername = document.getElementById('discordUsername').value.trim();
        const discordId = document.getElementById('discordId').value.trim();
        const banReason = document.getElementById('banReason').value.trim();
        const unbanReason = document.getElementById('unbanReason').value.trim();
        const textCaptchaInput = document.getElementById('textCaptchaInput').value.trim();
        const correctTextCaptcha = document.getElementById('correctTextCaptcha').value;
        
        // Controllo se l'utente ha già inviato una richiesta entro le ultime 24 ore
        const existingRequest = localStorage.getItem('unbanRequest_' + discordId);
        
        if (existingRequest) {
            const request = JSON.parse(existingRequest);
            
            // Controlla se sono trascorse almeno 24 ore dalla richiesta
            const requestTime = new Date(request.timestamp).getTime();
            const now = new Date().getTime();
            const timeDiff = now - requestTime;
            
            if (timeDiff < 86400000) { // 24 ore in millisecondi
                const remainingTimeMs = 86400000 - timeDiff;
                const remainingHours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
                const remainingMinutes = Math.ceil((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
                
                if (remainingHours > 0) {
                    alert(`Hai già inviato una richiesta di unban. Devi attendere ${remainingHours} ore e ${remainingMinutes} minuti prima di poter inviare una nuova richiesta.`);
                } else {
                    alert(`Hai già inviato una richiesta di unban. Devi attendere ${remainingMinutes} minuti prima di poter inviare una nuova richiesta.`);
                }
                
                generateTextCaptcha(); // Rigenera il CAPTCHA per sicurezza
                hideLoadingAnimation(); // Assicura che l'animazione di caricamento sia nascosta
                return;
            }
        }
        
        // Controllo rate limiting (1 ora)
        if (!checkRateLimit()) {
            return;
        }

        
        // Mostra animazione di caricamento
        showLoadingAnimation();
        
        // Validazione dei campi
        if (!discordName || !discordUsername || !discordId || !banReason || !unbanReason || !textCaptchaInput) {
            alert('Per favore compila tutti i campi obbligatori.');
            generateTextCaptcha(); // Rigenera il CAPTCHA
            hideLoadingAnimation();
            return;
        }
        
        // Controllo che l'ID Discord contenga tra 17 e 20 cifre numeriche
        if (!/^\d{17,20}$/.test(discordId)) {
            alert('Richiesta non valida. La richiesta verrà eliminata automaticamente.');
            generateTextCaptcha(); // Rigenera il CAPTCHA
            hideLoadingAnimation();
            return;
        }
        
        // Verifica la risposta del CAPTCHA
        if (textCaptchaInput.toUpperCase() !== correctTextCaptcha) {
            alert('Testo anti-bot errato. Riprova.');
            generateTextCaptcha(); // Rigenera il CAPTCHA
            hideLoadingAnimation();
            return;
        }
        
        // Salva i dati della richiesta in localStorage per lo stato (usando l'ID Discord come chiave)
        const requestInfo = {
            discordName: discordName,
            discordUsername: discordUsername,
            discordId: discordId,
            banReason: banReason,
            unbanReason: unbanReason,
            timestamp: new Date().toISOString(),
            status: 'pending', // Cambiato da 'submitted' a 'pending' per coerenza
            adminNote: '' // Inizializza come stringa vuota
        };
        
        localStorage.setItem('unbanRequest_' + discordId, JSON.stringify(requestInfo));
        
        // Registra l'invio per il rate limiting (1 richiesta ogni 24 ore)
        localStorage.setItem('lastUnbanSubmission', new Date().getTime().toString());
        
        
        // Cancella la bozza del modulo
        localStorage.removeItem('unbanFormDraft');

        // Invia i dati al backend
        console.log('Invio richiesta al backend con dati:', {
            discordName: discordName,
            discordUsername: discordUsername,
            discordId: discordId,
            banReason: banReason,
            unbanReason: unbanReason
        });
        
        fetch('/api/unban-requests-webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                discordName: discordName,
                discordUsername: discordUsername,
                discordId: discordId,
                banReason: banReason,
                unbanReason: unbanReason
            })
        })
        .then(response => {
            console.log('Risposta ricevuta dal backend, status:', response.status);
            if (response.ok) {
                // Reindirizzamento alla pagina di conferma
                localStorage.setItem('requestCode', discordId);
                window.location.href = 'confirmation.html';
            } else if (response.status === 409) {
                alert('Hai già inviato una richiesta di unban con questo ID Discord. Attendi la risposta entro 24 ore.');
                generateTextCaptcha(); // Rigenera il CAPTCHA
                hideLoadingAnimation();
            } else {
                console.log('Errore dal backend, status:', response.status);
                alert('Errore durante l\'invio della richiesta. Riprova più tardi.');
                generateTextCaptcha(); // Rigenera il CAPTCHA
                hideLoadingAnimation();
            }
        })
        .catch(error => {
            console.error('Errore nel fetch:', error);
            alert('Si è verificato un errore durante l\'invio della richiesta.');
            generateTextCaptcha(); // Rigenera il CAPTCHA
            hideLoadingAnimation();
        });
    });
});
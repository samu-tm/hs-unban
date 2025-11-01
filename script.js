document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('unbanForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Previene l'invio normale del modulo
        
        // Ottieni i valori dei campi
        const discordName = document.getElementById('discordName').value.trim();
        const discordUsername = document.getElementById('discordUsername').value.trim();
        const discordId = document.getElementById('discordId').value.trim();
        const banReason = document.getElementById('banReason').value.trim();
        const unbanReason = document.getElementById('unbanReason').value.trim();
        
        // Validazione dei campi
        if (!discordName || !discordUsername || !discordId || !banReason || !unbanReason) {
            alert('Per favore compila tutti i campi obbligatori.');
            return;
        }
        
        // Controllo che l'ID Discord contenga solo numeri
        if (!/^\d+$/.test(discordId)) {
            alert('L\'ID Discord deve contenere solo numeri.');
            return;
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
                timestamp: new Date().toISOString(),
                color: 0x00ff00
            }]
        };
        
        // Invia i dati al webhook Discord
        fetch('https://discord.com/api/webhooks/1434129803027415162/SXoGZ9519x3P8kE1uGzLjVTyyjpcXGCkVsap0v9hMjVuQaYKxUwxiBjPSUk3l4U4Ok2y', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
        })
        .then(response => {
            if (response.ok) {
                // Reindirizzamento alla pagina di conferma
                window.location.href = 'confirmation.html';
            } else {
                alert('Errore durante l\'invio della richiesta. Riprova più tardi.');
            }
        })
        .catch(error => {
            console.error('Errore:', error);
            alert('Si è verificato un errore durante l\'invio della richiesta.');
        });
    });
});
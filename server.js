const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile('index.html', (err, data) => {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        });
    } else if (req.url === '/client.js') {
        fs.readFile('client.js', (err, data) => {
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(data);
        });
    } else if (req.url === '/style.css') {
        fs.readFile('style.css', (err, data) => {
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

const wss = new WebSocket.Server({ server });

let clients = new Map(); // WebSocket => { id, username, x, y }

function broadcastPlayers() {
    const players = [...clients.values()];
    const data = JSON.stringify({ type: 'players', players });
    for (const client of clients.keys()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

wss.on('connection', (ws) => {
    const id = Math.random().toString(36).substr(2, 9);
    let player = {
        id,
        username: null,
        x: Math.random() * 500,
        y: Math.random() * 500
    };

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'set-username':
                    player.username = data.username.substring(0, 20); // Limite à 20 caractères
                    clients.set(ws, player);
                    ws.send(JSON.stringify({ type: 'init', id: player.id, username: player.username }));
                    broadcastPlayers();
                    break;

                case 'move':
                    if (!clients.has(ws)) return;
                    player.x = data.x;
                    player.y = data.y;
                    broadcastPlayers();
                    break;

                case 'chat':
                    const sender = clients.get(ws);
                    if (!sender) return;

                    const messageData = {
                        type: 'chat',
                        from: sender.username,
                        to: data.to,
                        message: data.message.substring(0, 200) // Limite de message
                    };

                    // Envoi uniquement au destinataire
                    for (const [client, p] of clients.entries()) {
                        if (p.id === data.to && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(messageData));
                        }
                    }
                    break;
            }
        } catch (err) {
            console.error('Erreur de traitement du message WebSocket:', err);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        broadcastPlayers();
    });
});

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});

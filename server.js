/*const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    let file = req.url === '/' ? 'index.html' : req.url.substring(1);
    const ext = path.extname(file);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css'
    };

    const filePath = path.join(__dirname, file);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(data);
        }
    });
});

// WebSocket setup
const wss = new WebSocket.Server({ server });

let clients = new Map(); // ws => { id, username, x, y }

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
    const id = Math.random().toString(36).substring(2, 9);
    const player = { id, username: null, x: Math.random() * 500, y: Math.random() * 500 };

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case 'set-username':
                    player.username = data.username.substring(0, 20);
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
                        message: data.message.substring(0, 200)
                    };

                    for (const [client, p] of clients.entries()) {
                        if (p.id === data.to && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(messageData));
                        }
                    }
                    break;
            }
        } catch (err) {
            console.error('Erreur WebSocket:', err);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        broadcastPlayers();
    });
});

// Render requires using process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
*/

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    let file;
    if (req.url === '/') {
        file = 'index.html';
    } else if (req.url === '/sitemap.xml') {
        // Serve sitemap.xml
        file = 'sitemap.xml';
    } else {
        file = req.url.substring(1);
    }

    const ext = path.extname(file);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.xml': 'application/xml'
    };

    const filePath = path.join(__dirname, file);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            res.end(data);
        }
    });
});

// WebSocket setup
const wss = new WebSocket.Server({ server });
let clients = new Map(); // ws => { id, username, x, y }

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
    const id = Math.random().toString(36).substring(2, 9);
    const player = { id, username: null, x: Math.random() * 500, y: Math.random() * 500 };
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'set-username':
                    player.username = data.username.substring(0, 20);
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
                        message: data.message.substring(0, 200)
                    };
                    for (const [client, p] of clients.entries()) {
                        if (p.id === data.to && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(messageData));
                        }
                    }
                    break;
            }
        } catch (err) {
            console.error('Erreur WebSocket:', err);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        broadcastPlayers();
    });
});

// Render requires using process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
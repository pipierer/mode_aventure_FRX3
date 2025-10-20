let canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');

let keys = {};
let players = [];
let player = null;
let chatTarget = null;
let ws;

const chatBox = document.getElementById('chatbox');
const chatInput = document.getElementById('chatinput');
const messages = document.getElementById('messages');

// === Chargement de l'image de fond et création du motif infini ===
const background = new Image();
background.src = 'image.png'; // Ton image de fond
let bgPattern = null;

background.onload = () => {
    // Crée un pattern (motif) à partir de l'image
    bgPattern = ctx.createPattern(background, 'repeat');
};

// === Fonction pour lancer le jeu et ouvrir la connexion WebSocket ===
function startGame(username) {
    document.getElementById('login').classList.add('hidden');
    canvas.classList.remove('hidden');

    ws = new WebSocket(`wss://${location.host}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'set-username', username }));
    };

    ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === 'init') {
            player = { id: data.id, username: data.username, x: 100, y: 100 };
        } else if (data.type === 'players') {
            players = data.players;
        } else if (data.type === 'chat') {
            if (player && data.to === player.id) {
                messages.innerHTML += `<div><b>${data.from}:</b> ${data.message}</div>`;
                chatBox.classList.remove('hidden');
            }
        }
    };

    gameLoop();
}

// === Connexion auto si pseudo déjà stocké ===
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('username');
    const usernameInput = document.getElementById('usernameInput');

    if (savedName) {
        usernameInput.value = savedName;
        startGame(savedName);
    }

    document.getElementById('startButton').onclick = () => {
        const username = usernameInput.value.trim();
        if (!username) return alert('Entrez un pseudo !');
        localStorage.setItem('username', username);
        startGame(username);
    };

    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) mobileControls.classList.remove('hidden');
});

// === Gestion clavier + chat ===
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key.toLowerCase() === 'e' && chatTarget) {
        chatBox.classList.remove('hidden');
        chatInput.focus();
    }
});

chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && chatInput.value && chatTarget) {
        ws.send(JSON.stringify({
            type: 'chat',
            to: chatTarget,
            message: chatInput.value
        }));
        messages.innerHTML += `<div><b>Moi:</b> ${chatInput.value}</div>`;
        chatInput.value = '';
    }
});

// === Boucle de jeu principale ===
function gameLoop() {
    if (!player) return requestAnimationFrame(gameLoop);

    let speed = 2;
    if (keys['ArrowUp']) player.y -= speed;
    if (keys['ArrowDown']) player.y += speed;
    if (keys['ArrowLeft']) player.x -= speed;
    if (keys['ArrowRight']) player.x += speed;

    ws.send(JSON.stringify({ type: 'move', x: player.x, y: player.y }));

    // === Dessin du fond infini (pattern répété) ===
    if (bgPattern) {
        ctx.save();

        // Décalage de la "caméra" en fonction du joueur
        const offsetX = -player.x + canvas.width / 2;
        const offsetY = -player.y + canvas.height / 2;
        ctx.translate(offsetX, offsetY);

        // Remplit le canvas avec le motif répété
        ctx.fillStyle = bgPattern;
        ctx.fillRect(player.x - canvas.width / 2, player.y - canvas.height / 2, canvas.width, canvas.height);

        ctx.restore();
    } else {
        // Affiche un fond noir temporaire si l'image n'est pas encore chargée
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // === Dessin des joueurs ===
    chatTarget = null;

    for (let p of players) {
        const isSelf = p.id === player.id;

        // Position du joueur sur l'écran (centré)
        const dx = p.x - player.x + canvas.width / 2;
        const dy = p.y - player.y + canvas.height / 2;

        ctx.fillStyle = isSelf ? 'blue' : 'red';
        ctx.beginPath();
        ctx.arc(dx, dy, 15, 0, Math.PI * 2);
        ctx.fill();

        // Pseudo du joueur
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.username, dx, dy - 20);

        // Chat possible ?
        if (!isSelf) {
            const dist = Math.hypot(player.x - p.x, player.y - p.y);
            if (dist < 50) {
                chatTarget = p.id;
                ctx.fillText('[E] pour parler', dx, dy + 25);
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

// === Contrôles mobiles ===

const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const talkBtn = document.getElementById('talkBtn');

function addButtonListeners(btn, key) {
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        keys[key] = true;
    });
    btn.addEventListener('touchend', e => {
        e.preventDefault();
        keys[key] = false;
    });
}

addButtonListeners(upBtn, 'ArrowUp');
addButtonListeners(downBtn, 'ArrowDown');
addButtonListeners(leftBtn, 'ArrowLeft');
addButtonListeners(rightBtn, 'ArrowRight');

if (talkBtn) {
    talkBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (chatTarget) {
            chatBox.classList.remove('hidden');
            chatInput.focus();
        }
    });
}

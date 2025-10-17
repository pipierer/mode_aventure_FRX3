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

// Fonction pour lancer le jeu et ouvrir WS
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

// Au chargement, vérifie si un pseudo est déjà stocké -> connexion auto
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('username');
    const usernameInput = document.getElementById('usernameInput');

    if (savedName) {
        usernameInput.value = savedName;
        startGame(savedName);
    }

    // Bouton "Jouer"
    document.getElementById('startButton').onclick = () => {
        const username = usernameInput.value.trim();
        if (!username) return alert('Entrez un pseudo !');

        localStorage.setItem('username', username);
        startGame(username);
    };

    // Affiche contrôles mobiles si mobile détecté
    if (isMobile()) {
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) mobileControls.classList.remove('hidden');
    }
});

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

function gameLoop() {
    if (!player) return requestAnimationFrame(gameLoop);

    let speed = 2;
    if (keys['ArrowUp']) player.y -= speed;
    if (keys['ArrowDown']) player.y += speed;
    if (keys['ArrowLeft']) player.x -= speed;
    if (keys['ArrowRight']) player.x += speed;

    ws.send(JSON.stringify({ type: 'move', x: player.x, y: player.y }));

    // Fond noir (remplace clearRect)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    chatTarget = null;
    for (let p of players) {
        const isSelf = p.id === player.id;
        const dx = p.x - player.x + canvas.width / 2;
        const dy = p.y - player.y + canvas.height / 2;

        ctx.fillStyle = isSelf ? 'blue' : 'red';
        ctx.beginPath();
        ctx.arc(dx, dy, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.username, dx, dy - 20);

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

// === GESTION DES BOUTONS MOBILE ===

const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const talkBtn = document.getElementById('talkBtn');

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

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

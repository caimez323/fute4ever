const socket = io();

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const playersContainer = document.getElementById('connected-players');
const rerollButton = document.getElementById('reroll-dice');
const playerUsername = document.getElementById('player-username');
const playerImage = document.getElementById('player-image');
const playerAvatar = document.getElementById('player-avatar');
const imageText = document.getElementById('image-text');
const largeImageContainer = document.getElementById('large-image-container');
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d');

let currentPlayer = '';

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    if (username.trim()) {
        socket.emit('player-join', { username });

        // Change de section
        loginSection.style.display = 'none';
        gameSection.style.display = 'block';

        // Sauvegarde le pseudo du joueur
        currentPlayer = username;
        playerUsername.textContent = `Vous êtes : ${currentPlayer}`;
        playerImage.src = `https://ui-avatars.com/api/?name=${currentPlayer}&background=random`; // Image avatar générée
    }
});

socket.on('update-players', (players) => {
    playersContainer.innerHTML = '';
    players.forEach((player) => {
        const playerElement = document.createElement('div');
        playerElement.textContent = player.username;
        playersContainer.appendChild(playerElement);
    });
});

playerAvatar.addEventListener('click', () => {
    largeImageContainer.style.display = 'block';
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    ctx.drawImage(playerAvatar, 0, 0, canvas.width, canvas.height);
    imageText.style.display = 'block';
});

canvas.addEventListener('mousedown', (e) => {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY);

    const drawLine = (e) => {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    };

    canvas.addEventListener('mousemove', drawLine);
    canvas.addEventListener('mouseup', () => {
        canvas.removeEventListener('mousemove', drawLine);
    });
});

imageText.addEventListener('input', () => {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(imageText.value, 10, canvas.height - 30);
});

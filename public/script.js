const socket = io();

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const playersContainer = document.getElementById('connected-players');
const rerollButton = document.getElementById('reroll-dice');
const playerUsername = document.getElementById('player-username');
const playerImage = document.getElementById('player-image');

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

// Logic for rerolling dice (random dice value)
rerollButton.addEventListener('click', () => {
    const dice = document.querySelectorAll('.dice');
    dice.forEach(die => {
        die.textContent = Math.floor(Math.random() * 6) + 1; // Random value between 1 and 6
    });
});

const socket = io();

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const playersContainer = document.getElementById('connected-players');
const rerollButton = document.getElementById('reroll-dice');
const playerUsername = document.getElementById('player-username');
const playerImage = document.getElementById('player-image');
const playerAvatar = document.getElementById('player-avatar');
const largeImageContainer = document.getElementById('large-image-container');
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d');

let currentPlayer = '';
let savedImageData = null; // Stocker les modifications du canvas

// Gestion de la soumission du formulaire
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    if (username.trim()) {
        // Émission de l'événement de connexion au serveur
        socket.emit('player-join', { username });

        // Passage à la section du jeu
        loginSection.style.display = 'none';
        gameSection.style.display = 'block';

        // Mise à jour des informations du joueur
        currentPlayer = username;
        playerUsername.textContent = `Vous êtes : ${currentPlayer}`;
        playerImage.src = `https://ui-avatars.com/api/?name=${currentPlayer}&background=random`; // Avatar généré dynamiquement
    }
});

// Mise à jour de la liste des joueurs
socket.on('update-players', (players) => {
    playersContainer.innerHTML = '';
    players.forEach((player) => {
        const playerElement = document.createElement('div');
        playerElement.textContent = player.username;
        playersContainer.appendChild(playerElement);
    });
});

// Gestion de l'agrandissement de l'image
playerAvatar.addEventListener('click', () => {
    largeImageContainer.style.display = 'flex'; // Affiche la vue agrandie
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    const image = new Image();
    image.src = savedImageData || playerAvatar.src; // Charge l'image modifiée ou originale
    image.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Efface le canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // Dessine l'image
    };
});

// Gestion du dessin sur le canvas
let isDrawing = false;
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Sauvegarde des modifications et retour
const closeLargeImageButton = document.getElementById('close-large-image');
closeLargeImageButton.addEventListener('click', () => {
    savedImageData = canvas.toDataURL(); // Sauvegarde le contenu du canvas en base64
    largeImageContainer.style.display = 'none'; // Masque la vue agrandie
});

// Fonctionnalité de relance des dés
rerollButton.addEventListener('click', () => {
    const diceContainer = document.querySelector('.dice-container');
    diceContainer.innerHTML = ''; // Vide les dés existants

    const diceColors = ['green', 'grey', 'blue', 'yellow', 'pink', 'white']; // Couleurs des dés
    diceColors.forEach((color) => {
        const dice = document.createElement('div');
        dice.className = `dice ${color}`;
        dice.textContent = Math.floor(Math.random() * 6) + 1; // Valeur aléatoire entre 1 et 6
        diceContainer.appendChild(dice);
    });
});

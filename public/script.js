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
const diceContainer = document.querySelector('.dice-container');
const circleZone = document.querySelector('.circle-zone'); // Zone circulaire grise

const colorPicker = document.getElementById('color-picker');
const thicknessPicker = document.getElementById('thickness-picker');
const eraserButton = document.getElementById('eraser-button');
const drawButton = document.getElementById('draw-button');

let isDrawing = false;
let isErasing = false; // Mode gomme
let currentColor = colorPicker.value; // Couleur actuelle
let currentThickness = thicknessPicker.value; // Épaisseur actuelle



let currentPlayer = '';
let savedImageData = null; // Stocker les modifications du canvas

// Tableau pour stocker les dés des joueurs
let dice = [];

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
    image.crossOrigin = 'Anonymous'; // Ajouter crossOrigin pour les images externes
    image.src = savedImageData || playerAvatar.src; // Charge l'image modifiée ou originale
    image.onload = () => {
        // Taille maximale du canvas en fonction de l'écran
        const maxWidth = window.innerWidth * 0.8; // Par exemple, 80% de la largeur de l'écran
        const maxHeight = window.innerHeight * 0.8; // 80% de la hauteur de l'écran
    
        // Calculer le ratio pour conserver les proportions
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
    
        // Adapter le canvas
        canvas.width = image.width * ratio;
        canvas.height = image.height * ratio;
    
        // Dessiner l'image sur le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
});

// Gestion du dessin sur le canvas

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        if (isErasing) {
            ctx.globalCompositeOperation = 'destination-out'; // Mode effacement
            ctx.lineWidth = currentThickness * 2; // Gomme plus large
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over'; // Mode dessin
            ctx.lineWidth = currentThickness;
            ctx.strokeStyle = currentColor;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
    }
});


canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Mise à jour de la couleur
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

// Mise à jour de l'épaisseur
thicknessPicker.addEventListener('input', (e) => {
    currentThickness = e.target.value;
});

// Activer le mode gomme
eraserButton.addEventListener('click', () => {
    isErasing = true;
});

// Activer le mode dessin
drawButton.addEventListener('click', () => {
    isErasing = false;
});

// Sauvegarde des modifications et retour
const closeLargeImageButton = document.getElementById('close-large-image');
closeLargeImageButton.addEventListener('click', () => {
    savedImageData = canvas.toDataURL(); // Sauvegarde le contenu du canvas en base64
    largeImageContainer.style.display = 'none'; // Masque la vue agrandie
});

// Fonctionnalité de relance des dés
rerollButton.addEventListener('click', () => {
    const diceColors = ['green', 'grey', 'blue', 'yellow', 'pink', 'white'];
    dice.forEach((die) => {
        if (!die.inCircle) {
            die.value = Math.floor(Math.random() * 6) + 1; // Met à jour uniquement les dés hors du cercle
        }
    });

    // Met à jour l'affichage
    drawDice(dice);

    // Synchronise les dés avec le serveur
    socket.emit('update-dice', dice);
});

// Recevoir la mise à jour des dés du serveur et afficher sur tous les clients
socket.on('update-dice', (newDice) => {
    dice = newDice;
    drawDice(newDice);
});


// Fonction pour dessiner les dés
function drawDice(dice) {
    diceContainer.innerHTML = '';
    circleZone.innerHTML = '';

    dice.forEach((die) => {
        const diceElement = document.createElement('div');
        diceElement.className = `dice ${die.color}`;
        diceElement.textContent = die.value;

        // Ajoute un événement pour déplacer les dés entre les zones
        diceElement.addEventListener('click', () => {
            die.inCircle = !die.inCircle; // Change l'état de la position du dé
            drawDice(dice); // Redessine les dés
        });

        // Ajoute le dé dans la bonne zone
        if (die.inCircle) {
            circleZone.appendChild(diceElement);
        } else {
            diceContainer.appendChild(diceElement);
        }
    });
}

// Initialisation des dés au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const diceColors = ['green', 'grey', 'blue', 'yellow', 'pink', 'white'];
    dice = diceColors.map((color) => ({
        color: color,
        value: Math.floor(Math.random() * 6) + 1,
        inCircle: false, // Indique si le dé est dans la zone circulaire
    }));

    drawDice(dice);
});


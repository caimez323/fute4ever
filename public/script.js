const socket = io();

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const playerNameElement = document.getElementById('player-name');
const playerProfileImage = document.getElementById('player-profile-image');
const diceContainer = document.getElementById('dice-container');
const rollDiceButton = document.getElementById('roll-dice');
const playersContainer = document.getElementById('connected-players');

const profileImageUrl = 'https://www.istockphoto.com/resources/images/PhotoFTLP/P2-regional-iStock-1401927281.jpg';
const diceColors = ['green', 'blue', 'yellow', 'pink', 'gray', 'white'];

// Gestion de la soumission du formulaire de connexion
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    if (username.trim()) {
        playerNameElement.textContent = username;
        playerProfileImage.src = profileImageUrl;
        loginSection.style.display = 'none';
        gameSection.style.display = 'block';
        
        socket.emit('player-join', {
            username: username,
            connectionTime: new Date().toLocaleTimeString(),
            profileImage: profileImageUrl
        });
    }
});

// Mise à jour de la liste des joueurs
socket.on('update-players', (players) => {
    playersContainer.innerHTML = '';
    
    players.forEach((player) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        
        const playerProfileImage = document.createElement('img');
        playerProfileImage.src = player.profileImage; // Assurez-vous que l'image du profil est envoyée depuis le serveur
        playerProfileImage.alt = player.username;
        playerElement.appendChild(playerProfileImage);

        const playerName = document.createElement('span');
        playerName.textContent = player.username;
        playerElement.appendChild(playerName);

        playersContainer.appendChild(playerElement);
    });
});

// Lancer les dés
rollDiceButton.addEventListener('click', () => {
    diceContainer.innerHTML = '';
    for (let i = 0; i < diceColors.length; i++) {
        const diceValue = Math.floor(Math.random() * 6) + 1;
        const dice = document.createElement('div');
        dice.className = `dice ${diceColors[i]}`;
        dice.textContent = diceValue;
        diceContainer.appendChild(dice);
    }
    
    // Émettre l'événement de lancer de dés
    socket.emit('dice-rolled', {
        playerId: socket.id,
        diceResults: diceColors.map(() => Math.floor(Math.random() * 6) + 1)
    });
});

// Déconnexion
const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', () => {
    socket.emit('player-leave', playerNameElement.textContent);
    loginSection.style.display = 'block';
    gameSection.style.display = 'none';
});

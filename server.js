const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware pour servir les fichiers statiques (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Liste des joueurs connectés
let players = [];
// État des dés, initialement vide
let dice = [];

// Quand un joueur se connecte
io.on('connection', (socket) => {
    console.log('Un joueur est connecté');

    // Quand un joueur rejoint le jeu
    socket.on('player-join', (data) => {
        players.push({ username: data.username, socketId: socket.id });
        io.emit('update-players', players); // Envoie la liste des joueurs à tous les clients
    });

    // Quand un joueur effectue une relance des dés
    socket.on('update-dice', (newDice) => {
        dice = newDice; // Met à jour les dés avec les nouvelles valeurs
        io.emit('update-dice', dice); // Envoie les dés à tous les clients
    });

    // Lors de la déconnexion d'un joueur
    socket.on('disconnect', () => {
        players = players.filter(player => player.socketId !== socket.id); // Retirer le joueur de la liste
        io.emit('update-players', players); // Met à jour la liste des joueurs
        console.log('Un joueur est déconnecté');
    });
});

// Démarrage du serveur
server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});

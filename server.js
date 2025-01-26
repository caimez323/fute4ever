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

let players = [];

io.on('connection', (socket) => {
    console.log('Un joueur est connecté');

    socket.on('player-join', (data) => {
        players.push({ username: data.username });
        io.emit('update-players', players); // Envoie la liste des joueurs à tous les clients
    });

    socket.on('disconnect', () => {
        players = players.filter(player => player.socketId !== socket.id);
        io.emit('update-players', players); // Met à jour la liste des joueurs
        console.log('Un joueur est déconnecté');
    });
});

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});

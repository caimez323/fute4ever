const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let players = [];

// État canonique des dés — initialisé côté serveur une seule fois
const DICE_COLORS = ['green', 'grey', 'blue', 'yellow', 'pink', 'white'];
let dice = DICE_COLORS.map((color) => ({
  color,
  value: Math.floor(Math.random() * 6) + 1,
  inCircle: false,
}));

io.on('connection', (socket) => {
  console.log('Un joueur est connecté:', socket.id);

  // Envoie l'état actuel au nouveau joueur qui vient de se connecter
  socket.emit('init-dice', dice);

  socket.on('player-join', (data) => {
    // Évite les doublons si l'event est émis plusieurs fois
    if (!players.find(p => p.socketId === socket.id)) {
      players.push({ username: data.username, socketId: socket.id });
    }
    io.emit('update-players', players);
    // Renvoie aussi l'état des dés au nouvel arrivant via broadcast
    socket.emit('init-dice', dice);
  });

  // Un joueur relance les dés (seuls ceux hors du cercle changent de valeur)
  socket.on('reroll-dice', () => {
    dice = dice.map((die) => ({
      ...die,
      value: die.inCircle ? die.value : Math.floor(Math.random() * 6) + 1,
    }));
    // Broadcast à TOUS (y compris l'émetteur) pour garantir la cohérence
    io.emit('update-dice', dice);
  });

  // Un joueur déplace un dé dans/hors du cercle
  socket.on('move-die', (dieColor) => {
    dice = dice.map((die) =>
      die.color === dieColor ? { ...die, inCircle: !die.inCircle } : die
    );
    io.emit('update-dice', dice);
  });

  // Remettre tous les dés hors du cercle
    socket.on('reset-dice', () => {
    dice = dice.map((die) => ({ ...die, inCircle: false }));
    io.emit('update-dice', dice);
    });

  socket.on('disconnect', () => {
    players = players.filter((p) => p.socketId !== socket.id);
    io.emit('update-players', players);
    console.log('Un joueur est déconnecté:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
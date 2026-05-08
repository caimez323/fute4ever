const socket = io();

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const gameSection = document.getElementById('game-section');
const playersContainer = document.getElementById('connected-players');
const rerollButton = document.getElementById('reroll-dice');
const playerUsername = document.getElementById('player-username');
const playerAvatar = document.getElementById('player-avatar');
const largeImageContainer = document.getElementById('large-image-container');
const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d');
const diceContainer = document.querySelector('.dice-container');
const circleZone = document.querySelector('.circle-zone');

const colorPicker = document.getElementById('color-picker');
const thicknessPicker = document.getElementById('thickness-picker');
const eraserButton = document.getElementById('eraser-button');
const drawButton = document.getElementById('draw-button');

let isDrawing = false;
let isErasing = false;
let currentColor = colorPicker.value;
let currentThickness = thicknessPicker.value;
let currentPlayer = '';

// On garde l'image de fond en mémoire pour pouvoir la redessiner
let bgImage = null;
// Les annotations sont stockées séparément (canvas offscreen)
let annotationCanvas = null;

let dice = [];

// ─── Connexion ────────────────────────────────────────────────────────────────

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  if (username) {
    socket.emit('player-join', { username });
    loginSection.style.display = 'none';
    gameSection.style.display = 'block';
    currentPlayer = username;
    playerUsername.textContent = `Vous êtes : ${currentPlayer}`;
  }
});

// ─── Joueurs ──────────────────────────────────────────────────────────────────

socket.on('update-players', (players) => {
  playersContainer.innerHTML = '';
  players.forEach((player) => {
    const el = document.createElement('div');
    el.textContent = player.username;
    playersContainer.appendChild(el);
  });
});

// ─── Dés ─────────────────────────────────────────────────────────────────────

socket.on('init-dice', (serverDice) => {
  dice = serverDice;
  drawDice(dice);
});

socket.on('update-dice', (serverDice) => {
  dice = serverDice;
  drawDice(dice);
});

rerollButton.addEventListener('click', () => {
  socket.emit('reroll-dice');
});

function onDieClick(color) {
  socket.emit('move-die', color);
}

function drawDice(diceList) {
  diceContainer.innerHTML = '';
  circleZone.innerHTML = '';
  diceList.forEach((die) => {
    const el = document.createElement('div');
    el.className = `dice ${die.color}`;
    el.textContent = die.value;
    el.title = `Cliquer pour ${die.inCircle ? 'retirer du' : 'placer dans le'} cercle`;
    el.addEventListener('click', () => onDieClick(die.color));
    if (die.inCircle) {
      circleZone.appendChild(el);
    } else {
      diceContainer.appendChild(el);
    }
  });
}

// ─── Canvas / Grille ──────────────────────────────────────────────────────────

// Recompose le canvas visible : fond + annotations
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (bgImage) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  if (annotationCanvas) ctx.drawImage(annotationCanvas, 0, 0);
}

playerAvatar.addEventListener('click', () => {
  largeImageContainer.style.display = 'flex';

  const image = new Image();
  image.src = playerAvatar.src;
  image.onload = () => {
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
    const w = image.width * ratio;
    const h = image.height * ratio;

    canvas.width = w;
    canvas.height = h;

    bgImage = image;

    // Crée ou redimensionne le canvas d'annotations offscreen
    if (!annotationCanvas) {
      annotationCanvas = document.createElement('canvas');
    }
    annotationCanvas.width = w;
    annotationCanvas.height = h;

    redrawCanvas();
  };
});

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const { x, y } = getCanvasPos(e);
  const ac = annotationCanvas.getContext('2d');
  ac.beginPath();
  ac.moveTo(x, y);
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const { x, y } = getCanvasPos(e);
  const ac = annotationCanvas.getContext('2d');

  if (isErasing) {
    // Efface sur le canvas d'annotations uniquement
    ac.globalCompositeOperation = 'destination-out';
    ac.lineWidth = currentThickness * 2;
    ac.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ac.globalCompositeOperation = 'source-over';
    ac.lineWidth = currentThickness;
    ac.strokeStyle = currentColor;
  }

  ac.lineTo(x, y);
  ac.stroke();

  // Recompose le canvas visible à chaque frame
  redrawCanvas();
});

canvas.addEventListener('mouseup', () => { isDrawing = false; });
canvas.addEventListener('mouseleave', () => { isDrawing = false; });

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}

colorPicker.addEventListener('input', (e) => { currentColor = e.target.value; });
thicknessPicker.addEventListener('input', (e) => { currentThickness = e.target.value; });
eraserButton.addEventListener('click', () => { isErasing = true; });
drawButton.addEventListener('click', () => { isErasing = false; });

document.getElementById('close-large-image').addEventListener('click', () => {
  // Sauvegarde : le canvas visible = fond + annotations fusionnés
  playerAvatar.src = canvas.toDataURL();
  largeImageContainer.style.display = 'none';
});
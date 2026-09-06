const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
const { Game } = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Permitem conexiuni de pe orice host
});

app.use(express.static('public'));

const rooms = {}; // code -> Game

function genCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (rooms[code]);
  return code;
}

function broadcast(code) {
  const game = rooms[code];
  if (game) io.to(code).emit('state', game.state());
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentPlayerId = null;

  socket.on('create_room', ({ name }, cb) => {
    const code = genCode();
    const game = new Game(code);
    rooms[code] = game;
    game.addPlayer(socket.id, name || 'Jucător');
    currentRoom = code;
    currentPlayerId = socket.id;
    socket.join(code);
    cb({ ok: true, code, playerId: socket.id });
    broadcast(code);
  });

  socket.on('join_room', ({ code, name }, cb) => {
    code = (code || '').toUpperCase();
    const game = rooms[code];
    if (!game) return cb({ error: 'Camera nu există.' });
    if (game.started) return cb({ error: 'Jocul a început deja.' });
    const ok = game.addPlayer(socket.id, name || 'Jucător');
    if (!ok) return cb({ error: 'Camera e plină.' });
    currentRoom = code;
    currentPlayerId = socket.id;
    socket.join(code);
    cb({ ok: true, code, playerId: socket.id });
    broadcast(code);
  });

  // Reconectare automată la refresh
  socket.on('reconnect_player', ({ code, playerId }) => {
    const game = rooms[code];
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    player.disconnected = false;
    currentRoom = code;
    currentPlayerId = playerId;
    socket.join(code);

    socket.emit('state', game.state());
  });

  socket.on('start_game', (cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const ok = game.start();
    cb && cb(ok ? { ok: true } : { error: 'Ai nevoie de minim 2 jucători.' });
    broadcast(currentRoom);
  });

  socket.on('roll_dice', (cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.rollDice(socket.id);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('buy_property', (cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.buyProperty(socket.id);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('decline_buy', (cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.declineBuy(socket.id);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('end_turn', (cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    if (game.currentPlayer().id !== socket.id) return cb && cb({ error: 'Nu e rândul tău.' });
    if (game.pendingAction) return cb && cb({ error: 'Rezolvă mai întâi acțiunea curentă.' });
    game.nextTurn();
    cb && cb({ ok: true });
    broadcast(currentRoom);
  });

  socket.on('build_house', ({ tileIndex }, cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.buildHouse(socket.id, tileIndex);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('sell_house', ({ tileIndex }, cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.sellHouse(socket.id, tileIndex);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('toggle_mortgage', ({ tileIndex }, cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.toggleMortgage(socket.id, tileIndex);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('pay_jail', (cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.payToGetOutOfJail(socket.id);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('handicap_jail', (cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.takeHandicap(socket.id);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('answer_claim', ({ related, reason }, cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.answerClaim(socket.id, related, reason);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('vote_claim', ({ believe }, cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.voteClaim(socket.id, believe);
    cb && cb(res);
    broadcast(currentRoom);
  });

  socket.on('respond_handicap_offer', ({ accept }, cb) => {
    const game = rooms[currentRoom];
    if (!game) return;
    const res = game.respondHandicapOffer(socket.id, accept);
    cb && cb(res);
    broadcast(currentRoom);
  });

  // Jucătorul activ închide cartea extrasă
  socket.on('clear_card', () => {
    const game = rooms[currentRoom];
    if (!game) return;
    if (game.currentPlayer().id === socket.id) {
      game.lastDrawnCard = null;
      broadcast(currentRoom);
    }
  });

  socket.on('disconnect', () => {
    const game = rooms[currentRoom];
    if (game) {
      const player = game.players.find(p => p.id === socket.id);
      if (player) player.disconnected = true;
      broadcast(currentRoom);
    }
  });
});

function localIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sufalopoly rulează!`);
  console.log(`Pe acest laptop:  http://localhost:${PORT}`);
  console.log(`Pentru prieteni (aceeași rețea WiFi): http://${localIp()}:${PORT}`);
});
import GameState from '../game/GameState.js';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function roomHandlers(io, socket, rooms) {

  socket.on('create-room', (callback) => {
    let code;
    do { code = generateRoomCode(); } while (rooms.has(code));

    const room = {
      code,
      hostId: socket.userId,
      players: [{
        id: socket.userId,
        displayName: socket.displayName,
        socketId: socket.id,
      }],
      gameState: null,
      inGame: false,
    };

    rooms.set(code, room);
    socket.join(code);
    socket.roomCode = code;

    callback?.({ success: true, roomCode: code, room: sanitizeRoom(room) });
  });

  socket.on('join-room', ({ roomCode }, callback) => {
    const room = rooms.get(roomCode?.toUpperCase());
    if (!room) return callback?.({ error: 'Room not found' });

    if (room.players.some(p => p.id === socket.userId)) {
      const existing = room.players.find(p => p.id === socket.userId);
      existing.socketId = socket.id;
      socket.join(room.code);
      socket.roomCode = room.code;

      if (room.inGame && room.gameState) {
        const gsPlayer = room.gameState.getPlayer(socket.userId);
        if (gsPlayer) {
          gsPlayer.connected = true;
          gsPlayer.socketId = socket.id;
        }
        socket.emit('game-started', room.gameState.getFilteredState(socket.userId));
        broadcastGameState(io, room);
      } else {
        io.to(room.code).emit('room-updated', sanitizeRoom(room));
      }

      callback?.({ success: true, roomCode: room.code, room: sanitizeRoom(room) });
      return;
    }

    if (room.inGame) return callback?.({ error: 'Game already in progress' });
    if (room.players.length >= 12) return callback?.({ error: 'Room is full' });

    room.players.push({
      id: socket.userId,
      displayName: socket.displayName,
      socketId: socket.id,
    });

    socket.join(room.code);
    socket.roomCode = room.code;

    io.to(room.code).emit('room-updated', sanitizeRoom(room));
    callback?.({ success: true, roomCode: room.code, room: sanitizeRoom(room) });
  });

  socket.on('leave-room', () => {
    leaveCurrentRoom(io, socket, rooms);
  });

  socket.on('start-game', (callback) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return callback?.({ error: 'Not in a room' });
    if (room.hostId !== socket.userId) return callback?.({ error: 'Only the host can start' });
    if (room.players.length < 3) return callback?.({ error: 'Need at least 3 players' });
    if (room.inGame) return callback?.({ error: 'Game already in progress' });

    const gameState = new GameState(room.code, room.players);
    gameState.initGame();
    room.gameState = gameState;
    room.inGame = true;

    for (const player of room.players) {
      const sock = io.sockets.sockets.get(player.socketId);
      if (sock) {
        sock.emit('game-started', gameState.getFilteredState(player.id));
      }
    }

    broadcastGameState(io, room);

    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    leaveCurrentRoom(io, socket, rooms);
  });
}

function leaveCurrentRoom(io, socket, rooms) {
  const code = socket.roomCode;
  if (!code) return;

  const room = rooms.get(code);
  if (!room) return;

  if (room.inGame && room.gameState) {
    const player = room.gameState.getPlayer(socket.userId);
    if (player) {
      player.connected = false;
      player.socketId = null;
      broadcastGameState(io, room);
    }
  }

  if (!room.inGame) {
    room.players = room.players.filter(p => p.id !== socket.userId);

    if (room.players.length === 0) {
      rooms.delete(code);
      return;
    }

    if (room.hostId === socket.userId) {
      room.hostId = room.players[0].id;
    }

    io.to(code).emit('room-updated', sanitizeRoom(room));
  }

  socket.leave(code);
  socket.roomCode = null;
}

export function broadcastGameState(io, room) {
  if (!room.gameState) return;
  for (const player of room.players) {
    const sock = io.sockets.sockets.get(player.socketId);
    if (sock) {
      sock.emit('game-state', room.gameState.getFilteredState(player.id));
    }
  }
}

function sanitizeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map(p => ({
      id: p.id,
      displayName: p.displayName,
    })),
    inGame: room.inGame,
  };
}

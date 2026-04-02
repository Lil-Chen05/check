import { broadcastGameState } from './roomHandlers.js';

export default function gameHandlers(io, socket, rooms) {

  socket.on('peek-card', ({ cardIndex }, callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.peekCard(socket.userId, cardIndex);
    if (result.error) return callback?.({ error: result.error });

    callback?.({ success: true, card: result.card, cardIndex: result.cardIndex });
    broadcastGameState(io, room);
  });

  socket.on('call-check', (callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.callCheck(socket.userId);
    if (result.error) return callback?.({ error: result.error });

    io.to(room.code).emit('check-called', {
      callerId: socket.userId,
      callerName: socket.displayName,
    });

    broadcastGameState(io, room);
    callback?.({ success: true });
  });

  socket.on('draw-card', (callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.drawCard(socket.userId);
    if (result.error) return callback?.({ error: result.error });

    callback?.({ success: true, card: result.card });
    broadcastGameState(io, room);
  });

  socket.on('play-drawn-card', (callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.playDrawnCard(socket.userId);
    if (result.error) return callback?.({ error: result.error });

    io.to(room.code).emit('card-played', {
      playerId: socket.userId,
      card: result.card,
      type: 'play',
    });

    if (result.triggersReaction) {
      startReactionWindow(io, room, gameState);
    }

    callback?.({ success: true });
  });

  socket.on('swap-card', ({ handIndex }, callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.swapCard(socket.userId, handIndex);
    if (result.error) return callback?.({ error: result.error });

    io.to(room.code).emit('card-played', {
      playerId: socket.userId,
      card: result.displacedCard,
      type: 'swap',
    });

    if (result.triggersReaction) {
      startReactionWindow(io, room, gameState);
    }

    callback?.({ success: true });
  });

  socket.on('resolve-power', (data, callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.resolvePower(socket.userId, data);
    if (result.error) return callback?.({ error: result.error });

    if (result.peekedCard) {
      callback?.({ success: true, peekedCard: result.peekedCard });
    } else {
      callback?.({ success: true });
    }

    if (gameState.pendingPower === null) {
      const nextPower = gameState.startNextPower();
      if (!nextPower) {
        finishTurn(io, room, gameState);
      }
    }

    broadcastGameState(io, room);
  });

  socket.on('return-to-lobby', (callback) => {
    const room = rooms.get(socket.roomCode);
    if (!room) return callback?.({ error: 'Not in a room' });

    room.players = room.players.filter(p => {
      if (room.gameState) {
        const gsPlayer = room.gameState.getPlayer(p.id);
        return gsPlayer ? gsPlayer.connected : true;
      }
      return true;
    });

    room.inGame = false;
    room.gameState = null;

    if (room.players.length > 0 && !room.players.some(p => p.id === room.hostId)) {
      room.hostId = room.players[0].id;
    }

    io.to(room.code).emit('returned-to-lobby', {
      code: room.code,
      hostId: room.hostId,
      players: room.players.map(p => ({ id: p.id, displayName: p.displayName })),
    });

    callback?.({ success: true });
  });
}

function getGameContext(socket, rooms) {
  const room = rooms.get(socket.roomCode);
  return { room, gameState: room?.gameState };
}

function startReactionWindow(io, room, gameState) {
  const duration = gameState.openReactionWindow();
  if (!duration) {
    processPowerQueueOrAdvance(io, room, gameState);
    return;
  }

  io.to(room.code).emit('reaction-window-open', {
    cardOnPile: gameState.playPile[gameState.playPile.length - 1],
    duration,
  });

  broadcastGameState(io, room);

  gameState.reactionWindow.timer = setTimeout(() => {
    gameState.closeReactionWindow();
    io.to(room.code).emit('reaction-window-closed');

    processPowerQueueOrAdvance(io, room, gameState);
    broadcastGameState(io, room);
  }, duration);
}

function processPowerQueueOrAdvance(io, room, gameState) {
  const nextPower = gameState.startNextPower();
  if (nextPower) {
    broadcastGameState(io, room);
    return;
  }
  finishTurn(io, room, gameState);
}

function finishTurn(io, room, gameState) {
  const result = gameState.advanceTurn();

  if (result.gameOver) {
    gameState.phase = 'game-over';
    io.to(room.code).emit('game-over', { scores: result.scores });
    updateWinStats(room, result.scores);
  }

  broadcastGameState(io, room);
}

async function updateWinStats(room, scores) {
  try {
    const { default: supabase } = await import('../supabaseClient.js');
    if (!supabase) return;

    const winner = scores[0];
    await supabase.rpc('increment_wins', { user_id: winner.id }).catch(() => {});

    const updates = scores.map(s =>
      supabase.rpc('increment_games_played', { user_id: s.id }).catch(() => {})
    );
    await Promise.all(updates);
  } catch {
    // stats update is best-effort
  }
}

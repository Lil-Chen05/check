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

  socket.on('take-play-pile-top', (callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.takePlayPileTop(socket.userId);
    if (result.error) return callback?.({ error: result.error });

    /** Taking the pile top changes the visible top card; close any reaction targeting the old top. */
    surrenderOpenReactionWindow(io, room, gameState);

    callback?.({ success: true, card: result.card });
    broadcastGameState(io, room);
  });

  socket.on('play-drawn-card', (callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const queuedBeforePlay = gameState.powerQueue.length;

    surrenderOpenReactionWindow(io, room, gameState);
    if (gameState.phase === 'power-resolve') {
      return callback?.({ error: 'Resolve the power card first' });
    }

    const result = gameState.playDrawnCard(socket.userId);
    if (result.error) return callback?.({ error: result.error });

    io.to(room.code).emit('card-played', {
      playerId: socket.userId,
      card: result.card,
      type: 'play',
    });

    if (result.triggersReaction) {
      beginOrDeferPostPlayReaction(io, room, gameState, queuedBeforePlay);
    }

    broadcastGameState(io, room);
    callback?.({ success: true });
  });

  socket.on('swap-card', ({ handIndex }, callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const queuedBeforePlay = gameState.powerQueue.length;

    surrenderOpenReactionWindow(io, room, gameState);
    if (gameState.phase === 'power-resolve') {
      return callback?.({ error: 'Resolve the power card first' });
    }

    const result = gameState.swapCard(socket.userId, handIndex);
    if (result.error) return callback?.({ error: result.error });

    io.to(room.code).emit('card-played', {
      playerId: socket.userId,
      card: result.displacedCard,
      type: 'swap',
    });

    if (result.triggersReaction) {
      beginOrDeferPostPlayReaction(io, room, gameState, queuedBeforePlay);
    }

    broadcastGameState(io, room);
    callback?.({ success: true });
  });

  socket.on('start-queued-power', (callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    if (gameState.phase === 'power-resolve') {
      return callback?.({ error: 'A power is already being resolved' });
    }
    if (gameState.powerQueue.length === 0) {
      return callback?.({ error: 'Nothing to resolve' });
    }
    const head = gameState.powerQueue[0];
    if (head.controllerId !== socket.userId) {
      return callback?.({ error: 'Only the player who controls this power can resolve it' });
    }

    surrenderOpenReactionWindow(io, room, gameState);
    const started = gameState.startNextPower();
    if (!started) {
      return callback?.({ error: 'Could not start power' });
    }

    callback?.({ success: true });
    broadcastGameState(io, room);
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
        if (gameState.deferReactionAndTurnAfterPowers) {
          gameState.deferReactionAndTurnAfterPowers = false;
          startReactionWindow(io, room, gameState);
          finishTurn(io, room, gameState);
          gameState.alreadyAdvancedForPendingReaction = true;
        } else if (gameState.suppressNextFinishTurn) {
          gameState.suppressNextFinishTurn = false;
          // Turn was already advanced when the power was queued; skip advanceTurn but exit power-resolve.
          gameState.drawnCard = null;
          gameState.drawnFromPlayPile = false;
          gameState.phase = 'turn-draw';
        } else {
          finishTurn(io, room, gameState);
        }
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
  const meta = gameState.openReactionWindow();
  if (!meta?.opened) {
    processPowerQueueOrAdvance(io, room, gameState);
    return;
  }

  io.to(room.code).emit('reaction-window-open', {
    cardOnPile: gameState.playPile[gameState.playPile.length - 1],
    duration: null,
  });

  broadcastGameState(io, room);
}

/** End the current open reaction (no successful match) when the next player plays to the pile. */
function surrenderOpenReactionWindow(io, room, gameState) {
  if (!gameState.reactionWindow.active) return;

  if (gameState.reactionWindow.timer) {
    clearTimeout(gameState.reactionWindow.timer);
    gameState.reactionWindow.timer = null;
  }
  gameState.closeReactionWindow();
  gameState.alreadyAdvancedForPendingReaction = false;
  io.to(room.code).emit('reaction-window-closed');
}

/**
 * After a card hits the pile: if powers were already waiting from a previous top card,
 * resolve FIFO before opening a reaction for the new top card + advancing turn.
 * If the queue was empty before this play, open reaction now (this play's power waits like before).
 */
function beginOrDeferPostPlayReaction(io, room, gameState, queuedBeforePlay) {
  if (queuedBeforePlay > 0) {
    gameState.deferReactionAndTurnAfterPowers = true;
    const started = gameState.startNextPower();
    if (!started) {
      gameState.deferReactionAndTurnAfterPowers = false;
    } else {
      broadcastGameState(io, room);
      return;
    }
  }
  startReactionWindow(io, room, gameState);
  // Power on the pile is queued but not resolving yet — keep turn on the player who played it until powers finish.
  if (gameState.powerQueue.length > 0 && !gameState.pendingPower) {
    gameState.drawnCard = null;
    gameState.drawnFromPlayPile = false;
    gameState.phase = 'turn-draw';
    return;
  }
  finishTurn(io, room, gameState);
  gameState.alreadyAdvancedForPendingReaction = true;
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

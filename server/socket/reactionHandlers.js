import { broadcastGameState } from './roomHandlers.js';
import { isPowerCard, getPowerType } from '../game/Deck.js';

export default function reactionHandlers(io, socket, rooms) {

  socket.on('react-own-card', ({ cardIndex }, callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.handleReaction(socket.userId, 'own', { cardIndex });
    if (result.error) return callback?.({ error: result.error });

    io.to(room.code).emit('reaction-result', {
      reactorId: socket.userId,
      reactorName: socket.displayName,
      correct: result.correct,
      penalty: result.penalty,
      reason: result.reason,
      card: result.card,
      revealCards: result.revealCards ?? [],
    });

    if (result.correct && !result.penalty && result.power) {
      gameState.powerQueue.push({
        type: result.power,
        controllerId: socket.userId,
        card: result.card,
      });
    }

    if (result.correct && !result.penalty) {
      closeAndAdvance(io, room, gameState);
    }

    broadcastGameState(io, room);
    callback?.({ success: true, ...result });
  });

  socket.on('react-steal', ({ targetPlayerId, targetCardIndex, giveCardIndex }, callback) => {
    const { room, gameState } = getGameContext(socket, rooms);
    if (!gameState) return callback?.({ error: 'No active game' });

    const result = gameState.handleReaction(socket.userId, 'steal', {
      targetPlayerId,
      targetCardIndex,
      giveCardIndex,
    });
    if (result.error) return callback?.({ error: result.error });

    io.to(room.code).emit('reaction-result', {
      reactorId: socket.userId,
      reactorName: socket.displayName,
      victimId: result.victimId,
      victimName: result.victimId
        ? gameState.getPlayer(result.victimId)?.displayName
        : undefined,
      correct: result.correct,
      penalty: result.penalty,
      reason: result.reason,
      card: result.card,
      revealCards: result.revealCards ?? [],
      needStealGive: result.needStealGive,
      stealGiveCompleted: result.stealGiveCompleted,
    });

    if (result.needStealGive) {
      gameState.pauseReactionWindowTimer();
      io.to(room.code).emit('reaction-window-closed');
      broadcastGameState(io, room);
      callback?.({ success: true, ...result });
      return;
    }

    if (result.stealGiveCompleted) {
      closeAndAdvance(io, room, gameState);
      broadcastGameState(io, room);
      callback?.({ success: true, ...result });
      return;
    }

    if (result.correct && !result.penalty && result.power) {
      gameState.powerQueue.push({
        type: result.power,
        controllerId: socket.userId,
        card: result.card,
      });
    }

    if (result.correct && !result.penalty) {
      closeAndAdvance(io, room, gameState);
    }

    broadcastGameState(io, room);
    callback?.({ success: true, ...result });
  });
}

function getGameContext(socket, rooms) {
  const room = rooms.get(socket.roomCode);
  return { room, gameState: room?.gameState };
}

function closeAndAdvance(io, room, gameState) {
  if (gameState.reactionWindow.timer) {
    clearTimeout(gameState.reactionWindow.timer);
  }
  gameState.closeReactionWindow();
  io.to(room.code).emit('reaction-window-closed');

  const nextPower = gameState.startNextPower();
  if (nextPower) {
    broadcastGameState(io, room);
    return;
  }

  const result = gameState.advanceTurn();
  if (result.gameOver) {
    gameState.phase = 'game-over';
    io.to(room.code).emit('game-over', { scores: result.scores });
  }
}

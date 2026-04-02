import { createDeck, flipStartingCard, isPowerCard, getPowerType, shuffle } from './Deck.js';
import { calculateScores } from './Scoring.js';
import * as PowerCards from './PowerCards.js';
import * as Reactions from './Reactions.js';

export default class GameState {
  constructor(roomId, players) {
    this.roomId = roomId;
    this.players = players.map(p => ({
      id: p.id,
      displayName: p.displayName,
      socketId: p.socketId,
      hand: [],
      hasPeeked: false,
      knownCardIds: new Set(),
      connected: true,
    }));
    this.drawDeck = [];
    this.playPile = [];
    this.currentPlayerIndex = 0;
    this.phase = 'setup-peek';
    this.drawnCard = null;
    /** True when drawnCard came from the play pile — must swap, cannot play straight to pile. */
    this.drawnFromPlayPile = false;
    this.checkCaller = null;
    this.checkCallerIndex = null;
    this.finalTurnsRemaining = null;
    this.reactionWindow = {
      active: false,
      cardOnPile: null,
      playedBy: null,
      attemptedPlayers: new Set(),
      firstSuccessful: null,
      timer: null,
      windowStart: null,
    };
    this.pendingPower = null;
    this.powerQueue = [];
    this.lastEvent = null;
    /** After a successful blind steal: reactor must pick a card to give the victim. */
    this.stealGivePending = null;
    /**
     * After a play opens a reaction window we immediately advance turn so the next player can act;
     * a successful reaction must not advance again (would skip that player's turn).
     */
    this.alreadyAdvancedForPendingReaction = false;
    /** When set, the next power-chain completion must not call finishTurn (turn already advanced). */
    this.suppressNextFinishTurn = false;
    /**
     * After play/swap to pile: powers were drained before opening reaction + advancing turn.
     * When the queue is finally empty, open reaction for the new top card and finishTurn.
     */
    this.deferReactionAndTurnAfterPowers = false;
  }

  initGame() {
    this.drawDeck = createDeck(this.players.length);
    for (const player of this.players) {
      for (let i = 0; i < 4; i++) {
        player.hand.push(this.drawDeck.pop());
      }
    }
    const startCard = flipStartingCard(this.drawDeck);
    this.playPile.push(startCard);
    this.phase = 'setup-peek';
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getPlayerIndex(playerId) {
    return this.players.findIndex(p => p.id === playerId);
  }

  currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  // ── Setup Phase ─────────────────────────────────
  peekCard(playerId, cardIndex) {
    if (this.phase !== 'setup-peek') return { error: 'Not in peek phase' };
    const player = this.getPlayer(playerId);
    if (!player) return { error: 'Player not found' };
    if (player.hasPeeked) return { error: 'Already peeked' };
    if (cardIndex < 0 || cardIndex >= player.hand.length) return { error: 'Invalid card index' };

    player.hasPeeked = true;
    const card = player.hand[cardIndex];
    player.knownCardIds.add(card.id);

    if (this.players.every(p => p.hasPeeked || !p.connected)) {
      this.phase = 'turn-draw';
    }

    return {
      success: true,
      card: { id: card.id, rank: card.rank, suit: card.suit },
      cardIndex,
      allPeeked: this.phase === 'turn-draw',
    };
  }

  /** Powers are queued on the pile but not yet in pendingPower — turn actions wait until the controller starts resolving. */
  hasUnresolvedQueuedPower() {
    return this.powerQueue.length > 0 && !this.pendingPower;
  }

  static get QUEUED_POWER_WAIT_ERROR() {
    return 'Waiting for the power on the pile to be resolved';
  }

  // ── Turn Actions ────────────────────────────────
  callCheck(playerId) {
    if (this.phase === 'power-resolve') return { error: 'Finish resolving the power first' };
    if (this.phase !== 'turn-draw') return { error: 'Not in draw phase' };
    if (this.hasUnresolvedQueuedPower()) return { error: GameState.QUEUED_POWER_WAIT_ERROR };
    if (this.currentPlayer().id !== playerId) return { error: 'Not your turn' };
    if (this.checkCaller !== null) return { error: 'Check already called' };

    this.checkCaller = playerId;
    this.checkCallerIndex = this.currentPlayerIndex;
    this.finalTurnsRemaining = this.players.filter(p => p.connected).length;

    return { success: true, callerId: playerId };
  }

  drawCard(playerId) {
    if (this.phase !== 'turn-draw') return { error: 'Not in draw phase' };
    if (this.currentPlayer().id !== playerId) return { error: 'Not your turn' };
    if (this.hasUnresolvedQueuedPower()) return { error: GameState.QUEUED_POWER_WAIT_ERROR };

    this.ensureDrawDeck();
    if (this.drawDeck.length === 0) return { error: 'No cards available' };

    this.drawnCard = this.drawDeck.pop();
    this.drawnFromPlayPile = false;
    this.phase = 'turn-action';

    return {
      success: true,
      card: { id: this.drawnCard.id, rank: this.drawnCard.rank, suit: this.drawnCard.suit },
    };
  }

  /**
   * Take the current play-pile top instead of drawing. Held card must be swapped with a hand card
   * (never played straight back). Taking a power card does not queue a power — only the swapped-on card can.
   */
  takePlayPileTop(playerId) {
    if (this.phase !== 'turn-draw') return { error: 'Not in draw phase' };
    if (this.currentPlayer().id !== playerId) return { error: 'Not your turn' };
    if (this.hasUnresolvedQueuedPower()) return { error: GameState.QUEUED_POWER_WAIT_ERROR };
    if (this.playPile.length < 1) return { error: 'No card on the play pile' };

    const player = this.getPlayer(playerId);
    if (!player || player.hand.length < 1) {
      return { error: 'You need at least one hand card to swap after taking from the pile' };
    }

    this.drawnCard = this.playPile.pop();
    this.drawnFromPlayPile = true;
    this.phase = 'turn-action';
    this.lastEvent = { type: 'card-taken-from-pile', card: this.drawnCard, playerId };

    return {
      success: true,
      card: { id: this.drawnCard.id, rank: this.drawnCard.rank, suit: this.drawnCard.suit },
    };
  }

  playDrawnCard(playerId) {
    if (this.phase !== 'turn-action') return { error: 'Not in action phase' };
    if (this.currentPlayer().id !== playerId) return { error: 'Not your turn' };
    if (this.hasUnresolvedQueuedPower()) return { error: GameState.QUEUED_POWER_WAIT_ERROR };
    if (!this.drawnCard) return { error: 'No drawn card' };
    if (this.drawnFromPlayPile) {
      return { error: 'You must swap this card with one in your hand — you cannot play it straight back to the pile' };
    }

    const card = this.drawnCard;
    this.drawnCard = null;
    this.drawnFromPlayPile = false;
    this.playPile.push(card);

    if (isPowerCard(card)) {
      this.powerQueue.push({
        type: getPowerType(card),
        controllerId: playerId,
        card,
      });
    }

    this.lastEvent = { type: 'card-played', card, playerId };

    return {
      success: true,
      card,
      triggersReaction: true,
    };
  }

  swapCard(playerId, handIndex) {
    if (this.phase !== 'turn-action') return { error: 'Not in action phase' };
    if (this.currentPlayer().id !== playerId) return { error: 'Not your turn' };
    if (this.hasUnresolvedQueuedPower()) return { error: GameState.QUEUED_POWER_WAIT_ERROR };
    if (!this.drawnCard) return { error: 'No drawn card' };

    const player = this.getPlayer(playerId);
    if (player.hand.length === 0) return { error: 'No cards to swap — must play drawn card' };
    if (handIndex < 0 || handIndex >= player.hand.length) return { error: 'Invalid hand index' };

    const displaced = player.hand[handIndex];
    player.hand[handIndex] = this.drawnCard;
    this.drawnCard = null;
    this.drawnFromPlayPile = false;
    this.playPile.push(displaced);

    if (isPowerCard(displaced)) {
      this.powerQueue.push({
        type: getPowerType(displaced),
        controllerId: playerId,
        card: displaced,
      });
    }

    this.lastEvent = { type: 'card-swapped', card: displaced, playerId, handIndex };

    return {
      success: true,
      displacedCard: displaced,
      triggersReaction: true,
    };
  }

  // ── Power Resolution ────────────────────────────
  startNextPower() {
    if (this.powerQueue.length === 0) {
      this.pendingPower = null;
      return null;
    }

    const power = this.powerQueue.shift();
    this.pendingPower = { ...power, step: power.type === 'black-king' ? 'peek' : 'resolve' };
    this.phase = 'power-resolve';
    return this.pendingPower;
  }

  resolvePower(playerId, data) {
    if (this.phase !== 'power-resolve') return { error: 'Not in power phase' };
    if (!this.pendingPower) return { error: 'No pending power' };
    if (this.pendingPower.controllerId !== playerId) return { error: 'Not the power controller' };

    const { type, step } = this.pendingPower;
    let result;

    switch (type) {
      case 'jack':
        result = PowerCards.resolveJack(this, playerId, data.cardIndex);
        if (result.success) this.pendingPower = null;
        break;

      case 'queen':
        result = PowerCards.resolveQueen(this, playerId, data.pos1, data.pos2);
        if (result.success) this.pendingPower = null;
        break;

      case 'red-king':
        result = PowerCards.resolveRedKing(this, playerId, data.targetPlayerId);
        if (result.success) this.pendingPower = null;
        break;

      case 'black-king':
        if (step === 'peek') {
          result = PowerCards.resolveBlackKingPeek(this, playerId, data.targetPlayerId, data.cardIndex);
          if (result.success) {
            this.pendingPower.step = 'swap';
            this.pendingPower.peekedPosition = {
              playerId: data.targetPlayerId,
              cardIndex: data.cardIndex,
            };
          }
        } else {
          result = PowerCards.resolveBlackKingSwap(
            this, playerId,
            this.pendingPower.peekedPosition,
            data.toPos,
          );
          if (result.success) this.pendingPower = null;
        }
        break;

      default:
        return { error: 'Unknown power type' };
    }

    return result;
  }

  // ── Reaction Window ─────────────────────────────
  openReactionWindow() {
    return Reactions.openWindow(
      this,
      this.playPile[this.playPile.length - 1],
      this.lastEvent?.playerId,
      false,
    );
  }

  handleReaction(reactorId, type, data) {
    if (type === 'own') {
      return Reactions.handleOwnCardReaction(this, reactorId, data.cardIndex);
    } else if (type === 'steal') {
      return Reactions.handleStealReaction(
        this, reactorId,
        data.targetPlayerId, data.targetCardIndex, data.giveCardIndex,
      );
    }
    return { error: 'Invalid reaction type' };
  }

  closeReactionWindow() {
    Reactions.closeWindow(this);
  }

  /** Stop reaction timer / UI without wiping steal resolution state mid steal-give. */
  pauseReactionWindowTimer() {
    if (this.reactionWindow.timer) {
      clearTimeout(this.reactionWindow.timer);
      this.reactionWindow.timer = null;
    }
    this.reactionWindow.active = false;
  }

  // ── Turn Advancement ────────────────────────────
  advanceTurn() {
    this.drawnCard = null;
    this.drawnFromPlayPile = false;

    if (this.finalTurnsRemaining !== null) {
      this.finalTurnsRemaining--;
      if (this.finalTurnsRemaining <= 0) {
        this.phase = 'game-over';
        return { gameOver: true, scores: this.getScores() };
      }
    }

    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
    let attempts = 0;
    while (!this.players[nextIndex].connected && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;
    }
    this.currentPlayerIndex = nextIndex;
    this.phase = 'turn-draw';

    return { gameOver: false };
  }

  // ── Draw Deck Management ────────────────────────
  ensureDrawDeck() {
    if (this.drawDeck.length > 0) return;
    if (this.playPile.length <= 1) return;

    const topCard = this.playPile.pop();
    const reshuffled = shuffle(this.playPile);
    this.playPile = [topCard];
    this.drawDeck = reshuffled;
  }

  // ── Scoring ─────────────────────────────────────
  getScores() {
    return calculateScores(this.players, this.checkCallerIndex ?? 0);
  }

  // ── State Filtering ─────────────────────────────
  getFilteredState(playerId) {
    const viewer = this.getPlayer(playerId);
    const isActivePlayer = this.currentPlayer()?.id === playerId;
    const waitingOnQueuedPower = this.hasUnresolvedQueuedPower();
    const queueHead = waitingOnQueuedPower ? this.powerQueue[0] : null;
    const queuedPowerController = queueHead
      ? this.getPlayer(queueHead.controllerId)
      : null;

    return {
      roomId: this.roomId,
      phase: this.phase,
      currentPlayerId: this.currentPlayer()?.id,
      isMyTurn: isActivePlayer,
      myId: playerId,
      drawDeckCount: this.drawDeck.length,
      playPileTop: this.playPile.length > 0
        ? this.playPile[this.playPile.length - 1]
        : null,
      playPileCount: this.playPile.length,

      drawnCard: isActivePlayer && this.drawnCard
        ? { id: this.drawnCard.id, rank: this.drawnCard.rank, suit: this.drawnCard.suit }
        : null,
      drawnFromPlayPile: isActivePlayer && this.drawnFromPlayPile,

      players: this.players.map(p => ({
        id: p.id,
        displayName: p.displayName,
        connected: p.connected,
        hasPeeked: p.hasPeeked,
        cardCount: p.hand.length,
        hand: p.hand.map(card => ({ id: card.id })),
      })),

      checkCaller: this.checkCaller,
      finalTurnsRemaining: this.finalTurnsRemaining,

      reactionWindow: {
        active: this.reactionWindow.active,
        cardOnPile: this.reactionWindow.cardOnPile,
        hasAttempted: this.reactionWindow.attemptedPlayers.has(playerId),
        windowStart: this.reactionWindow.windowStart,
      },

      pendingStealGive: this.stealGivePending
        ? {
          reactorId: this.stealGivePending.reactorId,
          victimId: this.stealGivePending.victimId,
          victimName: this.getPlayer(this.stealGivePending.victimId)?.displayName ?? '',
          isMyGive: this.stealGivePending.reactorId === playerId,
        }
        : null,

      pendingPower: this.pendingPower
        ? {
          type: this.pendingPower.type,
          controllerId: this.pendingPower.controllerId,
          step: this.pendingPower.step,
          isMyPower: this.pendingPower.controllerId === playerId,
          peekedPosition: this.pendingPower.controllerId === playerId
            ? this.pendingPower.peekedPosition
            : undefined,
        }
        : null,

      canStartQueuedPower:
        waitingOnQueuedPower && queueHead.controllerId === playerId,
      queuedPowerControllerId: waitingOnQueuedPower ? queueHead.controllerId : null,
      queuedPowerControllerName: waitingOnQueuedPower
        ? (queuedPowerController?.displayName ?? 'Player')
        : null,

      lastEvent: this.lastEvent,
    };
  }
}

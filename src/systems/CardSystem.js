import { CARDS, CARD_WEIGHTS, CARDS_BY_RARITY } from '../data/cards.js';
import { CARD_PICK_COUNT, MAX_ACTIVE_CARDS } from '../constants.js';
import { mulberry32 } from './rng.js';

export class CardSystem {
  constructor(eventEmitter, seed) {
    this.emitter = eventEmitter;
    this.rng = mulberry32(seed ^ 0xdeadbeef);
  }

  /**
   * Pick CARD_PICK_COUNT cards for the player to choose from.
   * Avoids duplicate IDs that are already in activeCards.
   */
  pickThree(activeCards) {
    const activeIds = new Set(activeCards.map(c => c.id));
    const pool = this._buildPool(activeIds);
    const picks = [];
    const used = new Set();

    for (let i = 0; i < CARD_PICK_COUNT && pool.length > 0; i++) {
      let idx;
      let attempts = 0;
      do {
        idx = Math.floor(this.rng() * pool.length);
        attempts++;
      } while (used.has(pool[idx]) && attempts < 100);

      const cardId = pool[idx];
      used.add(cardId);
      picks.push(CARDS[cardId]);
    }

    return picks;
  }

  _buildPool(excludeIds) {
    const pool = [];
    for (const [rarity, ids] of Object.entries(CARDS_BY_RARITY)) {
      const weight = CARD_WEIGHTS[rarity];
      for (const id of ids) {
        if (!excludeIds.has(id)) {
          for (let i = 0; i < weight; i++) pool.push(id);
        }
      }
    }
    return pool;
  }

  /**
   * Activate a chosen card on the run state.
   * Returns the updated activeCards array.
   */
  activateCard(cardId, runState) {
    const card = CARDS[cardId];
    if (!card) return runState.activeCards;

    // Apply immediate effects
    if (card.duration === 'immediate') {
      card.onActivate(runState);
      runState.deck.push(cardId);
      this.emitter.emit('card:activated', { cardId, rarity: card.rarity });
      return runState.activeCards;
    }

    // Cap active cards at MAX_ACTIVE_CARDS
    if (runState.activeCards.length >= MAX_ACTIVE_CARDS) {
      // Remove oldest card to make room
      runState.activeCards.shift();
    }

    const instance = {
      id: cardId,
      name: card.name,
      rarity: card.rarity,
      duration: card.duration,
      turnsRemaining: typeof card.duration === 'number' ? card.duration : null,
    };

    card.onActivate(runState);
    runState.activeCards.push(instance);
    runState.deck.push(cardId);

    this.emitter.emit('card:activated', { cardId, rarity: card.rarity, instance });
    return runState.activeCards;
  }
}

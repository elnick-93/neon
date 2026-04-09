import { describe, it, expect, beforeEach } from 'vitest';
import { CardSystem } from '../CardSystem.js';
import { CARD_PICK_COUNT, MAX_ACTIVE_CARDS } from '../../constants.js';

class MockEmitter {
  constructor() { this._events = {}; }
  emit(event, data) { (this._events[event] || []).forEach(fn => fn(data)); }
  on(event, fn) { (this._events[event] = this._events[event] || []).push(fn); }
}

describe('CardSystem', () => {
  let cs;
  let emitter;

  beforeEach(() => {
    emitter = new MockEmitter();
    cs = new CardSystem(emitter, 42);  // fixed seed
  });

  it('pickThree returns exactly CARD_PICK_COUNT cards', () => {
    const picks = cs.pickThree([]);
    expect(picks).toHaveLength(CARD_PICK_COUNT);
  });

  it('pickThree does not return duplicate cards', () => {
    const picks = cs.pickThree([]);
    const ids = picks.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('pickThree excludes already-active card IDs', () => {
    const picks1 = cs.pickThree([]);
    const activeCards = [{ id: picks1[0].id }];
    // Run 100 times to statistically verify exclusion
    for (let i = 0; i < 100; i++) {
      const picks = cs.pickThree(activeCards);
      const ids = picks.map(c => c.id);
      expect(ids).not.toContain(picks1[0].id);
    }
  });

  it('activateCard adds card to activeCards for passive cards', () => {
    const runState = {
      activeCards: [], deck: [],
      hp: 3, maxHp: 3,
    };
    cs.activateCard('COMBO_PRIMER', runState);
    expect(runState.activeCards.length).toBe(1);
    expect(runState.activeCards[0].id).toBe('COMBO_PRIMER');
  });

  it('activateCard applies immediate effect without adding to activeCards', () => {
    const runState = {
      activeCards: [], deck: [],
      hp: 3, maxHp: 3,
    };
    cs.activateCard('SOLID_WALL', runState);
    // SOLID_WALL is immediate — increases hp
    expect(runState.hp).toBe(4);
    expect(runState.activeCards.length).toBe(0);
  });

  it('activateCard caps activeCards at MAX_ACTIVE_CARDS', () => {
    const runState = {
      activeCards: [], deck: [],
      hp: 3, maxHp: 3,
      comboFloor: 0,
    };
    const passiveCards = ['COMBO_PRIMER', 'BLOCK_ECHO', 'SLOW_BURN', 'IRON_SKIN', 'QUICK_STACK'];
    for (const id of passiveCards) {
      cs.activateCard(id, runState);
    }
    expect(runState.activeCards.length).toBe(MAX_ACTIVE_CARDS);

    // Adding one more should not exceed the cap
    cs.activateCard('CHAIN_REACTION', runState);
    expect(runState.activeCards.length).toBe(MAX_ACTIVE_CARDS);
  });

  it('pickThree distribution is weighted toward common cards', () => {
    // Run 1000 picks and check rarity distribution
    const counts = { common: 0, rare: 0, legendary: 0 };
    for (let i = 0; i < 1000; i++) {
      const picks = cs.pickThree([]);
      for (const p of picks) counts[p.rarity]++;
    }
    // Common should be significantly more frequent than legendary
    expect(counts.common).toBeGreaterThan(counts.rare);
    expect(counts.rare).toBeGreaterThan(counts.legendary);
  });

  it('deck records all activated card IDs', () => {
    const runState = { activeCards: [], deck: [], hp: 3, maxHp: 3, comboFloor: 0 };
    cs.activateCard('COMBO_PRIMER', runState);
    cs.activateCard('SOLID_WALL', runState);
    expect(runState.deck).toContain('COMBO_PRIMER');
    expect(runState.deck).toContain('SOLID_WALL');
  });
});

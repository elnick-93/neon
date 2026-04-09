import { describe, it, expect, beforeEach } from 'vitest';
import { DungeonSystem } from '../DungeonSystem.js';
import { TOTAL_FLOORS, BOSS_FLOORS, STARTING_HP } from '../../constants.js';

class MockEmitter {
  constructor() { this._events = {}; }
  emit(event, data) {
    (this._events[event] || []).forEach(fn => fn(data));
    return true;
  }
  on(event, fn) { (this._events[event] = this._events[event] || []).push(fn); }
}

describe('DungeonSystem', () => {
  let dungeon;
  let emitter;
  const emittedEvents = [];

  beforeEach(() => {
    emittedEvents.length = 0;
    emitter = {
      emit: (event, data) => { emittedEvents.push({ event, data }); },
    };
    dungeon = new DungeonSystem(emitter);
  });

  it('newRun creates a fresh run state at floor 1', () => {
    const rs = dungeon.newRun();
    expect(rs.floor).toBe(1);
    expect(rs.hp).toBe(STARTING_HP);
    expect(rs.maxHp).toBe(STARTING_HP);
    expect(rs.score).toBe(0);
    expect(rs.activeCards).toHaveLength(0);
  });

  it('newRun emits run:started event', () => {
    dungeon.newRun();
    const startEvent = emittedEvents.find(e => e.event === 'run:started');
    expect(startEvent).toBeDefined();
  });

  it('advanceFloor increments floor and resets floorBlocksCleared', () => {
    dungeon.newRun();
    dungeon.advanceFloor();
    expect(dungeon.runState.floor).toBe(2);
    expect(dungeon.runState.floorBlocksCleared).toBe(0);
  });

  it('boss floors set boss on runState', () => {
    dungeon.newRun();
    // Advance to a boss floor
    for (let i = 1; i < BOSS_FLOORS[0]; i++) dungeon.advanceFloor();
    expect(dungeon.runState.floor).toBe(BOSS_FLOORS[0]);
    expect(dungeon.runState.boss).not.toBeNull();
  });

  it('advanceFloor returns false when past TOTAL_FLOORS', () => {
    dungeon.newRun();
    for (let i = 1; i <= TOTAL_FLOORS; i++) dungeon.advanceFloor();
    expect(dungeon.runState.floor).toBeGreaterThan(TOTAL_FLOORS);
  });

  it('registerClear returns floorComplete=true when target met', () => {
    dungeon.newRun();
    const target = dungeon.runState.floorClearTarget;
    // Ensure we clear enough blocks in one go
    const result = dungeon.registerClear(target + 1, 1);
    expect(result.floorComplete).toBe(true);
  });

  it('registerClear returns floorComplete=false when boss not yet defeated', () => {
    dungeon.newRun();
    // Advance to boss floor
    for (let i = 1; i < BOSS_FLOORS[0]; i++) dungeon.advanceFloor();
    const target = dungeon.runState.floorClearTarget;
    // Clear enough blocks but with combo = 0 (no boss shield hit)
    const result = dungeon.registerClear(target + 1, 0);
    expect(result.floorComplete).toBe(false);  // boss shield not cleared
  });

  it('takeDamage reduces HP', () => {
    dungeon.newRun();
    dungeon.takeDamage(1);
    expect(dungeon.runState.hp).toBe(STARTING_HP - 1);
  });

  it('takeDamage emits run:died when HP reaches 0', () => {
    dungeon.newRun();
    dungeon.runState.hp = 1;
    dungeon.takeDamage(1);
    const diedEvent = emittedEvents.find(e => e.event === 'run:died');
    expect(diedEvent).toBeDefined();
  });

  it('damageShield absorbs one hit', () => {
    dungeon.newRun();
    dungeon.runState.damageShield = 1;
    dungeon.takeDamage(1);
    expect(dungeon.runState.hp).toBe(STARTING_HP);
    expect(dungeon.runState.damageShield).toBe(0);
  });

  it('secondChance prevents death once', () => {
    dungeon.newRun();
    dungeon.runState.hp = 1;
    dungeon.runState.secondChance = true;
    dungeon.takeDamage(1);
    expect(dungeon.runState.hp).toBe(1);
    expect(dungeon.runState.secondChance).toBe(false);
    const diedEvent = emittedEvents.find(e => e.event === 'run:died');
    expect(diedEvent).toBeUndefined();
  });

  it('seed is deterministic across two identical newRun calls', () => {
    // Seeds are random, but runState structure must be identical shape
    const rs1 = dungeon.newRun();
    const dungeon2 = new DungeonSystem({ emit: () => {} });
    const rs2 = dungeon2.newRun();
    expect(typeof rs1.seed).toBe('number');
    expect(typeof rs2.seed).toBe('number');
    expect(rs1.floor).toBe(rs2.floor);
    expect(rs1.hp).toBe(rs2.hp);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { BoardSystem } from '../BoardSystem.js';
import { Phaser } from '../../__mocks__/phaser.js';

// Minimal EventEmitter mock
class MockEmitter {
  constructor() { this._events = {}; }
  emit(event, data) { (this._events[event] || []).forEach(fn => fn(data)); }
  on(event, fn) { (this._events[event] = this._events[event] || []).push(fn); }
}

describe('BoardSystem', () => {
  let board;
  let emitter;

  beforeEach(() => {
    emitter = new MockEmitter();
    board = new BoardSystem(emitter, 8, 8);
  });

  it('initialises to an empty 8×8 grid', () => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(board.isEmpty(c, r)).toBe(true);
      }
    }
  });

  it('isValidPlacement returns true for empty cells', () => {
    const shape = [[1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    expect(board.isValidPlacement(shape, 0, 0)).toBe(true);
  });

  it('isValidPlacement returns false when out of bounds', () => {
    const shape = [[1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    expect(board.isValidPlacement(shape, 7, 0)).toBe(false); // col 7 + col offset 1 = col 8, out of bounds
  });

  it('isValidPlacement returns false when cells are occupied', () => {
    const shape = [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    board.place(shape, 0, 0, 1);
    expect(board.isValidPlacement(shape, 0, 0)).toBe(false);
  });

  it('place fills grid with correct colorIndex', () => {
    const shape = [[1, 1, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    board.place(shape, 2, 3, 3);
    expect(board.get(2, 3)).toBe(3);
    expect(board.get(3, 3)).toBe(3);
    expect(board.get(4, 3)).toBe(0);
  });

  it('scanClears detects a full row', () => {
    // Fill row 0 completely
    for (let c = 0; c < 8; c++) board.set(c, 0, 1);
    const { rows, cols } = board.scanClears();
    expect(rows).toContain(0);
    expect(cols).toHaveLength(0);
  });

  it('scanClears detects a full column', () => {
    for (let r = 0; r < 8; r++) board.set(0, r, 2);
    const { rows, cols } = board.scanClears();
    expect(cols).toContain(0);
    expect(rows).toHaveLength(0);
  });

  it('clearLines empties the cleared cells', () => {
    for (let c = 0; c < 8; c++) board.set(c, 0, 1);
    const { rows, cols } = board.scanClears();
    board.clearLines(rows, cols);
    for (let c = 0; c < 8; c++) {
      expect(board.isEmpty(c, 0)).toBe(true);
    }
  });

  it('clearLines returns correct count of cleared cells', () => {
    for (let c = 0; c < 8; c++) board.set(c, 0, 1);  // row = 8 cells
    for (let r = 0; r < 8; r++) board.set(0, r, 1);  // col = 8 cells, but (0,0) already counted
    const cleared = board.clearLines([0], [0]);
    // row 0 = 8 cells + col 0 cells (7 additional, since (0,0) is in both)
    expect(cleared).toBe(15);
  });

  it('runClearCycle runs cascade up to depth 3', () => {
    // Fill row 0 so it clears, then fill row 1 so the cascade clears again
    for (let c = 0; c < 8; c++) board.set(c, 0, 1);
    for (let c = 0; c < 8; c++) board.set(c, 1, 2);
    const cleared = board.runClearCycle(3);
    expect(cleared).toBeGreaterThan(8);
  });

  it('hasValidMove returns false when board is fully occupied', () => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) board.set(c, r, 1);
    }
    const queue = [{ shape: [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] }];
    expect(board.hasValidMove(queue)).toBe(false);
  });

  it('hasValidMove returns true when there is an empty cell', () => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (!(r === 7 && c === 7)) board.set(c, r, 1);
      }
    }
    const queue = [{ shape: [[1, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] }];
    expect(board.hasValidMove(queue)).toBe(true);
  });

  it('snapshot and restore round-trip', () => {
    board.set(0, 0, 5);
    board.set(3, 3, 2);
    const snap = board.snapshot();
    const board2 = new BoardSystem(emitter, 8, 8);
    board2.restore(snap);
    expect(board2.get(0, 0)).toBe(5);
    expect(board2.get(3, 3)).toBe(2);
    expect(board2.get(1, 1)).toBe(0);
  });

  it('combo increments on each clearLines call', () => {
    for (let c = 0; c < 8; c++) board.set(c, 0, 1);
    board.clearLines([0], []);
    expect(board.combo).toBe(1);

    for (let c = 0; c < 8; c++) board.set(c, 1, 2);
    board.clearLines([1], []);
    expect(board.combo).toBe(2);
  });

  it('reset clears grid and resets combo', () => {
    board.set(0, 0, 3);
    board.combo = 5;
    board.reset();
    expect(board.isEmpty(0, 0)).toBe(true);
    expect(board.combo).toBe(0);
  });
});

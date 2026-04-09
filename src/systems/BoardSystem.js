import { BOARD_COLS, BOARD_ROWS } from '../constants.js';

/**
 * BoardSystem — manages the 8×8 grid state, placement, line-clear, and cascades.
 * All methods are pure logic; rendering is handled by GameScene.
 */
export class BoardSystem {
  constructor(eventEmitter, cols = BOARD_COLS, rows = BOARD_ROWS) {
    this.emitter = eventEmitter;
    this.cols = cols;
    this.rows = rows;
    // 0 = empty; values 1-7 map to NEON_COLORS index
    this.grid = new Uint8Array(cols * rows);
    this.combo = 0;
  }

  idx(col, row) {
    return row * this.cols + col;
  }

  get(col, row) {
    return this.grid[this.idx(col, row)];
  }

  set(col, row, value) {
    this.grid[this.idx(col, row)] = value;
  }

  isEmpty(col, row) {
    return this.get(col, row) === 0;
  }

  /** Snapshot grid as plain array for storage */
  snapshot() {
    return Array.from(this.grid);
  }

  /** Restore grid from stored snapshot */
  restore(data) {
    this.grid = new Uint8Array(data);
  }

  /** Reset grid to all-empty */
  reset() {
    this.grid.fill(0);
    this.combo = 0;
  }

  /**
   * Check if the given shape (2D array) can be placed at (col, row).
   * shape is a 4×4 bitmask.
   */
  isValidPlacement(shape, originCol, originRow) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gc = originCol + c;
        const gr = originRow + r;
        if (gc < 0 || gc >= this.cols || gr < 0 || gr >= this.rows) return false;
        if (!this.isEmpty(gc, gr)) return false;
      }
    }
    return true;
  }

  /**
   * Place a shape at (col, row). colorIndex 1-7.
   * Returns list of [gc, gr] cells placed.
   */
  place(shape, originCol, originRow, colorIndex) {
    const placed = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const gc = originCol + c;
        const gr = originRow + r;
        this.set(gc, gr, colorIndex);
        placed.push([gc, gr]);
      }
    }
    this.emitter.emit('block:placed', { cells: placed, colorIndex });
    return placed;
  }

  /**
   * Scan for full rows and columns. Returns { rows: [], cols: [] }.
   */
  scanClears() {
    const fullRows = [];
    const fullCols = [];

    for (let r = 0; r < this.rows; r++) {
      let full = true;
      for (let c = 0; c < this.cols; c++) {
        if (this.isEmpty(c, r)) { full = false; break; }
      }
      if (full) fullRows.push(r);
    }

    for (let c = 0; c < this.cols; c++) {
      let full = true;
      for (let r = 0; r < this.rows; r++) {
        if (this.isEmpty(c, r)) { full = false; break; }
      }
      if (full) fullCols.push(c);
    }

    return { rows: fullRows, cols: fullCols };
  }

  /**
   * Clear specified rows and columns. Returns count of cells cleared.
   */
  clearLines(rows, cols) {
    const clearedCells = new Set();

    for (const r of rows) {
      for (let c = 0; c < this.cols; c++) {
        clearedCells.add(this.idx(c, r));
      }
    }
    for (const c of cols) {
      for (let r = 0; r < this.rows; r++) {
        clearedCells.add(this.idx(c, r));
      }
    }

    for (const i of clearedCells) {
      this.grid[i] = 0;
    }

    this.combo++;
    const cleared = clearedCells.size;
    this.emitter.emit('board:cleared', { rows, cols, combo: this.combo, cleared });
    return cleared;
  }

  /**
   * Apply gravity: floating blocks fall down. No-op for this block-blast variant
   * since all pieces are placed from the top and don't rely on gravity.
   * We keep this as a hook for future board modifier cards.
   */
  applyGravity() {
    // Block Blast variant: gravity not required for base mechanic.
    // Modifier cards (GRID_SHRINK etc.) may invoke this.
  }

  /**
   * Run the full clear+cascade cycle after a piece placement.
   * Returns total blocks cleared across all cascades.
   */
  runClearCycle(maxCascadeDepth = 3) {
    let totalCleared = 0;
    let depth = 0;

    while (depth < maxCascadeDepth) {
      const { rows, cols } = this.scanClears();
      if (rows.length === 0 && cols.length === 0) break;

      totalCleared += this.clearLines(rows, cols);
      this.applyGravity();
      depth++;

      if (depth > 1) {
        this.emitter.emit('board:cascade', { depth });
      }
    }

    if (totalCleared === 0) {
      // No clear — reset combo
      this.combo = 0;
    }

    return totalCleared;
  }

  /**
   * Check if there is any valid placement for ANY rotation of ANY piece in pieceQueue.
   * pieceQueue: array of { shape } objects.
   */
  hasValidMove(pieceQueue) {
    for (const piece of pieceQueue) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.isValidPlacement(piece.shape, c, r)) return true;
        }
      }
    }
    return false;
  }

  /**
   * Place locked (immovable) cells for boss mechanics. colorIndex 8 = locked.
   */
  placeLocked(positions) {
    for (const [c, r] of positions) {
      this.set(c, r, 8);
    }
  }

  isLocked(col, row) {
    return this.get(col, row) === 8;
  }

  /** Generate N random locked positions (for boss LOCKED_CELLS mechanic) */
  randomLockedPositions(count, rng) {
    const empty = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.isEmpty(c, r)) empty.push([c, r]);
      }
    }
    const shuffled = empty.sort(() => rng() - 0.5);
    return shuffled.slice(0, count);
  }
}

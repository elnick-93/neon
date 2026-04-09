import { BLOCK_SHAPES, ALL_PIECE_IDS, randomRotation } from '../data/blocks.js';
import { mulberry32 } from './rng.js';

/**
 * BlockSystem — manages the piece queue, rotation state, and drag input.
 * Rendering is handled by GameScene using the data this system exposes.
 */
export class BlockSystem {
  constructor(eventEmitter, seed, queueSize = 3) {
    this.emitter = eventEmitter;
    this.queueSize = queueSize;
    this.rng = mulberry32(seed);
    this.queue = [];
    this._fillQueue();
  }

  _randomPiece() {
    const id = ALL_PIECE_IDS[Math.floor(this.rng() * ALL_PIECE_IDS.length)];
    const def = BLOCK_SHAPES[id];
    const rotIdx = randomRotation(id, this.rng);
    return {
      id,
      shape: def.shapes[rotIdx],
      color: def.color,
      rotIdx,
    };
  }

  _fillQueue() {
    while (this.queue.length < this.queueSize) {
      this.queue.push(this._randomPiece());
    }
  }

  /** Return the current piece queue (read-only view) */
  getQueue() {
    return this.queue;
  }

  /** Consume the piece at queueIndex, refill queue. Returns the consumed piece. */
  consumePiece(queueIndex = 0) {
    const piece = this.queue.splice(queueIndex, 1)[0];
    this._fillQueue();
    this.emitter.emit('queue:updated', { queue: this.queue });
    return piece;
  }

  /** Replace current queue with fresh random pieces (shuffle boost) */
  refreshQueue() {
    this.queue = [];
    this._fillQueue();
    this.emitter.emit('queue:refreshed', { queue: this.queue });
  }

  /** Serialise queue for storage */
  snapshotQueue() {
    return this.queue.map(p => ({ id: p.id, rotIdx: p.rotIdx }));
  }

  /** Restore queue from snapshot */
  restoreQueue(data) {
    this.queue = data.map(({ id, rotIdx }) => {
      const def = BLOCK_SHAPES[id];
      return { id, shape: def.shapes[rotIdx], color: def.color, rotIdx };
    });
  }
}

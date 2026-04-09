import { SCORE_PER_BLOCK, COMBO_MULTIPLIERS } from '../constants.js';

export class ScoreSystem {
  constructor(eventEmitter) {
    this.emitter = eventEmitter;
    this.score = 0;
    this.highScore = 0;
  }

  reset() {
    this.score = 0;
  }

  /**
   * Award score for a clear event.
   * cleared: number of cells cleared
   * combo: current combo depth
   * runState: for card modifiers (overdriveActive, stormTurns, etc.)
   */
  awardClear(cleared, combo, runState) {
    const comboIdx = Math.min(combo - 1, COMBO_MULTIPLIERS.length - 1);
    let multiplier = COMBO_MULTIPLIERS[Math.max(0, comboIdx)];

    // Card modifiers
    if (runState.scoreMultiplier) {
      multiplier *= runState.scoreMultiplier;
      runState.scoreMultiplier = null;
    }
    if (runState.stormTurns > 0) {
      multiplier *= 2;
    }
    if (runState.overdriveActive) {
      multiplier *= runState.floor;
    }

    const gain = Math.round(cleared * SCORE_PER_BLOCK * multiplier);
    this.score += gain;
    if (this.score > this.highScore) this.highScore = this.score;

    this.emitter.emit('score:updated', { score: this.score, gain, multiplier });
    return gain;
  }

  awardBonus(amount, label) {
    this.score += amount;
    this.emitter.emit('score:bonus', { score: this.score, amount, label });
  }
}

import {
  TOTAL_FLOORS, BOSS_FLOORS, BASE_CLEAR_TARGET, CLEAR_TARGET_STEP,
  STARTING_HP, XP_PER_FLOOR, XP_PER_COMBO,
} from '../constants.js';
import { getBossForFloor } from '../data/bosses.js';
import { randomSeed } from './rng.js';

export class DungeonSystem {
  constructor(eventEmitter) {
    this.emitter = eventEmitter;
    this.runState = null;
  }

  /** Start a new run. Returns the initial RunState. */
  newRun() {
    this.runState = {
      seed: randomSeed(),
      floor: 1,
      hp: STARTING_HP,
      maxHp: STARTING_HP,
      score: 0,
      combo: 0,
      blocksCleared: 0,
      floorBlocksCleared: 0,
      floorClearTarget: BASE_CLEAR_TARGET + CLEAR_TARGET_STEP,
      activeCards: [],
      deck: [],
      boardState: null,
      pieceQueue: null,
      floorModifier: null,
      boss: null,
      bossShieldRemaining: 0,
      bossDefeated: false,
      // Card state flags
      scoreMultiplier: null,
      freeRefresh: false,
      echoPiece: false,
      shatterPiece: false,
      voidPieces: 0,
      secondChance: false,
      damageShield: 0,
      comboFloor: 0,
      comboLocked: false,
      cascadeAsCombo: false,
      overdriveActive: false,
      phantomGrid: false,
      hyperCascade: false,
      bossBane: false,
      echoBlast: false,
      infiniteCombo: false,
      timeWarpCharges: 0,
      stormTurns: 0,
      voidFillCount: 0,
      boardNuke: false,
      boardShrink: 0,
      queueSize: 3,
      cascadeComboBonus: false,
    };

    this._applyFloorModifier();
    this.emitter.emit('run:started', { runState: this.runState });
    return this.runState;
  }

  /** Advance to the next floor. Returns false if run complete. */
  advanceFloor() {
    const rs = this.runState;
    if (!rs) return false;

    rs.floor++;
    rs.floorBlocksCleared = 0;
    rs.floorClearTarget = BASE_CLEAR_TARGET + rs.floor * CLEAR_TARGET_STEP;
    rs.combo = 0;
    rs.boss = null;
    rs.bossShieldRemaining = 0;
    rs.bossDefeated = false;
    rs.floorModifier = null;

    // Tick card durations
    rs.activeCards = rs.activeCards.filter(card => {
      if (typeof card.turnsRemaining === 'number') {
        card.turnsRemaining--;
        return card.turnsRemaining > 0;
      }
      return card.duration === 'permanent' || card.duration === 'passive';
    });

    // Decrement storm turns
    if (rs.stormTurns > 0) rs.stormTurns--;

    if (rs.floor > TOTAL_FLOORS) {
      this.emitter.emit('run:complete', { runState: rs });
      return false;
    }

    this._applyFloorModifier();
    this.emitter.emit('dungeon:floorAdvanced', { floor: rs.floor, runState: rs });
    return true;
  }

  _applyFloorModifier() {
    const rs = this.runState;
    if (BOSS_FLOORS.includes(rs.floor)) {
      const boss = getBossForFloor(rs.floor);
      rs.boss = boss;
      rs.floorModifier = boss ? boss.mechanic : null;
      let shieldCombos = boss ? boss.shieldCombos : 0;
      if (rs.bossBane) { shieldCombos = Math.ceil(shieldCombos / 2); rs.bossBane = false; }
      rs.bossShieldRemaining = shieldCombos;
      this.emitter.emit('dungeon:bossAppeared', { boss, floor: rs.floor });
    }
  }

  /** Register a clear. Returns { xpGained, floorComplete, bossHit } */
  registerClear(blocksCleared, combo) {
    const rs = this.runState;
    rs.blocksCleared += blocksCleared;
    rs.floorBlocksCleared += blocksCleared;

    let bossHit = false;
    if (rs.boss && !rs.bossDefeated && rs.bossShieldRemaining > 0 && combo >= 1) {
      rs.bossShieldRemaining--;
      bossHit = true;
      if (rs.bossShieldRemaining <= 0) {
        rs.bossDefeated = true;
        this.emitter.emit('dungeon:bossDefeated', { floor: rs.floor });
      }
    }

    const xpGained = XP_PER_FLOOR + combo * XP_PER_COMBO;
    const floorComplete = rs.floorBlocksCleared >= rs.floorClearTarget
      && (!rs.boss || rs.bossDefeated);

    if (floorComplete) {
      this.emitter.emit('dungeon:floorComplete', { floor: rs.floor, runState: rs });
    }

    return { xpGained, floorComplete, bossHit };
  }

  /** Take damage (e.g., board full, speed trial expired) */
  takeDamage(amount = 1) {
    const rs = this.runState;
    if (rs.damageShield > 0) {
      rs.damageShield--;
      this.emitter.emit('run:shieldAbsorbed', {});
      return;
    }
    rs.hp = Math.max(0, rs.hp - amount);
    this.emitter.emit('run:hp', { current: rs.hp, max: rs.maxHp });
    if (rs.hp <= 0) {
      if (rs.secondChance) {
        rs.secondChance = false;
        rs.hp = 1;
        this.emitter.emit('run:secondChance', {});
      } else {
        this.emitter.emit('run:died', { runState: rs });
      }
    }
  }

  isBossFloor() {
    return this.runState && BOSS_FLOORS.includes(this.runState.floor);
  }

  isRunActive() {
    return this.runState !== null && this.runState.hp > 0;
  }
}

import {
  STAT_MAX, STAT_CRIT,
  PLAY_HAPPINESS_PER_STAR, PLAY_ENERGY_COST,
} from '../constants.js';
import { FOODS } from '../data/foods.js';

/**
 * PetSystem — all mutations to pet stat state.
 *
 * All methods take the current petState and return a NEW petState object.
 * No side effects. The scene layer calls these and persists the result.
 */
export class PetSystem {
  // ── Factory ────────────────────────────────────────────────────────────────

  /**
   * Create a brand-new pet state.
   * @param {string} speciesId  - 'lumie' | 'sparky' | 'blossy'
   * @param {string} name       - player-given name
   */
  static createPet(speciesId, name) {
    return {
      speciesId,
      name,
      stage: 0,          // 0=egg, 1=baby, 2=child, 3=teen, 4=adult
      evolutionId: null, // current evolution node ID (null while egg)
      hunger:      100,
      happiness:   100,
      cleanliness: 100,
      energy:      100,
      health:      100,
      ageMs:       0,    // total milliseconds of real time alive
      lastSeenTs:  Date.now(),
      sleeping:    false,
      // Care tracking for evolution path
      totalFeedings:      0,
      totalPlaySessions:  0,
      totalSleepSessions: 0,
      careScore:          100,   // 0–100, rolling care quality
      careEvents:         [],    // last 20 care events for scoring
      // Food cooldowns: { foodId: expiryTimestamp }
      foodCooldowns: {},
      // Accessories
      equippedHat:    null,
      equippedBg:     'bg_pastel',
      equippedEffect: null,
      // Meta
      isAlive:   true,
      createdAt: Date.now(),
    };
  }

  // ── Feeding ────────────────────────────────────────────────────────────────

  /**
   * Feed the pet a food item.
   * @returns {{ pet, blocked: boolean, reason?: string }}
   */
  static feed(pet, foodId) {
    const food = FOODS[foodId];
    if (!food) return { pet, blocked: true, reason: 'Unknown food' };

    // Check cooldown
    const cooldownExpiry = pet.foodCooldowns[foodId] ?? 0;
    if (Date.now() < cooldownExpiry) {
      return { pet, blocked: true, reason: 'On cooldown' };
    }

    const next = { ...pet };
    next.hunger      = clamp(pet.hunger      + food.hunger,    0, STAT_MAX);
    next.happiness   = clamp(pet.happiness   + (food.happiness ?? 0), 0, STAT_MAX);
    next.health      = clamp(pet.health      + (food.health    ?? 0), 0, STAT_MAX);
    next.totalFeedings++;

    // Update cooldown
    if (food.cooldownMs > 0) {
      next.foodCooldowns = { ...pet.foodCooldowns, [foodId]: Date.now() + food.cooldownMs };
    }

    next.careScore = updateCareScore(pet.careScore, food.careBonus ?? 0.5);
    next.careEvents = addCareEvent(pet.careEvents, 'feed');

    return { pet: next, blocked: false };
  }

  // ── Playing ────────────────────────────────────────────────────────────────

  /**
   * Register the result of a play session.
   * @param {number} starsHit  - how many stars the player caught
   * @param {number} totalStars - total stars spawned
   */
  static afterPlay(pet, starsHit, totalStars) {
    const happinessGain = starsHit * PLAY_HAPPINESS_PER_STAR;
    const perfect = starsHit === totalStars;
    const bonus = perfect ? 15 : 0;

    const next = { ...pet };
    next.happiness  = clamp(pet.happiness + happinessGain + bonus, 0, STAT_MAX);
    next.energy     = clamp(pet.energy    - PLAY_ENERGY_COST, 0, STAT_MAX);
    next.totalPlaySessions++;
    next.careScore  = updateCareScore(pet.careScore, perfect ? 2 : 1);
    next.careEvents = addCareEvent(pet.careEvents, 'play');

    return next;
  }

  // ── Cleaning ───────────────────────────────────────────────────────────────

  static clean(pet) {
    const next = { ...pet };
    next.cleanliness = STAT_MAX;
    next.happiness   = clamp(pet.happiness + 5, 0, STAT_MAX);
    next.careScore   = updateCareScore(pet.careScore, 0.5);
    next.careEvents  = addCareEvent(pet.careEvents, 'clean');
    return next;
  }

  // ── Sleep ──────────────────────────────────────────────────────────────────

  static setSleeping(pet, sleeping) {
    const next = { ...pet, sleeping };
    if (sleeping) {
      next.totalSleepSessions++;
      next.careEvents = addCareEvent(pet.careEvents, 'sleep');
    }
    return next;
  }

  /**
   * Apply passive energy recovery during sleep.
   * Called by TimeSystem when pet.sleeping === true.
   * @param {object} pet
   * @param {number} hours - hours elapsed while sleeping
   */
  static applySleepRecovery(pet, hours) {
    const ENERGY_RECOVER_PER_HOUR = 20;
    return { ...pet, energy: clamp(pet.energy + ENERGY_RECOVER_PER_HOUR * hours, 0, STAT_MAX) };
  }

  // ── Hatch ──────────────────────────────────────────────────────────────────

  /** Transition from egg (stage 0) to baby (stage 1). */
  static hatch(pet) {
    return {
      ...pet,
      stage: 1,
      evolutionId: 'baby',
      hunger:      80,
      happiness:   80,
      cleanliness: 100,
      energy:      90,
      health:      100,
    };
  }

  // ── Evolution ──────────────────────────────────────────────────────────────

  /** Apply an evolution to the pet. Called by EvolutionSystem after determining the target. */
  static evolve(pet, evolutionId) {
    return {
      ...pet,
      stage:       pet.stage + 1,
      evolutionId,
      // Small stat boost on evolution
      hunger:      clamp(pet.hunger + 20, 0, STAT_MAX),
      happiness:   clamp(pet.happiness + 20, 0, STAT_MAX),
      health:      clamp(pet.health + 10, 0, STAT_MAX),
    };
  }

  // ── Death ──────────────────────────────────────────────────────────────────

  static kill(pet) {
    return { ...pet, isAlive: false };
  }

  static revive(pet) {
    return {
      ...pet,
      isAlive:     true,
      health:      100,
      hunger:      80,
      happiness:   80,
      cleanliness: 100,
      energy:      80,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  static isCritical(pet) {
    return pet.hunger < STAT_CRIT || pet.happiness < STAT_CRIT || pet.health < STAT_CRIT;
  }

  static dominantCareType(pet) {
    const f = pet.totalFeedings;
    const p = pet.totalPlaySessions;
    const s = pet.totalSleepSessions;
    const total = f + p + s;
    if (total === 0) return 'balanced';
    const fPct = f / total;
    const pPct = p / total;
    const sPct = s / total;
    if (fPct > 0.55) return 'feeding_dominant';
    if (pPct > 0.55) return 'play_dominant';
    if (sPct > 0.45) return 'sleep_dominant';
    return 'balanced';
  }
}

// ── Private helpers ────────────────────────────────────────────────────────────

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/** Rolling care score: blend current with new event bonus (EMA-style). */
function updateCareScore(current, bonus) {
  // Each care action can add 0–5 to careScore. Cap at 100.
  return Math.min(100, current + bonus * 0.5);
}

/** Maintain a rolling window of the last 20 care events. */
function addCareEvent(events, type) {
  const updated = [...events, { type, ts: Date.now() }];
  return updated.slice(-20);
}

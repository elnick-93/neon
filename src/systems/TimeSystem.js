import {
  STAT_MAX, STAT_CRIT,
  DECAY_HUNGER, DECAY_HAPPINESS, DECAY_CLEANLINESS, DECAY_ENERGY,
  HEALTH_PENALTY_PER_CRIT_HOUR,
} from '../constants.js';

/**
 * TimeSystem — pure, side-effect-free stat decay calculator.
 *
 * Called once on app resume with (petState, elapsedMs).
 * Returns a new petState with stats adjusted for elapsed real time.
 * Does NOT mutate input.
 */
export class TimeSystem {
  /**
   * Apply real-time decay to petState.
   * @param {object} pet  - current pet state (immutable input)
   * @param {number} elapsedMs - milliseconds since last seen
   * @param {boolean} hotelActive - if true, skip stat decay (Pet Hotel subscription)
   * @returns {{ pet: object, critHours: number, died: boolean }}
   */
  static applyDecay(pet, elapsedMs, hotelActive = false) {
    if (elapsedMs <= 0 || pet.stage === 0) {
      // Egg stage: no stats yet, just age
      return { pet: { ...pet, ageMs: pet.ageMs + elapsedMs }, critHours: 0, died: false };
    }

    const hours = elapsedMs / 3_600_000;

    // Pet Hotel freezes decay
    if (hotelActive) {
      return { pet: { ...pet, ageMs: pet.ageMs + elapsedMs }, critHours: 0, died: false };
    }

    const next = { ...pet, ageMs: pet.ageMs + elapsedMs };

    next.hunger      = clamp(pet.hunger      - DECAY_HUNGER      * hours, 0, STAT_MAX);
    next.happiness   = clamp(pet.happiness   - DECAY_HAPPINESS   * hours, 0, STAT_MAX);
    next.cleanliness = clamp(pet.cleanliness - DECAY_CLEANLINESS * hours, 0, STAT_MAX);
    next.energy      = clamp(pet.energy      - DECAY_ENERGY      * hours, 0, STAT_MAX);

    // Count how many critical stats there were and for how long
    const critStats = [
      pet.hunger, pet.happiness, pet.cleanliness,
    ].filter(v => v < STAT_CRIT).length;

    // Average critical exposure across the elapsed period
    // (conservative: assume crit the entire time if it was crit at last snapshot)
    const critHours = critStats > 0 ? hours : 0;

    // Health degradation from neglect
    const healthPenalty = critHours * HEALTH_PENALTY_PER_CRIT_HOUR * critStats;
    next.health = clamp(pet.health - healthPenalty, 0, STAT_MAX);

    const died = next.health <= 0;

    return { pet: next, critHours, died };
  }

  /**
   * Calculate when to fire the next "hunger low" notification.
   * Returns the Date the hunger stat will cross STAT_CRIT,
   * or null if already below threshold.
   * @param {object} pet
   * @returns {Date|null}
   */
  static nextHungerCritTime(pet) {
    if (pet.hunger <= STAT_CRIT) return null;
    const hoursUntilCrit = (pet.hunger - STAT_CRIT) / DECAY_HUNGER;
    return new Date(Date.now() + hoursUntilCrit * 3_600_000);
  }

  static nextHappinessCritTime(pet) {
    if (pet.happiness <= STAT_CRIT) return null;
    const h = (pet.happiness - STAT_CRIT) / DECAY_HAPPINESS;
    return new Date(Date.now() + h * 3_600_000);
  }

  /**
   * Hours of real time until the next evolution stage threshold.
   * Returns null if already at max stage (4).
   */
  static hoursUntilNextStage(pet) {
    // Stage thresholds in hours, indexed by stage number
    const thresholds = [0, 0, 24, 72, 168];
    const nextThreshold = thresholds[pet.stage + 1];
    if (!nextThreshold) return null;
    const ageHours = pet.ageMs / 3_600_000;
    return Math.max(0, nextThreshold - ageHours);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

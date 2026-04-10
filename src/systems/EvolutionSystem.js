import {
  EGG_HATCH_MINUTES,
  STAGE_CHILD_HOURS, STAGE_TEEN_HOURS, STAGE_ADULT_HOURS,
  CARE_PERFECT, CARE_GOOD,
} from '../constants.js';
import { EVOLUTIONS } from '../data/pets.js';
import { PetSystem } from './PetSystem.js';

/**
 * EvolutionSystem — pure logic for determining when and how a pet evolves.
 * All methods are static and side-effect-free.
 */
export class EvolutionSystem {
  /**
   * Check whether the pet should evolve right now.
   * @param {object} pet
   * @returns {{ shouldEvolve: boolean, targetId?: string }}
   */
  static check(pet) {
    if (!pet.isAlive) return { shouldEvolve: false };

    const ageMs    = pet.ageMs;
    const ageHours = ageMs / 3_600_000;

    switch (pet.stage) {
      case 0: {
        // Egg → Baby after EGG_HATCH_MINUTES minutes
        const readyMs = EGG_HATCH_MINUTES * 60 * 1000;
        if (ageMs >= readyMs) return { shouldEvolve: true, targetId: 'baby' };
        break;
      }
      case 1:
        if (ageHours >= STAGE_CHILD_HOURS) {
          return { shouldEvolve: true, targetId: EvolutionSystem.pickChild(pet) };
        }
        break;
      case 2:
        if (ageHours >= STAGE_TEEN_HOURS) {
          return { shouldEvolve: true, targetId: EvolutionSystem.pickTeen(pet) };
        }
        break;
      case 3:
        if (ageHours >= STAGE_ADULT_HOURS) {
          return { shouldEvolve: true, targetId: EvolutionSystem.pickAdult(pet) };
        }
        break;
      default:
        break;
    }

    return { shouldEvolve: false };
  }

  // ── Stage 2: Child ────────────────────────────────────────────────────────

  static pickChild(pet) {
    const dominant = PetSystem.dominantCareType(pet);
    if (dominant === 'feeding_dominant') return 'puffi';
    return 'zippi';  // play_dominant, sleep_dominant, balanced → zippi
  }

  // ── Stage 3: Teen ─────────────────────────────────────────────────────────

  static pickTeen(pet) {
    const dominant = PetSystem.dominantCareType(pet);
    const current  = pet.evolutionId;

    if (current === 'puffi') {
      return dominant === 'balanced' ? 'snuggi' : 'fluffi';
    }
    if (current === 'zippi') {
      return dominant === 'sleep_dominant' ? 'dazzi' : 'sparki_teen';
    }
    return 'fluffi'; // fallback
  }

  // ── Stage 4: Adult ────────────────────────────────────────────────────────

  static pickAdult(pet) {
    const care    = pet.careScore;
    const current = pet.evolutionId;
    const dominant = PetSystem.dominantCareType(pet);

    const isPerfect = care >= CARE_PERFECT;
    const isGood    = care >= CARE_GOOD;

    switch (current) {
      case 'fluffi':
        return isPerfect ? 'lumara' : 'cozyra';
      case 'snuggi':
        return isGood ? 'dreamra' : 'cozyra';
      case 'sparki_teen':
        return isGood && dominant === 'play_dominant' ? 'blazra' : 'calmra';
      case 'dazzi':
        return isPerfect ? 'starra' : 'calmra';
      default:
        return 'cozyra'; // safe fallback
    }
  }

  /**
   * Minutes remaining until the pet is ready to hatch (stage 0 only).
   * Returns 0 if already past threshold.
   */
  static minutesUntilHatch(pet) {
    if (pet.stage !== 0) return 0;
    const targetMs = EGG_HATCH_MINUTES * 60 * 1000;
    return Math.max(0, (targetMs - pet.ageMs) / 60_000);
  }

  /**
   * Progress fraction toward the next evolution (0→1).
   */
  static evolutionProgress(pet) {
    const ageHours = pet.ageMs / 3_600_000;
    switch (pet.stage) {
      case 0: {
        const targetMin = EGG_HATCH_MINUTES;
        return Math.min(1, (pet.ageMs / 60_000) / targetMin);
      }
      case 1: return Math.min(1, ageHours / STAGE_CHILD_HOURS);
      case 2: return Math.min(1, ageHours / STAGE_TEEN_HOURS);
      case 3: return Math.min(1, ageHours / STAGE_ADULT_HOURS);
      default: return 1;
    }
  }

  /** Human-readable label for the evolution the pet is heading toward. */
  static predictNextEvolution(pet) {
    if (pet.stage >= 4) return null;
    if (pet.stage === 0) return 'Baby';
    if (pet.stage === 1) {
      const childId = EvolutionSystem.pickChild(pet);
      return EVOLUTIONS[childId]?.name ?? '???';
    }
    if (pet.stage === 2) {
      const teenId = EvolutionSystem.pickTeen(pet);
      return EVOLUTIONS[teenId]?.name ?? '???';
    }
    // Stage 3 → show rarity hint, not name (maintain mystery)
    const adultId = EvolutionSystem.pickAdult(pet);
    const evo = EVOLUTIONS[adultId];
    if (!evo) return '???';
    return evo.rarity === 'legendary' ? '??? (Legendary!)' : `??? (${evo.rarity})`;
  }
}

import { describe, it, expect } from 'vitest';
import { EvolutionSystem } from '../EvolutionSystem.js';
import { PetSystem } from '../PetSystem.js';
import {
  EGG_HATCH_MINUTES,
  STAGE_CHILD_HOURS, STAGE_TEEN_HOURS, STAGE_ADULT_HOURS,
  CARE_PERFECT, CARE_GOOD,
} from '../../constants.js';

const ONE_HOUR_MS = 3_600_000;

function pet(stage, ageMs, evolutionId, overrides = {}) {
  return {
    ...PetSystem.createPet('lumie', 'T'),
    stage,
    ageMs,
    evolutionId,
    isAlive: true,
    totalFeedings: 0,
    totalPlaySessions: 0,
    totalSleepSessions: 0,
    careScore: 100,
    ...overrides,
  };
}

// ── check ─────────────────────────────────────────────────────────────────────

describe('EvolutionSystem.check', () => {
  it('does not evolve dead pets', () => {
    const p = { ...pet(1, 30 * ONE_HOUR_MS, 'baby'), isAlive: false };
    expect(EvolutionSystem.check(p).shouldEvolve).toBe(false);
  });

  it('hatches egg after EGG_HATCH_MINUTES', () => {
    const readyMs = EGG_HATCH_MINUTES * 60 * 1000;
    const p = pet(0, readyMs, null);
    const result = EvolutionSystem.check(p);
    expect(result.shouldEvolve).toBe(true);
    expect(result.targetId).toBe('baby');
  });

  it('does not hatch egg before threshold', () => {
    const p = pet(0, (EGG_HATCH_MINUTES - 1) * 60 * 1000, null);
    expect(EvolutionSystem.check(p).shouldEvolve).toBe(false);
  });

  it('evolves baby → child after STAGE_CHILD_HOURS', () => {
    const p = pet(1, STAGE_CHILD_HOURS * ONE_HOUR_MS, 'baby');
    const result = EvolutionSystem.check(p);
    expect(result.shouldEvolve).toBe(true);
    expect(['puffi', 'zippi']).toContain(result.targetId);
  });

  it('does not evolve baby before STAGE_CHILD_HOURS', () => {
    const p = pet(1, (STAGE_CHILD_HOURS - 1) * ONE_HOUR_MS, 'baby');
    expect(EvolutionSystem.check(p).shouldEvolve).toBe(false);
  });

  it('evolves child → teen after STAGE_TEEN_HOURS', () => {
    const p = pet(2, STAGE_TEEN_HOURS * ONE_HOUR_MS, 'puffi');
    const result = EvolutionSystem.check(p);
    expect(result.shouldEvolve).toBe(true);
  });

  it('evolves teen → adult after STAGE_ADULT_HOURS', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'fluffi');
    const result = EvolutionSystem.check(p);
    expect(result.shouldEvolve).toBe(true);
  });

  it('does not evolve adult (stage 4)', () => {
    const p = pet(4, 999 * ONE_HOUR_MS, 'lumara');
    expect(EvolutionSystem.check(p).shouldEvolve).toBe(false);
  });
});

// ── pickChild ─────────────────────────────────────────────────────────────────

describe('EvolutionSystem.pickChild', () => {
  it('returns puffi when feedings dominate', () => {
    const p = pet(1, STAGE_CHILD_HOURS * ONE_HOUR_MS, 'baby', {
      totalFeedings: 10, totalPlaySessions: 2, totalSleepSessions: 2,
    });
    expect(EvolutionSystem.pickChild(p)).toBe('puffi');
  });

  it('returns zippi when play dominates', () => {
    const p = pet(1, STAGE_CHILD_HOURS * ONE_HOUR_MS, 'baby', {
      totalFeedings: 2, totalPlaySessions: 10, totalSleepSessions: 2,
    });
    expect(EvolutionSystem.pickChild(p)).toBe('zippi');
  });

  it('returns zippi when balanced', () => {
    const p = pet(1, STAGE_CHILD_HOURS * ONE_HOUR_MS, 'baby', {
      totalFeedings: 0, totalPlaySessions: 0, totalSleepSessions: 0,
    });
    expect(EvolutionSystem.pickChild(p)).toBe('zippi');
  });
});

// ── pickTeen ──────────────────────────────────────────────────────────────────

describe('EvolutionSystem.pickTeen', () => {
  it('puffi + balanced → snuggi', () => {
    const p = pet(2, STAGE_TEEN_HOURS * ONE_HOUR_MS, 'puffi');
    expect(EvolutionSystem.pickTeen(p)).toBe('snuggi');
  });

  it('puffi + feeding_dominant → fluffi', () => {
    const p = pet(2, STAGE_TEEN_HOURS * ONE_HOUR_MS, 'puffi', {
      totalFeedings: 10, totalPlaySessions: 2, totalSleepSessions: 2,
    });
    expect(EvolutionSystem.pickTeen(p)).toBe('fluffi');
  });

  it('zippi + sleep_dominant → dazzi', () => {
    const p = pet(2, STAGE_TEEN_HOURS * ONE_HOUR_MS, 'zippi', {
      totalFeedings: 2, totalPlaySessions: 3, totalSleepSessions: 5,
    });
    expect(EvolutionSystem.pickTeen(p)).toBe('dazzi');
  });

  it('zippi + play_dominant → sparki_teen', () => {
    const p = pet(2, STAGE_TEEN_HOURS * ONE_HOUR_MS, 'zippi', {
      totalFeedings: 2, totalPlaySessions: 10, totalSleepSessions: 2,
    });
    expect(EvolutionSystem.pickTeen(p)).toBe('sparki_teen');
  });
});

// ── pickAdult ─────────────────────────────────────────────────────────────────

describe('EvolutionSystem.pickAdult', () => {
  it('fluffi + perfect care → lumara (legendary)', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'fluffi', { careScore: CARE_PERFECT });
    expect(EvolutionSystem.pickAdult(p)).toBe('lumara');
  });

  it('fluffi + poor care → cozyra (common)', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'fluffi', { careScore: CARE_GOOD - 10 });
    expect(EvolutionSystem.pickAdult(p)).toBe('cozyra');
  });

  it('snuggi + good care → dreamra', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'snuggi', { careScore: CARE_GOOD });
    expect(EvolutionSystem.pickAdult(p)).toBe('dreamra');
  });

  it('dazzi + perfect care → starra (legendary)', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'dazzi', { careScore: CARE_PERFECT });
    expect(EvolutionSystem.pickAdult(p)).toBe('starra');
  });

  it('dazzi + average care → calmra', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'dazzi', { careScore: CARE_GOOD - 10 });
    expect(EvolutionSystem.pickAdult(p)).toBe('calmra');
  });

  it('sparki_teen + play_dominant + good care → blazra', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'sparki_teen', {
      careScore: CARE_GOOD,
      totalFeedings: 2, totalPlaySessions: 10, totalSleepSessions: 2,
    });
    expect(EvolutionSystem.pickAdult(p)).toBe('blazra');
  });

  it('unknown evolutionId falls back to cozyra', () => {
    const p = pet(3, STAGE_ADULT_HOURS * ONE_HOUR_MS, 'unknown_form');
    expect(EvolutionSystem.pickAdult(p)).toBe('cozyra');
  });
});

// ── evolutionProgress ─────────────────────────────────────────────────────────

describe('EvolutionSystem.evolutionProgress', () => {
  it('returns 0 for fresh egg', () => {
    const p = pet(0, 0, null);
    expect(EvolutionSystem.evolutionProgress(p)).toBe(0);
  });

  it('returns 1 when past hatch threshold', () => {
    const p = pet(0, EGG_HATCH_MINUTES * 60 * 1000, null);
    expect(EvolutionSystem.evolutionProgress(p)).toBe(1);
  });

  it('returns 0.5 at the midpoint for stage 1', () => {
    const p = pet(1, (STAGE_CHILD_HOURS / 2) * ONE_HOUR_MS, 'baby');
    expect(EvolutionSystem.evolutionProgress(p)).toBeCloseTo(0.5, 5);
  });

  it('caps at 1.0 even if overdue', () => {
    const p = pet(1, STAGE_CHILD_HOURS * 2 * ONE_HOUR_MS, 'baby');
    expect(EvolutionSystem.evolutionProgress(p)).toBe(1);
  });

  it('returns 1 for max stage', () => {
    const p = pet(4, 999 * ONE_HOUR_MS, 'lumara');
    expect(EvolutionSystem.evolutionProgress(p)).toBe(1);
  });
});

// ── predictNextEvolution ──────────────────────────────────────────────────────

describe('EvolutionSystem.predictNextEvolution', () => {
  it('returns "Baby" for an egg', () => {
    const p = pet(0, 0, null);
    expect(EvolutionSystem.predictNextEvolution(p)).toBe('Baby');
  });

  it('returns a child name for stage 1', () => {
    const p = pet(1, 0, 'baby');
    const result = EvolutionSystem.predictNextEvolution(p);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns null for max stage', () => {
    const p = pet(4, 999 * ONE_HOUR_MS, 'lumara');
    expect(EvolutionSystem.predictNextEvolution(p)).toBeNull();
  });

  it('returns rarity hint (not name) for stage 3', () => {
    const p = pet(3, 0, 'fluffi', { careScore: CARE_PERFECT });
    const result = EvolutionSystem.predictNextEvolution(p);
    expect(result).toMatch(/\?\?\?/);
    expect(result).toMatch(/legendary/i);
  });
});

// ── minutesUntilHatch ─────────────────────────────────────────────────────────

describe('EvolutionSystem.minutesUntilHatch', () => {
  it('returns minutes remaining for an egg', () => {
    const halfwayMs = (EGG_HATCH_MINUTES / 2) * 60 * 1000;
    const p = pet(0, halfwayMs, null);
    expect(EvolutionSystem.minutesUntilHatch(p)).toBeCloseTo(EGG_HATCH_MINUTES / 2, 5);
  });

  it('returns 0 once ready to hatch', () => {
    const p = pet(0, EGG_HATCH_MINUTES * 60 * 1000, null);
    expect(EvolutionSystem.minutesUntilHatch(p)).toBe(0);
  });

  it('returns 0 for non-egg stages', () => {
    const p = pet(1, 0, 'baby');
    expect(EvolutionSystem.minutesUntilHatch(p)).toBe(0);
  });
});

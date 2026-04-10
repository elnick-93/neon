import { describe, it, expect } from 'vitest';
import { TimeSystem } from '../TimeSystem.js';
import { PetSystem } from '../PetSystem.js';
import {
  DECAY_HUNGER, DECAY_HAPPINESS, DECAY_CLEANLINESS, DECAY_ENERGY,
  STAT_CRIT,
} from '../../constants.js';

function livePet(overrides = {}) {
  return {
    ...PetSystem.createPet('lumie', 'T'),
    stage: 1,            // baby — active stage
    isAlive: true,
    ageMs: 0,
    lastSeenTs: Date.now(),
    ...overrides,
  };
}

const ONE_HOUR_MS = 3_600_000;

// ── applyDecay ────────────────────────────────────────────────────────────────

describe('TimeSystem.applyDecay', () => {
  it('decays hunger by DECAY_HUNGER per hour', () => {
    const pet = livePet({ hunger: 100 });
    const { pet: after } = TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(after.hunger).toBeCloseTo(100 - DECAY_HUNGER, 5);
  });

  it('decays happiness by DECAY_HAPPINESS per hour', () => {
    const pet = livePet({ happiness: 100 });
    const { pet: after } = TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(after.happiness).toBeCloseTo(100 - DECAY_HAPPINESS, 5);
  });

  it('decays cleanliness by DECAY_CLEANLINESS per hour', () => {
    const pet = livePet({ cleanliness: 100 });
    const { pet: after } = TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(after.cleanliness).toBeCloseTo(100 - DECAY_CLEANLINESS, 5);
  });

  it('decays energy by DECAY_ENERGY per hour', () => {
    const pet = livePet({ energy: 100 });
    const { pet: after } = TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(after.energy).toBeCloseTo(100 - DECAY_ENERGY, 5);
  });

  it('does not go below 0 for any stat', () => {
    const pet = livePet({ hunger: 0, happiness: 0, cleanliness: 0, energy: 0 });
    const { pet: after } = TimeSystem.applyDecay(pet, 10 * ONE_HOUR_MS);
    expect(after.hunger).toBe(0);
    expect(after.happiness).toBe(0);
    expect(after.cleanliness).toBe(0);
    expect(after.energy).toBe(0);
  });

  it('accumulates ageMs', () => {
    const pet = livePet({ ageMs: 0 });
    const { pet: after } = TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(after.ageMs).toBe(ONE_HOUR_MS);
  });

  it('freezes decay when hotelActive is true', () => {
    const pet = livePet({ hunger: 80, happiness: 80 });
    const { pet: after } = TimeSystem.applyDecay(pet, ONE_HOUR_MS, true);
    expect(after.hunger).toBe(80);
    expect(after.happiness).toBe(80);
  });

  it('skips decay for eggs (stage 0)', () => {
    const egg = PetSystem.createPet('lumie', 'Egg');
    const { pet: after } = TimeSystem.applyDecay(egg, ONE_HOUR_MS);
    expect(after.hunger).toBe(100);
    expect(after.ageMs).toBe(ONE_HOUR_MS);
  });

  it('deals health penalty when stats are critical', () => {
    const pet = livePet({
      hunger: STAT_CRIT - 5,   // already critical
      happiness: STAT_CRIT - 5,
      cleanliness: STAT_CRIT - 5,
      health: 100,
    });
    const { pet: after } = TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(after.health).toBeLessThan(100);
  });

  it('reports died=true when health reaches zero', () => {
    const pet = livePet({
      hunger: 0, happiness: 0, cleanliness: 0, health: 5,
    });
    const { died } = TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(died).toBe(true);
  });

  it('does not mutate the input pet', () => {
    const pet = livePet({ hunger: 80 });
    const before = pet.hunger;
    TimeSystem.applyDecay(pet, ONE_HOUR_MS);
    expect(pet.hunger).toBe(before);
  });

  it('handles elapsedMs=0 as no-op', () => {
    const pet = livePet({ hunger: 70 });
    const { pet: after } = TimeSystem.applyDecay(pet, 0);
    expect(after.hunger).toBe(70);
  });
});

// ── nextHungerCritTime ────────────────────────────────────────────────────────

describe('TimeSystem.nextHungerCritTime', () => {
  it('returns a future date when hunger is above STAT_CRIT', () => {
    const pet = livePet({ hunger: 80 });
    const result = TimeSystem.nextHungerCritTime(pet);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns null when hunger is already critical', () => {
    const pet = livePet({ hunger: STAT_CRIT - 1 });
    expect(TimeSystem.nextHungerCritTime(pet)).toBeNull();
  });

  it('estimates time based on decay rate', () => {
    const pet = livePet({ hunger: STAT_CRIT + DECAY_HUNGER });  // exactly 1 hour to crit
    const result = TimeSystem.nextHungerCritTime(pet);
    const msUntilCrit = result.getTime() - Date.now();
    expect(msUntilCrit).toBeCloseTo(ONE_HOUR_MS, -4);  // within ~10 seconds
  });
});

// ── nextHappinessCritTime ─────────────────────────────────────────────────────

describe('TimeSystem.nextHappinessCritTime', () => {
  it('returns a future date when happiness is above STAT_CRIT', () => {
    const pet = livePet({ happiness: 80 });
    const result = TimeSystem.nextHappinessCritTime(pet);
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns null when happiness is already critical', () => {
    const pet = livePet({ happiness: STAT_CRIT - 1 });
    expect(TimeSystem.nextHappinessCritTime(pet)).toBeNull();
  });
});

// ── hoursUntilNextStage ───────────────────────────────────────────────────────

describe('TimeSystem.hoursUntilNextStage', () => {
  it('returns hours remaining for stage 1 → 2 (threshold 24h)', () => {
    const pet = livePet({ stage: 1, ageMs: 12 * ONE_HOUR_MS });
    const hours = TimeSystem.hoursUntilNextStage(pet);
    expect(hours).toBeCloseTo(12, 5);
  });

  it('returns 0 if already past threshold', () => {
    const pet = livePet({ stage: 1, ageMs: 30 * ONE_HOUR_MS });
    expect(TimeSystem.hoursUntilNextStage(pet)).toBe(0);
  });

  it('returns null for stage 4 (max)', () => {
    const pet = livePet({ stage: 4, ageMs: 300 * ONE_HOUR_MS });
    expect(TimeSystem.hoursUntilNextStage(pet)).toBeNull();
  });
});

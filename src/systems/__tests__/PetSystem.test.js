import { describe, it, expect, beforeEach } from 'vitest';
import { PetSystem } from '../PetSystem.js';

function freshPet(overrides = {}) {
  return {
    ...PetSystem.createPet('lumie', 'Testi'),
    lastSeenTs: Date.now(),
    ...overrides,
  };
}

// ── createPet ──────────────────────────────────────────────────────────────────

describe('PetSystem.createPet', () => {
  it('returns a pet with full stats', () => {
    const pet = PetSystem.createPet('lumie', 'Starla');
    expect(pet.hunger).toBe(100);
    expect(pet.happiness).toBe(100);
    expect(pet.cleanliness).toBe(100);
    expect(pet.energy).toBe(100);
    expect(pet.health).toBe(100);
    expect(pet.isAlive).toBe(true);
    expect(pet.stage).toBe(0);
    expect(pet.evolutionId).toBeNull();
    expect(pet.speciesId).toBe('lumie');
    expect(pet.name).toBe('Starla');
  });

  it('initialises care counters at zero', () => {
    const pet = PetSystem.createPet('sparky', 'Zap');
    expect(pet.totalFeedings).toBe(0);
    expect(pet.totalPlaySessions).toBe(0);
    expect(pet.totalSleepSessions).toBe(0);
  });
});

// ── feed ──────────────────────────────────────────────────────────────────────

describe('PetSystem.feed', () => {
  it('raises hunger by the food amount', () => {
    const pet = freshPet({ hunger: 40 });
    const { pet: after, blocked } = PetSystem.feed(pet, 'kibble');
    expect(blocked).toBe(false);
    expect(after.hunger).toBeGreaterThan(40);
  });

  it('does not exceed 100', () => {
    const pet = freshPet({ hunger: 95 });
    const { pet: after } = PetSystem.feed(pet, 'kibble');
    expect(after.hunger).toBeLessThanOrEqual(100);
  });

  it('increments totalFeedings', () => {
    const pet = freshPet();
    const { pet: after } = PetSystem.feed(pet, 'kibble');
    expect(after.totalFeedings).toBe(1);
  });

  it('blocks unknown food ids', () => {
    const pet = freshPet();
    const { blocked } = PetSystem.feed(pet, 'nonexistent_food');
    expect(blocked).toBe(true);
  });

  it('blocks on cooldown', () => {
    const pet = freshPet({
      foodCooldowns: { berry: Date.now() + 3_600_000 },
    });
    const { blocked, reason } = PetSystem.feed(pet, 'berry');
    expect(blocked).toBe(true);
    expect(reason).toMatch(/cooldown/i);
  });

  it('does not mutate input', () => {
    const pet = freshPet({ hunger: 50 });
    const before = pet.hunger;
    PetSystem.feed(pet, 'kibble');
    expect(pet.hunger).toBe(before);
  });
});

// ── afterPlay ─────────────────────────────────────────────────────────────────

describe('PetSystem.afterPlay', () => {
  it('raises happiness proportional to stars caught', () => {
    const pet = freshPet({ happiness: 50, energy: 80 });
    const after = PetSystem.afterPlay(pet, 5, 10);
    expect(after.happiness).toBeGreaterThan(50);
  });

  it('gives bonus happiness on perfect run', () => {
    const pet = freshPet({ happiness: 50, energy: 80 });
    const perfect = PetSystem.afterPlay(pet, 10, 10);
    const imperfect = PetSystem.afterPlay(pet, 10, 12);
    expect(perfect.happiness).toBeGreaterThan(imperfect.happiness);
  });

  it('costs energy', () => {
    const pet = freshPet({ energy: 80 });
    const after = PetSystem.afterPlay(pet, 5, 10);
    expect(after.energy).toBeLessThan(80);
  });

  it('increments totalPlaySessions', () => {
    const pet = freshPet({ energy: 80 });
    const after = PetSystem.afterPlay(pet, 5, 10);
    expect(after.totalPlaySessions).toBe(1);
  });

  it('caps happiness at 100', () => {
    const pet = freshPet({ happiness: 98, energy: 80 });
    const after = PetSystem.afterPlay(pet, 10, 10);
    expect(after.happiness).toBeLessThanOrEqual(100);
  });
});

// ── clean ─────────────────────────────────────────────────────────────────────

describe('PetSystem.clean', () => {
  it('restores cleanliness to 100', () => {
    const pet = freshPet({ cleanliness: 30 });
    const after = PetSystem.clean(pet);
    expect(after.cleanliness).toBe(100);
  });

  it('gives a small happiness boost', () => {
    const pet = freshPet({ happiness: 60 });
    const after = PetSystem.clean(pet);
    expect(after.happiness).toBeGreaterThan(60);
  });
});

// ── setSleeping / applySleepRecovery ──────────────────────────────────────────

describe('PetSystem.setSleeping', () => {
  it('sets sleeping flag', () => {
    const pet = freshPet({ sleeping: false });
    expect(PetSystem.setSleeping(pet, true).sleeping).toBe(true);
    expect(PetSystem.setSleeping(pet, false).sleeping).toBe(false);
  });

  it('increments totalSleepSessions when going to sleep', () => {
    const pet = freshPet({ sleeping: false });
    const after = PetSystem.setSleeping(pet, true);
    expect(after.totalSleepSessions).toBe(1);
  });

  it('does NOT increment counter when waking up', () => {
    const pet = freshPet({ sleeping: true, totalSleepSessions: 1 });
    const after = PetSystem.setSleeping(pet, false);
    expect(after.totalSleepSessions).toBe(1);
  });
});

describe('PetSystem.applySleepRecovery', () => {
  it('recovers energy at 20 pts/hr', () => {
    const pet = freshPet({ energy: 40 });
    const after = PetSystem.applySleepRecovery(pet, 2);
    expect(after.energy).toBe(80);
  });

  it('caps at 100', () => {
    const pet = freshPet({ energy: 95 });
    const after = PetSystem.applySleepRecovery(pet, 5);
    expect(after.energy).toBe(100);
  });
});

// ── hatch / evolve ────────────────────────────────────────────────────────────

describe('PetSystem.hatch', () => {
  it('transitions to stage 1', () => {
    const pet = freshPet({ stage: 0 });
    const after = PetSystem.hatch(pet);
    expect(after.stage).toBe(1);
    expect(after.evolutionId).toBe('baby');
  });
});

describe('PetSystem.evolve', () => {
  it('increments stage and sets evolutionId', () => {
    const pet = freshPet({ stage: 1, evolutionId: 'baby' });
    const after = PetSystem.evolve(pet, 'puffi');
    expect(after.stage).toBe(2);
    expect(after.evolutionId).toBe('puffi');
  });

  it('gives stat boosts on evolve', () => {
    const pet = freshPet({ stage: 1, hunger: 60, happiness: 60, health: 70 });
    const after = PetSystem.evolve(pet, 'puffi');
    expect(after.hunger).toBeGreaterThan(60);
    expect(after.happiness).toBeGreaterThan(60);
    expect(after.health).toBeGreaterThan(70);
  });
});

// ── kill / revive ─────────────────────────────────────────────────────────────

describe('PetSystem.kill', () => {
  it('marks the pet as dead', () => {
    const pet = freshPet({ isAlive: true });
    expect(PetSystem.kill(pet).isAlive).toBe(false);
  });
});

describe('PetSystem.revive', () => {
  it('restores isAlive and full stats', () => {
    const pet = { ...freshPet(), isAlive: false, health: 0, hunger: 0, happiness: 0 };
    const after = PetSystem.revive(pet);
    expect(after.isAlive).toBe(true);
    expect(after.health).toBe(100);
    expect(after.hunger).toBe(80);
    expect(after.happiness).toBe(80);
  });
});

// ── isCritical ────────────────────────────────────────────────────────────────

describe('PetSystem.isCritical', () => {
  it('returns true when hunger is below STAT_CRIT (20)', () => {
    const pet = freshPet({ hunger: 15 });
    expect(PetSystem.isCritical(pet)).toBe(true);
  });

  it('returns false when all stats are healthy', () => {
    const pet = freshPet({ hunger: 80, happiness: 80, health: 80 });
    expect(PetSystem.isCritical(pet)).toBe(false);
  });
});

// ── dominantCareType ──────────────────────────────────────────────────────────

describe('PetSystem.dominantCareType', () => {
  it('returns balanced with zero activity', () => {
    const pet = freshPet({ totalFeedings: 0, totalPlaySessions: 0, totalSleepSessions: 0 });
    expect(PetSystem.dominantCareType(pet)).toBe('balanced');
  });

  it('detects feeding_dominant when feedings are 60% of total', () => {
    const pet = freshPet({ totalFeedings: 6, totalPlaySessions: 2, totalSleepSessions: 2 });
    expect(PetSystem.dominantCareType(pet)).toBe('feeding_dominant');
  });

  it('detects play_dominant when play is 60%', () => {
    const pet = freshPet({ totalFeedings: 2, totalPlaySessions: 6, totalSleepSessions: 2 });
    expect(PetSystem.dominantCareType(pet)).toBe('play_dominant');
  });

  it('detects sleep_dominant when sleep is 50%', () => {
    const pet = freshPet({ totalFeedings: 2, totalPlaySessions: 3, totalSleepSessions: 5 });
    expect(PetSystem.dominantCareType(pet)).toBe('sleep_dominant');
  });
});

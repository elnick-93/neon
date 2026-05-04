// ─── Accessory / Cosmetic Catalogue ───────────────────────────────────────────
// Accessories are rendered as overlay layers on top of the pet sprite.
// `slot`: 'hat' | 'bg' | 'effect'
// `unlockMethod`: 'iap' | 'level' | 'free'

export const ACCESSORIES = {
  // ── Free / Default ────────────────────────────────────────────────────────
  bg_pastel: {
    id: 'bg_pastel', name: 'Pastel Room', slot: 'bg',
    unlockMethod: 'free',
    description: 'A soft pastel bedroom.',
    colors: { wall: 0xFFE4E1, floor: 0xF5D5CC, accent: 0xFFB5BA },
  },

  // ── Bundle 1 — "Sky Garden" ────────────────────────────────────────────────
  hat_flower: {
    id: 'hat_flower', name: 'Flower Crown', slot: 'hat',
    unlockMethod: 'iap', bundle: 'lp_acc_bundle1',
    description: 'A little crown of blooming flowers.',
    color: 0xFF8FAB,
  },
  hat_star: {
    id: 'hat_star', name: 'Star Hat', slot: 'hat',
    unlockMethod: 'iap', bundle: 'lp_acc_bundle1',
    description: 'A pointy star-shaped hat.',
    color: 0xFFD97D,
  },
  bg_garden: {
    id: 'bg_garden', name: 'Star Garden', slot: 'bg',
    unlockMethod: 'iap', bundle: 'lp_acc_bundle1',
    description: 'A magical garden under the stars.',
    colors: { wall: 0x1a2a1a, floor: 0x2a4a2a, accent: 0x4ade80 },
  },
  hat_moon: {
    id: 'hat_moon', name: 'Moon Tiara', slot: 'hat',
    unlockMethod: 'iap', bundle: 'lp_acc_bundle1',
    description: 'A crescent moon tiara.',
    color: 0xC0E8FF,
  },
  effect_hearts: {
    id: 'effect_hearts', name: 'Heart Aura', slot: 'effect',
    unlockMethod: 'iap', bundle: 'lp_acc_bundle1',
    description: 'Floating hearts orbit your pet.',
    color: 0xFF8FAB,
  },

  // ── Level unlocks ─────────────────────────────────────────────────────────
  hat_bow: {
    id: 'hat_bow', name: 'Ribbon Bow', slot: 'hat',
    unlockMethod: 'level', unlockLevel: 5,
    description: 'Unlocked at level 5.',
    color: 0xF9A8D4,
  },
  bg_space: {
    id: 'bg_space', name: 'Cosmic Den', slot: 'bg',
    unlockMethod: 'level', unlockLevel: 10,
    description: 'A cozy room floating in space.',
    colors: { wall: 0x0d0d2e, floor: 0x1a1a4a, accent: 0xC0E8FF },
  },
  hat_halo: {
    id: 'hat_halo', name: 'Glowing Halo', slot: 'hat',
    unlockMethod: 'level', unlockLevel: 20,
    description: 'A soft golden halo.',
    color: 0xFFD700,
  },
  effect_sparkles: {
    id: 'effect_sparkles', name: 'Sparkle Trail', slot: 'effect',
    unlockMethod: 'level', unlockLevel: 15,
    description: 'Sparkles follow every movement.',
    color: 0xFFFFFF,
  },
};

export const ACCESSORY_IDS = Object.keys(ACCESSORIES);
export const FREE_ACCESSORIES = ACCESSORY_IDS.filter(id => ACCESSORIES[id].unlockMethod === 'free');

// ─── Cosmetic Skin Catalogue ──────────────────────────────────────────────────

export const SKINS = {
  DEFAULT: {
    id: 'default',
    name: 'Default',
    unlockMethod: 'free',
    boardBg: 0x0a0a0f,
    gridLine: 0x1a1a2e,
    borderColor: 0x00ffcc,
    particleColor: 0x00ffcc,
  },
  NEON_CITY: {
    id: 'neon_city',
    name: 'Neon City',
    unlockMethod: 'iap',
    iapProduct: 'nbr_skin_neon',
    boardBg: 0x0d0d1a,
    gridLine: 0x1a1a3e,
    borderColor: 0xff007f,
    particleColor: 0xff007f,
  },
  CYBER: {
    id: 'cyber',
    name: 'Cyber Grid',
    unlockMethod: 'iap',
    iapProduct: 'nbr_skin_cyber',
    boardBg: 0x000d1a,
    gridLine: 0x0d2233,
    borderColor: 0x0088ff,
    particleColor: 0x00ffff,
  },
  GOLD: {
    id: 'gold',
    name: 'Gold Rush',
    unlockMethod: 'level',
    unlockLevel: 20,
    boardBg: 0x1a1200,
    gridLine: 0x2a1e00,
    borderColor: 0xffd700,
    particleColor: 0xffd700,
  },
  VOID: {
    id: 'void',
    name: 'Void',
    unlockMethod: 'level',
    unlockLevel: 50,
    boardBg: 0x000000,
    gridLine: 0x0a000d,
    borderColor: 0x7f00ff,
    particleColor: 0xdd00ff,
  },
};

export const SKIN_IDS = Object.keys(SKINS);
export const SKIN_BY_ID = Object.fromEntries(Object.values(SKINS).map(s => [s.id, s]));

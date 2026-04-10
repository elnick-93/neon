// ─── Pixel Art Format ──────────────────────────────────────────────────────────
// Each frame is a 16-char wide × 12-char tall string (no newlines, concat rows).
// Palette key chars:
//   '.' = transparent   'b' = body      'h' = body highlight
//   's' = body shadow   'e' = eye dark  'w' = eye white/spec
//   'c' = cheek pink    'm' = mouth     'z' = closed eye (sleeping)
//   'x' = sick eye      't' = tear      'o' = open mouth (eating)
//   '*' = star/sparkle  '~' = blush     'g' = tinge (sick green overlay)
//   'u' = antenna/horn  'f' = flower

// Each species has a `palette` mapping those chars to hex colors, plus `frames`
// for each emotional state. The PetSprite renderer draws them as 6×6 pixel blocks.

// ─── Color Palettes ───────────────────────────────────────────────────────────
const PALETTES = {
  lumie: {
    b: 0xFFD97D, h: 0xFFEFAA, s: 0xC4952A,
    e: 0x2D1B00, w: 0xFFFFFF, c: 0xFFB5BA,
    m: 0x7A3B1E, z: 0x2D1B00, x: 0xCC3333,
    t: 0x6BD3F5,  o: 0x2D1B00, '*': 0xFFFFFF,
    '~': 0xFF8FAB, g: 0x8BC34A, u: 0xFFD97D,
  },
  sparky: {
    b: 0x7DD9FF, h: 0xBBEEFF, s: 0x3A9CC8,
    e: 0x0A1A2D, w: 0xFFFFFF, c: 0xFFB5BA,
    m: 0x1A4060, z: 0x0A1A2D, x: 0xCC3333,
    t: 0x6BD3F5,  o: 0x0A1A2D, '*': 0xFFFFFF,
    '~': 0xFFE4BA, g: 0x8BC34A, u: 0xF9E54B,
  },
  blossy: {
    b: 0xFFADD9, h: 0xFFCFEA, s: 0xC4709A,
    e: 0x2D0A1A, w: 0xFFFFFF, c: 0xFF8FAB,
    m: 0x7A2040, z: 0x2D0A1A, x: 0xCC3333,
    t: 0x6BD3F5,  o: 0x2D0A1A, '*': 0xFFFFFF,
    '~': 0xFFD97D, g: 0x8BC34A, u: 0xFF8FAB,
  },
  // Adult evolution palettes
  lumara: {   // legendary golden
    b: 0xFFD700, h: 0xFFF4A0, s: 0xB8860B,
    e: 0x1A0A00, w: 0xFFFFFF, c: 0xFFB5BA,
    m: 0x6B3A10, z: 0x1A0A00, x: 0xCC3333,
    t: 0x6BD3F5,  o: 0x1A0A00, '*': 0xFFFFFF,
    '~': 0xFF8FAB, g: 0x8BC34A, u: 0xFFD700,
  },
  starra: {   // legendary silver-blue
    b: 0xC0E8FF, h: 0xE8F8FF, s: 0x6AADCC,
    e: 0x0A1020, w: 0xFFFFFF, c: 0xFFB5BA,
    m: 0x1A4060, z: 0x0A1020, x: 0xCC3333,
    t: 0x6BD3F5,  o: 0x0A1020, '*': 0xFFFFFF,
    '~': 0xFFE4BA, g: 0x8BC34A, u: 0xC0E8FF,
  },
  cozyra:  { b: 0xFFA066, h: 0xFFBF99, s: 0xC46030, e: 0x2D1000, w: 0xFFFFFF, c: 0xFFB5BA, m: 0x7A3010, z: 0x2D1000, x: 0xCC3333, t: 0x6BD3F5, o: 0x2D1000, '*': 0xFFFFFF, '~': 0xFF8FAB, g: 0x8BC34A, u: 0xFFA066 },
  dreamra: { b: 0xB09FE8, h: 0xD4C8FF, s: 0x6A58B0, e: 0x1A0A30, w: 0xFFFFFF, c: 0xFFB5BA, m: 0x4A2880, z: 0x1A0A30, x: 0xCC3333, t: 0x6BD3F5, o: 0x1A0A30, '*': 0xFFFFFF, '~': 0xFF8FAB, g: 0x8BC34A, u: 0xB09FE8 },
  blazra:  { b: 0xFF7043, h: 0xFF9E80, s: 0xC43010, e: 0x1A0500, w: 0xFFFFFF, c: 0xFFB5BA, m: 0x7A2000, z: 0x1A0500, x: 0xCC3333, t: 0x6BD3F5, o: 0x1A0500, '*': 0xFFFF80, '~': 0xFF8FAB, g: 0x8BC34A, u: 0xFF7043 },
};

// ─── Frame definitions ────────────────────────────────────────────────────────
// 16 wide × 12 tall = 192 chars per frame (rows of 16 concatenated)
const F = {
  // ── Egg ──────────────────────────────────────────────────────────────────
  egg_idle:
    '......bbbb......' +
    '....bbbbbbbb....' +
    '...bbbbhbbbbb...' +
    '..bbbbbbbbbbb...' +
    '..bbb*bbb*bbb...' +
    '..bbbbbbbbbbb...' +
    '..bbbbbbbbbbb...' +
    '...bbbbbbbbb....' +
    '....bbbbbbb.....' +
    '.....bbbbb......' +
    '................' +
    '................',

  egg_wobble:                      // used just before hatch (tween handles movement)
    '......bbbb......' +
    '....bbbbbbbb....' +
    '...bbhbbbbbbb...' +
    '..bbbbbbbbbbb...' +
    '..bb*bbb*bbbb...' +
    '..bbbbbbbbbbb...' +
    '..bbbbbbbbbbb...' +
    '...bbbbbbbbb....' +
    '....bbbbbbb.....' +
    '.....bbbbb......' +
    '................' +
    '................',

  // ── Baby (shared by all species at stage 1) ────────────────────────────────
  baby_idle:
    '................' +
    '.....hhhhh......' +
    '....hbbbbbbh....' +
    '...hbbbbbbbbh...' +
    '...bbbewebbb....' +  // single eye pair center
    '...bbbbbbbbb....' +
    '...bcbbmmbcb....' +
    '....bbbbbbbb....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................' +
    '................',

  baby_happy:
    '................' +
    '.....hhhhh......' +
    '....hbbbbbbh....' +
    '...hbbbbbbbbh...' +
    '...bbb*bb*bbb...' +
    '...bbbbbbbbb....' +
    '...bb~mmmm~bb...' +
    '....bbbbbbbb....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................' +
    '................',

  baby_eating:
    '................' +
    '.....hhhhh......' +
    '....hbbbbbbh....' +
    '...hbbbbbbbbh...' +
    '...bbbewebbb....' +
    '...bbbbbbbbb....' +
    '...bbbooobbb....' +
    '....bbbbbbbb....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................' +
    '................',

  baby_sleeping:
    '................' +
    '.....hhhhh......' +
    '....hbbbbbbh....' +
    '...hbbbbbbbbh...' +
    '...bbbzzbzzb....' +
    '...bbbbbbbbb....' +
    '...bbb....bbb...' +
    '....bbbbbbbb....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................' +
    '................',

  baby_sick:
    '................' +
    '.....gggggg.....' +
    '....gbbbbbbg....' +
    '...gbbbbbbbbg...' +
    '...bbbxbbxbb....' +
    '...bbbbbbbbb....' +
    '...bbb..mbbb....' +
    '...tbbbbbbbt....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................' +
    '................',

  baby_sad:
    '................' +
    '.....hhhhh......' +
    '....hbbbbbbh....' +
    '...hbbbbbbbbh...' +
    '...bbbewebbb....' +
    '...bbbbbbbbb....' +
    '...bbb._.bbb....' +
    '...tbbbbbbbbt...' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................' +
    '................',

  // ── Child PUFFI (well-fed, chubby) ────────────────────────────────────────
  child_puffi_idle:
    '................' +
    '....hhhhhhh.....' +
    '...hbbbbbbbhh...' +
    '..hbbbbbbbbbbh..' +
    '..bbbbewebbbb...' +
    '..bbbbbbbbbbb...' +
    '..bcbbmmbbcbb...' +
    '...bbbbbbbbbb...' +
    '....bbbbbbbh....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................',

  child_puffi_happy:
    '................' +
    '....hhhhhhh.....' +
    '...hbbbbbbbhh...' +
    '..hbbbbbbbbbbh..' +
    '..bbbb*bb*bbb...' +
    '..bbbbbbbbbbb...' +
    '..bb~~mmmm~~b...' +
    '...bbbbbbbbbb...' +
    '....bbbbbbbh....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................',

  child_puffi_sick:
    '................' +
    '....gggggggg....' +
    '...gbbbbbbbbg...' +
    '..gbbbbbbbbbbg..' +
    '..bbbxbbbxbbb...' +
    '..bbbbbbbbbbb...' +
    '..bbb....bbbb...' +
    '..tbbbbbbbbt....' +
    '....bbbbbbbh....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '................',

  // ── Child ZIPPI (play-dominant, nimble) ────────────────────────────────────
  child_zippi_idle:
    '................' +
    '......hhhh......' +
    '.....hbbbbh.....' +
    '....hbbbbbbh....' +
    '....bbbubbbb....' +  // antenna
    '....bbeweebb....' +
    '....bbbbbbbb....' +
    '....bcbmmcbb....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '.......bb.......' +
    '................',

  child_zippi_happy:
    '................' +
    '......hhhh......' +
    '.....hbbbbh.....' +
    '....hbbbbbbh....' +
    '....bbbubbbb....' +
    '....bb*ww*bb....' +
    '....bbbbbbbb....' +
    '....b~~mm~~b....' +
    '.....bbbbbb.....' +
    '......bbbb......' +
    '.......bb.......' +
    '................',

  // ── Teen FLUFFI (fluffy, rounded) ────────────────────────────────────────
  teen_fluffi_idle:
    '...hhhhhhhhhh...' +
    '..hbbbbbbbbbbh..' +
    '.hbbhbbbbbbbbbh.' +
    '.hbbbbbbbbbbbbh.' +
    '.hbbbewebbbbbh..' +
    '.hbbbbbbbbbbh...' +
    '.hbcbbmmbbcbh...' +
    '..hbbbbbbbbh....' +
    '...hbbbbbbh.....' +
    '....hbbbbh......' +
    '.....hbbh.......' +
    '......hh........',

  teen_fluffi_happy:
    '...hhhhhhhhhh...' +
    '..hbbbbbbbbbbh..' +
    '.hbbhbbbbbbbbbh.' +
    '.hbbbbbbbbbbbbh.' +
    '.hbbb*bbb*bbbh..' +
    '.hbbbbbbbbbbh...' +
    '.hb~~mmmmm~~bh..' +
    '..hbbbbbbbbh....' +
    '...hbbbbbbh.....' +
    '....hbbbbh......' +
    '.....hbbh.......' +
    '......hh........',

  // ── Teen SNUGGI (cozy, heart-eyed) ────────────────────────────────────────
  teen_snuggi_idle:
    '................' +
    '.....hhhhhhh....' +
    '....hbbbbbbbbh..' +
    '...hbbbbbbbbbbh.' +
    '...hbbbewebbbh..' +
    '...hbbbbbbbbbh..' +
    '...hbcbmmmcbbh..' +
    '....hbbbbbbbbh..' +
    '.....hbbbbbbh...' +
    '......hbbbbh....' +
    '.......hbbh.....' +
    '................',

  // ── Teen SPARKI (electric spiky) ───────────────────────────────────────────
  teen_sparki_idle:
    '...u........u...' +
    '....hhhhhhhh....' +
    '...hbbbbbbbbh...' +
    '..hbbbbbbbbbbh..' +
    '..hbbbewebbbh...' +
    '..hbbbbbbbbbb...' +
    '..hbcbbmmbbcb...' +
    '...hbbbbbbbbb...' +
    '....hbbbbbbbh...' +
    '.....hbbbbh.....' +
    '..u..hbbh..u....' +
    '......hh........',

  // ── Teen DAZZI (dreamy, half-lidded eyes) ──────────────────────────────────
  teen_dazzi_idle:
    '................' +
    '.....hhhhhhh....' +
    '....hbbbbbbbbh..' +
    '...hbbbbbbbbbbh.' +
    '...hbbzbbzbbbbh.' +
    '...hbbbbbbbbbh..' +
    '...hbbbmm.bbbh..' +
    '....hbbbbbbbbh..' +
    '.....hbbbbbbh...' +
    '......hbbbbh....' +
    '.......hbbh.....' +
    '................',

  // ── Adult LUMARA (legendary) ────────────────────────────────────────────────
  adult_lumara_idle:
    '....u......u....' +
    '...hhhhhhhhhh...' +
    '..hbbbbhbbbbbh..' +
    '.hbbbbbbbbbbbbbh' +
    '.hbbbewebbbewbh.' +
    '.hbbbbbbbbbbbbh.' +
    '.hbcbbmmmmbbcbh.' +
    '.hbbbbbbbbbbbh..' +
    '..hbbbbbbbbbh...' +
    '...hbbbbbbbh....' +
    '....hhhhhhhh....' +
    '.....hhhhhh.....',

  adult_lumara_happy:
    '....u......u....' +
    '...hhhhhhhhhh...' +
    '..hbbbbhbbbbbh..' +
    '.hbbbbbbbbbbbbbh' +
    '.hbbb*bwb*bbbwbh' +
    '.hbbbbbbbbbbbbh.' +
    '.hb~~mmmmmm~~bh.' +
    '.hbbbbbbbbbbbh..' +
    '..hbbbbbbbbbh...' +
    '...hbbbbbbbh....' +
    '....hhhhhhhh....' +
    '.....hhhhhh.....',

  // ── Adult COZYRA ──────────────────────────────────────────────────────────
  adult_cozyra_idle:
    '................' +
    '....hhhhhhhhh...' +
    '...hbbbbbbbbbh..' +
    '..hbbbbhbbbbbbb.' +
    '..hbbbewebbbbbh.' +
    '..hbbbbbbbbbbbh.' +
    '..hbcbbmmmbbcbh.' +
    '..hbbbbbbbbbbh..' +
    '...hbbbbbbbbbh..' +
    '....hbbbbbbbh...' +
    '.....hhhhhhh....' +
    '................',

  // ── Adult STARRA (legendary) ────────────────────────────────────────────────
  adult_starra_idle:
    '...*........*...' +
    '....hhhhhhhhhh..' +
    '...hbbbbhbbbbbbh' +
    '..hbbbbbbbbbbbbh' +
    '..hbbbewebbbewbh' +
    '..hbbbbbbbbbbbbh' +
    '..hbcbbmmmmbbcbh' +
    '..hbbbbbbbbbbbbh' +
    '...hbbbbbbbbbbbh' +
    '....hhhhhhhhhh..' +
    '.....*......*...' +
    '................',

  // ── Adult DREAMRA ──────────────────────────────────────────────────────────
  adult_dreamra_idle:
    '................' +
    '....hhhhhhhhh...' +
    '...hbbbbbbbbbbh.' +
    '..hbbbbbbbbbbbh.' +
    '..hbbbewebbbh...' +
    '..hbbbbbbbbbh...' +
    '..hbcbbmmbcbbh..' +
    '..hbbbbbbbbbbh..' +
    '...hbbbbbbbbbbh.' +
    '....hhhhhhhhhh..' +
    '................' +
    '................',

  // ── Adult BLAZRA ───────────────────────────────────────────────────────────
  adult_blazra_idle:
    '..u.........u...' +
    '....hhhhhhhh....' +
    '...hbbbbbbbbh...' +
    '..hbbbbhbbbbbbh.' +
    '..hbbbewbbbbbbh.' +
    '..hbbbbbbbbbbh..' +
    '..hbcbbmmbcbbh..' +
    '..hbbbbbbbbbbh..' +
    '...hbbbbbbbbh...' +
    '....hhhhhhhhh...' +
    '..u.........u...' +
    '................',
};

// ─── Species Definitions ──────────────────────────────────────────────────────
// `frameSet` maps state names to frame keys above.
// EVERY species shares the same state names so PetSprite needs only one lookup.
export const SPECIES = {
  lumie: {
    id: 'lumie',
    name: 'Lumie',
    description: 'Warm and friendly. Great for first-time trainers.',
    palette: PALETTES.lumie,
    frameSet: {
      idle: 'baby_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    accentColor: 0xFFD97D,
  },
  sparky: {
    id: 'sparky',
    name: 'Sparky',
    description: 'Electric and playful. Needs extra play time.',
    palette: PALETTES.sparky,
    frameSet: {
      idle: 'baby_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    accentColor: 0x7DD9FF,
  },
  blossy: {
    id: 'blossy',
    name: 'Blossy',
    description: 'Sweet and social. Craves lots of attention.',
    palette: PALETTES.blossy,
    frameSet: {
      idle: 'baby_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    accentColor: 0xFFADD9,
  },
};

// ─── Evolution Tree ───────────────────────────────────────────────────────────
// Each node: { id, name, stage, palette, frameSet, description, rarity }
// rarity: 'common' | 'rare' | 'legendary'
export const EVOLUTIONS = {
  // Stage 1 — universal baby
  baby: {
    id: 'baby', name: null,  // name injected from species
    stage: 1, rarity: 'common',
    frameSet: {
      idle: 'baby_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
  },

  // Stage 2 — child
  puffi: {
    id: 'puffi', name: 'Puffi',
    stage: 2, rarity: 'common',
    requirement: 'feeding_dominant', // > 60% of interactions were feeding
    frameSet: {
      idle: 'child_puffi_idle', happy: 'child_puffi_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'child_puffi_sick', sad: 'baby_sad',
    },
  },
  zippi: {
    id: 'zippi', name: 'Zippi',
    stage: 2, rarity: 'common',
    requirement: 'play_dominant',
    frameSet: {
      idle: 'child_zippi_idle', happy: 'child_zippi_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
  },

  // Stage 3 — teen
  fluffi: {
    id: 'fluffi', name: 'Fluffi',
    stage: 3, rarity: 'common',
    parents: ['puffi'], requirement: 'good_care',
    frameSet: {
      idle: 'teen_fluffi_idle', happy: 'teen_fluffi_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
  },
  snuggi: {
    id: 'snuggi', name: 'Snuggi',
    stage: 3, rarity: 'common',
    parents: ['puffi'], requirement: 'balanced',
    frameSet: {
      idle: 'teen_snuggi_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
  },
  sparki_teen: {
    id: 'sparki_teen', name: 'Sparki',
    stage: 3, rarity: 'common',
    parents: ['zippi'], requirement: 'play_dominant',
    frameSet: {
      idle: 'teen_sparki_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
  },
  dazzi: {
    id: 'dazzi', name: 'Dazzi',
    stage: 3, rarity: 'common',
    parents: ['zippi'], requirement: 'sleep_dominant',
    frameSet: {
      idle: 'teen_dazzi_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
  },

  // Stage 4 — adult (2 per teen, rarity determined by care score)
  lumara: {
    id: 'lumara', name: 'Lumara',
    stage: 4, rarity: 'legendary',
    parents: ['fluffi'], requirement: 'perfect_care',
    palette: PALETTES.lumara,
    frameSet: {
      idle: 'adult_lumara_idle', happy: 'adult_lumara_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    description: 'The golden guardian. Radiates warmth and wisdom.',
  },
  cozyra: {
    id: 'cozyra', name: 'Cozyra',
    stage: 4, rarity: 'common',
    parents: ['fluffi', 'snuggi'], requirement: 'good_care',
    palette: PALETTES.cozyra,
    frameSet: {
      idle: 'adult_cozyra_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    description: 'Warm and comforting. Loves cozy evenings.',
  },
  dreamra: {
    id: 'dreamra', name: 'Dreamra',
    stage: 4, rarity: 'rare',
    parents: ['snuggi'], requirement: 'balanced',
    palette: PALETTES.dreamra,
    frameSet: {
      idle: 'adult_dreamra_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    description: 'A dreamer who drifts between worlds.',
  },
  starra: {
    id: 'starra', name: 'Starra',
    stage: 4, rarity: 'legendary',
    parents: ['dazzi'], requirement: 'perfect_care',
    palette: PALETTES.starra,
    frameSet: {
      idle: 'adult_starra_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    description: 'The legendary night wanderer. Appears only to devoted trainers.',
  },
  blazra: {
    id: 'blazra', name: 'Blazra',
    stage: 4, rarity: 'rare',
    parents: ['sparki_teen'], requirement: 'play_dominant',
    palette: PALETTES.blazra,
    frameSet: {
      idle: 'adult_blazra_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    description: 'Fast and fierce. Fueled by passion and play.',
  },
  calmra: {
    id: 'calmra', name: 'Calmra',
    stage: 4, rarity: 'common',
    parents: ['dazzi', 'sparki_teen'],
    requirement: 'balanced',
    palette: PALETTES.dreamra,  // reuse dreamra palette as a calm violet
    frameSet: {
      idle: 'adult_dreamra_idle', happy: 'baby_happy', eating: 'baby_eating',
      sleeping: 'baby_sleeping', sick: 'baby_sick', sad: 'baby_sad',
    },
    description: 'Quiet and serene. Finds beauty in stillness.',
  },
};

// Get the raw frame data by key
export function getFrame(key) {
  return F[key] ?? F['baby_idle'];
}

export const STARTER_SPECIES = ['lumie', 'sparky', 'blossy'];
export const STAGE_NAMES = ['Egg', 'Baby', 'Child', 'Teen', 'Adult'];

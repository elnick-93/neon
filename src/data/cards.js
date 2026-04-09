// ─── Card Definitions ─────────────────────────────────────────────────────────
// duration: 'one_clear' | 'permanent' | 'passive' | number (turns)
// category: 'economy' | 'board' | 'piece' | 'defense' | 'boss'

export const CARDS = {
  // ── Common ──────────────────────────────────────────────────────────────────
  NEON_SURGE: {
    id: 'NEON_SURGE', name: 'Neon Surge', rarity: 'common', category: 'economy',
    description: 'Your next line clear scores 3×.',
    duration: 'one_clear',
    onActivate(runState) { runState.scoreMultiplier = (runState.scoreMultiplier || 1) * 3; }
  },
  QUICK_STACK: {
    id: 'QUICK_STACK', name: 'Quick Stack', rarity: 'common', category: 'economy',
    description: 'Earn +50 bonus score for each piece placed this floor.',
    duration: 'passive',
    onActivate() {}
  },
  RECYCLER: {
    id: 'RECYCLER', name: 'Recycler', rarity: 'common', category: 'piece',
    description: 'Your piece queue refreshes once at no cost.',
    duration: 'one_clear',
    onActivate(runState) { runState.freeRefresh = true; }
  },
  SOLID_WALL: {
    id: 'SOLID_WALL', name: 'Solid Wall', rarity: 'common', category: 'defense',
    description: 'Gain +1 HP (max 6).',
    duration: 'immediate',
    onActivate(runState) { runState.hp = Math.min(runState.maxHp + 1, 6); runState.maxHp = Math.min(runState.maxHp + 1, 6); }
  },
  COMBO_PRIMER: {
    id: 'COMBO_PRIMER', name: 'Combo Primer', rarity: 'common', category: 'economy',
    description: 'Your first combo this floor is automatically 2×.',
    duration: 'passive',
    onActivate(runState) { runState.comboFloor = Math.max(runState.comboFloor || 0, 2); }
  },
  BLOCK_ECHO: {
    id: 'BLOCK_ECHO', name: 'Block Echo', rarity: 'common', category: 'piece',
    description: 'The next piece you place counts as placed twice.',
    duration: 'one_clear',
    onActivate(runState) { runState.echoPiece = true; }
  },
  SLOW_BURN: {
    id: 'SLOW_BURN', name: 'Slow Burn', rarity: 'common', category: 'economy',
    description: 'Each turn without a clear: +5 score bonus per piece placed.',
    duration: 'passive',
    onActivate() {}
  },
  IRON_SKIN: {
    id: 'IRON_SKIN', name: 'Iron Skin', rarity: 'common', category: 'defense',
    description: 'The next time you would take damage, ignore it.',
    duration: 'passive',
    onActivate(runState) { runState.damageShield = (runState.damageShield || 0) + 1; }
  },

  // ── Rare ─────────────────────────────────────────────────────────────────────
  BLOCK_SHATTER: {
    id: 'BLOCK_SHATTER', name: 'Block Shatter', rarity: 'rare', category: 'board',
    description: 'Next piece placed clears its entire row and column immediately.',
    duration: 'one_clear',
    onActivate(runState) { runState.shatterPiece = true; }
  },
  MIRROR_BOARD: {
    id: 'MIRROR_BOARD', name: 'Mirror Board', rarity: 'rare', category: 'board',
    description: 'Every clear also clears its mirrored position on the board.',
    duration: 5,
    onActivate() {}
  },
  CHAIN_REACTION: {
    id: 'CHAIN_REACTION', name: 'Chain Reaction', rarity: 'rare', category: 'economy',
    description: 'Cascades count as additional combos for scoring.',
    duration: 'passive',
    onActivate(runState) { runState.cascadeAsCombo = true; }
  },
  VOID_FILL: {
    id: 'VOID_FILL', name: 'Void Fill', rarity: 'rare', category: 'board',
    description: 'Randomly fill 3 empty cells with bonus blocks worth extra score.',
    duration: 'immediate',
    onActivate(runState) { runState.voidFillCount = (runState.voidFillCount || 0) + 3; }
  },
  SECOND_CHANCE: {
    id: 'SECOND_CHANCE', name: 'Second Chance', rarity: 'rare', category: 'defense',
    description: 'If you run out of moves, shuffle the board and try once more.',
    duration: 'passive',
    onActivate(runState) { runState.secondChance = true; }
  },
  NEON_STORM: {
    id: 'NEON_STORM', name: 'Neon Storm', rarity: 'rare', category: 'economy',
    description: 'For 3 turns, all clears score 2× and trigger visual effects.',
    duration: 3,
    onActivate(runState) { runState.stormTurns = 3; }
  },
  GRID_SHRINK: {
    id: 'GRID_SHRINK', name: 'Grid Shrink', rarity: 'rare', category: 'board',
    description: 'Reduce board to 6×6 for 4 turns — clears come faster.',
    duration: 4,
    onActivate(runState) { runState.boardShrink = 4; }
  },
  PIECE_HOARD: {
    id: 'PIECE_HOARD', name: 'Piece Hoard', rarity: 'rare', category: 'piece',
    description: 'Expand your piece queue to 5 pieces.',
    duration: 'permanent',
    onActivate(runState) { runState.queueSize = 5; }
  },
  COMBO_LOCK: {
    id: 'COMBO_LOCK', name: 'Combo Lock', rarity: 'rare', category: 'economy',
    description: 'Your combo counter never resets this floor.',
    duration: 'passive',
    onActivate(runState) { runState.comboLocked = true; }
  },
  BOARD_NUKE: {
    id: 'BOARD_NUKE', name: 'Board Nuke', rarity: 'rare', category: 'board',
    description: 'Clear all blocks in one random row and column. No scoring.',
    duration: 'immediate',
    onActivate(runState) { runState.boardNuke = true; }
  },

  // ── Legendary ────────────────────────────────────────────────────────────────
  VOID_PIECE: {
    id: 'VOID_PIECE', name: 'Void Piece', rarity: 'legendary', category: 'piece',
    description: 'Your next 3 pieces are wildcards that fit any gap.',
    duration: 'one_clear',
    onActivate(runState) { runState.voidPieces = (runState.voidPieces || 0) + 3; }
  },
  ECHO_BLAST: {
    id: 'ECHO_BLAST', name: 'Echo Blast', rarity: 'legendary', category: 'board',
    description: 'Duplicate your last clear pattern on the board.',
    duration: 'one_clear',
    onActivate(runState) { runState.echoBlast = true; }
  },
  INFINITE_COMBO: {
    id: 'INFINITE_COMBO', name: 'Infinite Combo', rarity: 'legendary', category: 'economy',
    description: 'This floor: every clear extends your combo by 2 extra levels.',
    duration: 'passive',
    onActivate(runState) { runState.infiniteCombo = true; }
  },
  TIME_WARP: {
    id: 'TIME_WARP', name: 'Time Warp', rarity: 'legendary', category: 'board',
    description: 'Undo your last 3 piece placements. Board reverts, score stays.',
    duration: 'immediate',
    onActivate(runState) { runState.timeWarpCharges = 3; }
  },
  OVERDRIVE: {
    id: 'OVERDRIVE', name: 'Overdrive', rarity: 'legendary', category: 'economy',
    description: 'All score from this floor is multiplied by your current floor number.',
    duration: 'passive',
    onActivate(runState) { runState.overdriveActive = true; }
  },
  PHANTOM_GRID: {
    id: 'PHANTOM_GRID', name: 'Phantom Grid', rarity: 'legendary', category: 'board',
    description: 'Every cleared row leaves a ghost row — fills in automatically next clear.',
    duration: 'passive',
    onActivate(runState) { runState.phantomGrid = true; }
  },
  BOSS_BANE: {
    id: 'BOSS_BANE', name: 'Boss Bane', rarity: 'legendary', category: 'boss',
    description: 'Next boss\'s shield HP is halved.',
    duration: 'passive',
    onActivate(runState) { runState.bossBane = true; }
  },
  HYPER_CASCADE: {
    id: 'HYPER_CASCADE', name: 'Hyper Cascade', rarity: 'legendary', category: 'board',
    description: 'Cascades have no depth limit this floor. Chain reactions go infinite.',
    duration: 'passive',
    onActivate(runState) { runState.hyperCascade = true; }
  },
};

// Weight tables for random draws (higher = more likely)
export const CARD_WEIGHTS = {
  common:    50,
  rare:      30,
  legendary: 10,
};

export const CARD_IDS = Object.keys(CARDS);

export const CARDS_BY_RARITY = {
  common:    CARD_IDS.filter(id => CARDS[id].rarity === 'common'),
  rare:      CARD_IDS.filter(id => CARDS[id].rarity === 'rare'),
  legendary: CARD_IDS.filter(id => CARDS[id].rarity === 'legendary'),
};

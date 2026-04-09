// ─── Boss Definitions ─────────────────────────────────────────────────────────
// Each boss appears at a BOSS_FLOOR and modifies the room mechanic.
// shieldCombos: number of combos needed to break shield before clears count.

export const BOSSES = {
  NEON_WALL: {
    id: 'NEON_WALL',
    name: 'The Neon Wall',
    floor: 5,
    description: 'A barrier of locked cells. Break my shield with 3 combos.',
    shieldCombos: 3,
    mechanic: 'LOCKED_CELLS',
    lockedCellCount: 6,
    color: 0xff007f,
  },
  GRID_REAPER: {
    id: 'GRID_REAPER',
    name: 'Grid Reaper',
    floor: 10,
    description: 'I shrink your board. Every 5 pieces placed, lose one column.',
    shieldCombos: 5,
    mechanic: 'POISON_BOARD',
    poisonInterval: 5,  // pieces placed per column reduction
    color: 0x7f00ff,
  },
  DARK_ORACLE: {
    id: 'DARK_ORACLE',
    name: 'The Dark Oracle',
    floor: 15,
    description: 'Fog of war. Only a 3×3 area around your last piece is visible.',
    shieldCombos: 4,
    mechanic: 'DARK_ROOM',
    visibleRadius: 1,  // cells visible around last placed piece
    color: 0x0088ff,
  },
  SPEED_DAEMON: {
    id: 'SPEED_DAEMON',
    name: 'Speed Daemon',
    floor: 20,
    description: '45 seconds to reach the clear target. No time for hesitation.',
    shieldCombos: 6,
    mechanic: 'SPEED_TRIAL',
    timeLimit: 45000,  // ms
    color: 0xffaa00,
  },
  VOID_KING: {
    id: 'VOID_KING',
    name: 'The Void King',
    floor: 25,
    description: 'Final boss. Locked cells + speed trial. 8 combos to break my shield.',
    shieldCombos: 8,
    mechanic: 'COMBINED',
    lockedCellCount: 8,
    timeLimit: 60000,
    color: 0xff4400,
  },
};

export function getBossForFloor(floor) {
  return Object.values(BOSSES).find(b => b.floor === floor) || null;
}

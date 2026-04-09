import { NEON_COLORS } from '../constants.js';

// Each shape is a 4×4 bitmask (array of 4 rows, each row 4 bits)
// 1 = filled cell, 0 = empty
export const BLOCK_SHAPES = {
  I: {
    id: 'I',
    name: 'I-Block',
    color: NEON_COLORS[0],  // cyan
    shapes: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],  // horizontal
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],  // vertical
    ]
  },
  O: {
    id: 'O',
    name: 'O-Block',
    color: NEON_COLORS[3],  // amber
    shapes: [
      [[0,0,0,0],[0,1,1,0],[0,1,1,0],[0,0,0,0]],
    ]
  },
  T: {
    id: 'T',
    name: 'T-Block',
    color: NEON_COLORS[2],  // violet
    shapes: [
      [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,0,0,0]],  // up
      [[0,0,0,0],[0,1,0,0],[0,1,1,0],[0,1,0,0]],  // right
      [[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,1,0,0]],  // down
      [[0,0,0,0],[0,1,0,0],[1,1,0,0],[0,1,0,0]],  // left
    ]
  },
  S: {
    id: 'S',
    name: 'S-Block',
    color: NEON_COLORS[4],  // green
    shapes: [
      [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,0,0,0],[1,1,0,0],[0,1,0,0]],
    ]
  },
  Z: {
    id: 'Z',
    name: 'Z-Block',
    color: NEON_COLORS[1],  // hot pink
    shapes: [
      [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,0,0,0],[0,0,1,0],[0,1,1,0],[0,1,0,0]],
    ]
  },
  J: {
    id: 'J',
    name: 'J-Block',
    color: NEON_COLORS[5],  // blue
    shapes: [
      [[0,0,0,0],[1,0,0,0],[1,1,1,0],[0,0,0,0]],
      [[0,0,0,0],[0,1,1,0],[0,1,0,0],[0,1,0,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,1,0,0],[0,1,0,0],[1,1,0,0]],
    ]
  },
  L: {
    id: 'L',
    name: 'L-Block',
    color: NEON_COLORS[6],  // orange-red
    shapes: [
      [[0,0,0,0],[0,0,1,0],[1,1,1,0],[0,0,0,0]],
      [[0,0,0,0],[0,1,0,0],[0,1,0,0],[0,1,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,0],[1,0,0,0]],
      [[0,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,0,0]],
    ]
  },
};

// Special unlockable pieces (cosmetic variants, same shapes as base)
export const SPECIAL_SHAPES = {
  DIAMOND: {
    id: 'DIAMOND',
    name: 'Diamond',
    color: 0xffffff,
    shapes: [
      [[0,0,0,0],[0,1,0,0],[1,1,1,0],[0,1,0,0]],  // plus/cross shape
    ]
  },
  DOT: {
    id: 'DOT',
    name: 'Dot',
    color: 0xffd700,
    shapes: [
      [[0,0,0,0],[0,1,0,0],[0,0,0,0],[0,0,0,0]],  // single cell
    ]
  },
};

export const ALL_PIECE_IDS = Object.keys(BLOCK_SHAPES);

/** Return a random rotation index for the given piece ID */
export function randomRotation(pieceId, rng) {
  const count = BLOCK_SHAPES[pieceId].shapes.length;
  return Math.floor(rng() * count);
}

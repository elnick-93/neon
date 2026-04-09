// ─── Board ────────────────────────────────────────────────────────────────────
export const BOARD_COLS = 8;
export const BOARD_ROWS = 8;
export const CELL_SIZE = 48;          // px per cell, scaled by Phaser

// ─── Dungeon ──────────────────────────────────────────────────────────────────
export const TOTAL_FLOORS = 25;
export const BOSS_FLOORS = [5, 10, 15, 20, 25];
export const BASE_CLEAR_TARGET = 20;  // blocks to clear per floor
export const CLEAR_TARGET_STEP = 5;   // +N per floor
export const STARTING_HP = 3;

// ─── Score ────────────────────────────────────────────────────────────────────
export const SCORE_PER_BLOCK = 10;
export const COMBO_MULTIPLIERS = [1, 1.5, 2, 3, 4, 5]; // index = combo depth
export const XP_PER_FLOOR = 10;
export const XP_PER_COMBO = 5;

// ─── Cards ────────────────────────────────────────────────────────────────────
export const CARD_PICK_COUNT = 3;       // cards shown at card select
export const MAX_ACTIVE_CARDS = 5;

// ─── Timing (ms) ─────────────────────────────────────────────────────────────
export const BLOCK_PLACE_TWEEN_MS = 80;
export const LINE_CLEAR_FLASH_MS = 150;
export const LINE_CLEAR_DISSOLVE_MS = 200;
export const CARD_SELECT_SLIDE_MS = 280;
export const BOSS_SHAKE_MS = 200;

// ─── Colors ───────────────────────────────────────────────────────────────────
export const COLOR_BG = 0x0a0a0f;
export const COLOR_GRID = 0x1a1a2e;
export const COLOR_GRID_LINE = 0x16213e;
export const COLOR_TEXT = 0xeeeeff;
export const COLOR_ACCENT = 0x00ffcc;

export const NEON_COLORS = [
  0x00ffcc,  // cyan
  0xff007f,  // hot pink
  0x7f00ff,  // violet
  0xffaa00,  // amber
  0x00ff44,  // green
  0x0088ff,  // blue
  0xff4400,  // orange-red
];

// ─── IAP Product IDs ──────────────────────────────────────────────────────────
export const IAP_PRODUCTS = {
  BASE_GAME:      'nbr_base_099',
  RAIDER_PASS:    'nbr_pass_299',
  SKIN_NEON_CITY: 'nbr_skin_neon',
  SKIN_CYBER:     'nbr_skin_cyber',
  BOOST_SHUFFLE:  'nbr_shuf_x3',
  BOOST_SKIP:     'nbr_skip_x1',
  BOOST_REVIVE:   'nbr_revive_x1',
  BUNDLE_STARTER: 'nbr_bundle_start',
};

// ─── Feature Flags ────────────────────────────────────────────────────────────
export const FEATURES = {
  LEADERBOARD:    false,  // enable when Firebase is live
  RAIDER_PASS:    false,  // enable after store IAP approval
  BOSS_VARIANTS:  1,      // number of boss mechanic types active
  REWARDED_ADS:   false,  // future hybrid-monetization toggle
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const STORAGE_PLAYER = 'nbr_player';
export const STORAGE_RUN    = 'nbr_run';
export const STORAGE_SETTINGS = 'nbr_settings';
export const STORAGE_SCHEMA_VERSION = 1;

// ─── RevenueCat API Keys ──────────────────────────────────────────────────────
// Replace with your actual keys from revenuecat.com dashboard
export const REVENUECAT_IOS_KEY     = 'appl_REPLACE_WITH_YOUR_KEY';
export const REVENUECAT_ANDROID_KEY = 'goog_REPLACE_WITH_YOUR_KEY';

// ─── Firebase Config ─────────────────────────────────────────────────────────
// Replace with your Firebase project config
export const FIREBASE_CONFIG = {
  apiKey:            'REPLACE_WITH_YOUR_KEY',
  authDomain:        'REPLACE.firebaseapp.com',
  projectId:         'REPLACE_WITH_YOUR_PROJECT',
  storageBucket:     'REPLACE.appspot.com',
  messagingSenderId: 'REPLACE',
  appId:             'REPLACE',
  measurementId:     'REPLACE',
};

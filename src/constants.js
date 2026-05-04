// ─── App Identity ─────────────────────────────────────────────────────────────
export const APP_NAME    = 'Lumipet';
export const APP_VERSION = '1.0.0';

// ─── Pet Stats ────────────────────────────────────────────────────────────────
export const STAT_MAX    = 100;
export const STAT_CRIT   = 20;   // below this = critical (visual warning)
export const STAT_LOW    = 35;   // below this = notification threshold

// Real-time decay: points lost per hour of real time
export const DECAY_HUNGER      = 6;    // full→empty in ~17 hours
export const DECAY_HAPPINESS   = 4;    // full→empty in ~25 hours
export const DECAY_CLEANLINESS = 3;    // full→empty in ~33 hours
export const DECAY_ENERGY      = 2;    // full→empty in ~50 hours (also restored by sleep)

// Health penalty: points lost per hour when any stat is critical
export const HEALTH_PENALTY_PER_CRIT_HOUR = 8;
// Death: health reaches 0 after ~12.5 hrs of total neglect at full critical
export const DEATH_HEALTH_THRESHOLD = 0;

// ─── Evolution Stage Thresholds (real hours) ──────────────────────────────────
export const EGG_HATCH_MINUTES    = 3;   // egg hatches 3 min after first login
export const STAGE_CHILD_HOURS    = 24;  // baby → child at 24h real time
export const STAGE_TEEN_HOURS     = 72;  // child → teen at 72h
export const STAGE_ADULT_HOURS    = 168; // teen → adult at 7 days

// ─── Care Score ───────────────────────────────────────────────────────────────
// Rolling care quality 0–100; determines which evolution branch you get.
export const CARE_PERFECT    = 85; // legendary evolution
export const CARE_GOOD       = 65; // rare evolution
// Below CARE_GOOD = common evolution

// ─── Play Mini-game ───────────────────────────────────────────────────────────
export const PLAY_DURATION_MS     = 15000; // 15 second sessions
export const PLAY_STAR_INTERVAL   = 900;   // new star every 0.9 s
export const PLAY_HAPPINESS_PER_STAR = 3;
export const PLAY_ENERGY_COST     = 8;     // per session

// ─── Colors / Theme ───────────────────────────────────────────────────────────
export const COLOR_BG        = 0x1a0e2e;  // deep purple night sky
export const COLOR_PANEL     = 0x2d1b4e;
export const COLOR_BORDER    = 0x7c4dff;
export const COLOR_TEXT      = 0xf0e6ff;
export const COLOR_ACCENT    = 0xf9a8d4;  // soft pink
export const COLOR_CRIT      = 0xff4d6d;
export const COLOR_OK        = 0x4ade80;
export const COLOR_WARN      = 0xfbbf24;

// Time-of-day palette (background sky gradient start color)
export const TIME_PALETTES = {
  dawn:    { sky: 0xfca5a5, ground: 0x86efac },  // 5–8
  morning: { sky: 0x7dd3fc, ground: 0x86efac },  // 8–12
  noon:    { sky: 0x38bdf8, ground: 0x4ade80 },  // 12–16
  evening: { sky: 0xfbbf24, ground: 0xa3e635 },  // 16–19
  dusk:    { sky: 0xf97316, ground: 0x86efac },  // 19–21
  night:   { sky: 0x1e1b4b, ground: 0x166534 },  // 21–5
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const STORAGE_PET      = 'lp_pet';
export const STORAGE_PLAYER   = 'lp_player';
export const STORAGE_SETTINGS = 'lp_settings';
export const STORAGE_SCHEMA   = 2;

// ─── IAP ──────────────────────────────────────────────────────────────────────
export const IAP_PRODUCTS = {
  BASE_GAME:      'lp_base_099',
  PET_HOTEL:      'lp_hotel_199',    // subscription: freeze decay while away
  EXTRA_PET_SLOT: 'lp_slot_199',
  GOURMET_PACK:   'lp_gourmet_099',  // 10× rare food items
  ACC_BUNDLE_1:   'lp_acc_bundle1',  // 5 accessories
  REVIVAL_CRYSTAL:'lp_revive_099',   // revive deceased pet
};

// ─── RevenueCat API keys (replace before shipping) ────────────────────────────
export const REVENUECAT_IOS_KEY     = 'appl_REPLACE_WITH_YOUR_KEY';
export const REVENUECAT_ANDROID_KEY = 'goog_REPLACE_WITH_YOUR_KEY';

// ─── Firebase config (replace before shipping) ────────────────────────────────
export const FIREBASE_CONFIG = {
  apiKey:            'REPLACE_WITH_YOUR_KEY',
  authDomain:        'REPLACE.firebaseapp.com',
  projectId:         'REPLACE_WITH_YOUR_PROJECT',
  storageBucket:     'REPLACE.appspot.com',
  messagingSenderId: 'REPLACE',
  appId:             'REPLACE',
};

// ─── Notification IDs ─────────────────────────────────────────────────────────
export const NOTIF_HUNGER     = 1;
export const NOTIF_HAPPINESS  = 2;
export const NOTIF_SICK       = 3;
export const NOTIF_EVOLVE     = 4;

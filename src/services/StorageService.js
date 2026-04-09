import {
  STORAGE_PLAYER, STORAGE_RUN, STORAGE_SETTINGS,
  STORAGE_SCHEMA_VERSION,
} from '../constants.js';

const DEFAULT_PLAYER = {
  schemaVersion: STORAGE_SCHEMA_VERSION,
  uid: null,
  level: 1,
  xp: 0,
  totalRuns: 0,
  bestFloor: 0,
  totalBlocksCleared: 0,
  unlockedSkins: ['default'],
  activeBoardSkin: 'default',
  activeBlockTheme: 'default',
  iapEntitlements: {
    base_game: false,
    raider_pass: false,
    raidPassExpiry: null,
    bundle_starter: false,
    skin_neon_city: false,
    skin_cyber: false,
    consumables: { shuffle: 0, skip: 0, revive: 0 },
  },
};

const DEFAULT_SETTINGS = {
  sfxVolume: 0.8,
  musicVolume: 0.6,
  haptics: true,
  notifications: true,
};

export class StorageService {
  constructor() {
    this._player = null;
    this._settings = null;
  }

  // ── Player State ─────────────────────────────────────────────────────────────

  loadPlayer() {
    try {
      const raw = localStorage.getItem(STORAGE_PLAYER);
      if (!raw) return this._initPlayer();
      const data = JSON.parse(raw);
      // Schema migration hook
      if (data.schemaVersion !== STORAGE_SCHEMA_VERSION) {
        return this._migrate(data);
      }
      this._player = data;
      return this._player;
    } catch {
      return this._initPlayer();
    }
  }

  savePlayer(player) {
    this._player = player;
    localStorage.setItem(STORAGE_PLAYER, JSON.stringify(player));
  }

  getPlayer() {
    return this._player || this.loadPlayer();
  }

  _initPlayer() {
    this._player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
    this.savePlayer(this._player);
    return this._player;
  }

  _migrate(data) {
    // Merge old data into defaults — forward-compatible
    const migrated = Object.assign(JSON.parse(JSON.stringify(DEFAULT_PLAYER)), data);
    migrated.schemaVersion = STORAGE_SCHEMA_VERSION;
    this._player = migrated;
    this.savePlayer(migrated);
    return migrated;
  }

  // ── Run State (crash recovery) ────────────────────────────────────────────────

  saveRun(runState) {
    // Store a slim version — boardState as Array, not Uint8Array
    const serialised = {
      ...runState,
      boardState: runState.boardState ? Array.from(runState.boardState) : null,
    };
    localStorage.setItem(STORAGE_RUN, JSON.stringify(serialised));
  }

  loadRun() {
    try {
      const raw = localStorage.getItem(STORAGE_RUN);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.boardState) {
        data.boardState = new Uint8Array(data.boardState);
      }
      return data;
    } catch {
      return null;
    }
  }

  clearRun() {
    localStorage.removeItem(STORAGE_RUN);
  }

  hasInterruptedRun() {
    return !!localStorage.getItem(STORAGE_RUN);
  }

  // ── Settings ─────────────────────────────────────────────────────────────────

  loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      this._settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      return this._settings;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  saveSettings(settings) {
    this._settings = settings;
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  }

  // ── XP / Level ───────────────────────────────────────────────────────────────

  addXP(amount) {
    const p = this.getPlayer();
    p.xp += amount;
    // Level-up: each level requires level * 100 XP
    let levelsGained = 0;
    while (p.xp >= p.level * 100) {
      p.xp -= p.level * 100;
      p.level++;
      levelsGained++;
    }
    this.savePlayer(p);
    return levelsGained;
  }

  updateRunStats(runState) {
    const p = this.getPlayer();
    p.totalRuns++;
    p.totalBlocksCleared += runState.blocksCleared || 0;
    if (runState.floor > p.bestFloor) p.bestFloor = runState.floor;
    this.savePlayer(p);
  }

  grantEntitlement(key, value = true) {
    const p = this.getPlayer();
    p.iapEntitlements[key] = value;
    this.savePlayer(p);
  }

  addConsumable(key, qty) {
    const p = this.getPlayer();
    p.iapEntitlements.consumables[key] = (p.iapEntitlements.consumables[key] || 0) + qty;
    this.savePlayer(p);
  }

  useConsumable(key) {
    const p = this.getPlayer();
    if (!p.iapEntitlements.consumables[key]) return false;
    p.iapEntitlements.consumables[key]--;
    this.savePlayer(p);
    return true;
  }

  hasConsumable(key) {
    const p = this.getPlayer();
    return (p.iapEntitlements.consumables[key] || 0) > 0;
  }

  hasEntitlement(key) {
    return !!(this.getPlayer().iapEntitlements[key]);
  }
}

// Singleton
export const storageService = new StorageService();

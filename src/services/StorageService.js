import { STORAGE_PET, STORAGE_PLAYER, STORAGE_SETTINGS, STORAGE_SCHEMA } from '../constants.js';

const DEFAULT_PLAYER = {
  schemaVersion: STORAGE_SCHEMA,
  uid:            null,
  level:          1,
  xp:             0,
  unlockedItems:  ['bg_pastel'],  // free background unlocked by default
  iapEntitlements: {
    base_game:    false,
    pet_hotel:    false,
    extra_slot:   false,
    bundle_acc_1: false,
    hotelExpiry:  null,
  },
  consumables: {
    gourmet_food: 0,
    revival:      0,
  },
  // Gourmet food inventory: { foodId: qty }
  foodInventory: {},
};

const DEFAULT_SETTINGS = {
  sfxVolume:    0.8,
  musicVolume:  0.6,
  haptics:      true,
  notifications: true,
};

export class StorageService {
  constructor() {
    this._player  = null;
    this._settings = null;
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  loadPlayer() {
    try {
      const raw = localStorage.getItem(STORAGE_PLAYER);
      if (!raw) { this._player = this._defaultPlayer(); return this._player; }
      const data = JSON.parse(raw);
      if (data.schemaVersion !== STORAGE_SCHEMA) {
        this._player = this._migrate(data);
      } else {
        this._player = data;
      }
    } catch {
      this._player = this._defaultPlayer();
    }
    return this._player;
  }

  getPlayer() {
    return this._player ?? this.loadPlayer();
  }

  savePlayer(p) {
    this._player = p;
    localStorage.setItem(STORAGE_PLAYER, JSON.stringify(p));
  }

  _defaultPlayer() {
    const p = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
    this.savePlayer(p);
    return p;
  }

  _migrate(old) {
    const p = { ...JSON.parse(JSON.stringify(DEFAULT_PLAYER)), ...old };
    p.schemaVersion = STORAGE_SCHEMA;
    this.savePlayer(p);
    return p;
  }

  // ── Pet ────────────────────────────────────────────────────────────────────

  /** Returns null if no pet exists. */
  loadPet() {
    try {
      const raw = localStorage.getItem(STORAGE_PET);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  savePet(pet) {
    localStorage.setItem(STORAGE_PET, JSON.stringify(pet));
  }

  clearPet() {
    localStorage.removeItem(STORAGE_PET);
  }

  hasPet() {
    return !!localStorage.getItem(STORAGE_PET);
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS);
      this._settings = raw
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
        : { ...DEFAULT_SETTINGS };
    } catch {
      this._settings = { ...DEFAULT_SETTINGS };
    }
    return this._settings;
  }

  getSettings() {
    return this._settings ?? this.loadSettings();
  }

  saveSettings(s) {
    this._settings = s;
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(s));
  }

  // ── IAP / Entitlements ─────────────────────────────────────────────────────

  hasEntitlement(key) {
    return !!(this.getPlayer().iapEntitlements?.[key]);
  }

  grantEntitlement(key, value = true) {
    const p = this.getPlayer();
    p.iapEntitlements[key] = value;
    this.savePlayer(p);
  }

  checkHotelExpiry() {
    const p = this.getPlayer();
    const expiry = p.iapEntitlements.hotelExpiry;
    if (expiry && Date.now() > expiry) {
      p.iapEntitlements.pet_hotel = false;
      this.savePlayer(p);
    }
  }

  addConsumable(key, qty) {
    const p = this.getPlayer();
    p.consumables[key] = (p.consumables[key] ?? 0) + qty;
    this.savePlayer(p);
  }

  useConsumable(key) {
    const p = this.getPlayer();
    if (!p.consumables[key]) return false;
    p.consumables[key]--;
    this.savePlayer(p);
    return true;
  }

  hasConsumable(key) {
    return (this.getPlayer().consumables?.[key] ?? 0) > 0;
  }

  // ── Food Inventory ─────────────────────────────────────────────────────────

  addFood(foodId, qty = 1) {
    const p = this.getPlayer();
    p.foodInventory = p.foodInventory ?? {};
    p.foodInventory[foodId] = (p.foodInventory[foodId] ?? 0) + qty;
    this.savePlayer(p);
  }

  useFood(foodId) {
    const p = this.getPlayer();
    if (!p.foodInventory?.[foodId]) return false;
    p.foodInventory[foodId]--;
    if (p.foodInventory[foodId] <= 0) delete p.foodInventory[foodId];
    this.savePlayer(p);
    return true;
  }

  getFoodInventory() {
    return this.getPlayer().foodInventory ?? {};
  }

  // ── Accessories ────────────────────────────────────────────────────────────

  unlockItem(itemId) {
    const p = this.getPlayer();
    if (!p.unlockedItems.includes(itemId)) {
      p.unlockedItems.push(itemId);
      this.savePlayer(p);
    }
  }

  hasItem(itemId) {
    return this.getPlayer().unlockedItems?.includes(itemId) ?? false;
  }

  // ── XP / Level ─────────────────────────────────────────────────────────────

  addXP(amount) {
    const p = this.getPlayer();
    p.xp += amount;
    let levelsGained = 0;
    while (p.xp >= p.level * 100) {
      p.xp -= p.level * 100;
      p.level++;
      levelsGained++;
    }
    this.savePlayer(p);
    return levelsGained;
  }
}

export const storageService = new StorageService();

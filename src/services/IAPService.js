import { REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY, IAP_PRODUCTS } from '../constants.js';
import { IAP_BY_ID } from '../data/iap.js';
import { storageService } from './StorageService.js';

/**
 * IAPService — wraps RevenueCat's purchases-capacitor SDK.
 * Falls back to storageService entitlements if SDK unavailable.
 */
class IAPService {
  constructor() {
    this._sdk = null;
    this._customerInfo = null;
    this._ready = false;
    this._listeners = [];
  }

  async init(uid = null) {
    try {
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      this._Purchases = Purchases;

      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const apiKey = isIOS ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey, appUserID: uid });

      if (uid) {
        await Purchases.logIn({ appUserID: uid });
      }

      this._customerInfo = await Purchases.getCustomerInfo();
      this._syncEntitlements(this._customerInfo.customerInfo);
      this._ready = true;
    } catch (err) {
      // SDK not available (web browser / dev mode) — use localStorage entitlements only
      console.warn('[IAPService] RevenueCat unavailable:', err.message);
      this._ready = true;
    }
  }

  /** Synchronous entitlement check (uses localStorage cache) */
  hasEntitlement(key) {
    return storageService.hasEntitlement(key);
  }

  /** Purchase a product by its catalogue ID */
  async purchase(productId) {
    const def = IAP_BY_ID[productId];
    if (!def) throw new Error(`Unknown product: ${productId}`);

    if (!this._Purchases) {
      // Dev mode: simulate purchase
      this._grantProduct(def);
      return { success: true, simulated: true };
    }

    try {
      const { customerInfo } = await this._Purchases.purchaseStoreProduct({
        product: await this._getStoreProduct(productId),
      });
      this._syncEntitlements(customerInfo);
      return { success: true };
    } catch (err) {
      if (err.code === 1) return { success: false, cancelled: true }; // user cancelled
      throw err;
    }
  }

  async _getStoreProduct(productId) {
    const { products } = await this._Purchases.getProducts({ productIdentifiers: [productId] });
    return products[0];
  }

  async restorePurchases() {
    if (!this._Purchases) return;
    const { customerInfo } = await this._Purchases.restorePurchases();
    this._syncEntitlements(customerInfo);
  }

  _syncEntitlements(customerInfo) {
    const entitlements = customerInfo?.entitlements?.active || {};

    // Base game
    if (entitlements['base_game']) {
      storageService.grantEntitlement('base_game');
    }

    // Raider Pass (subscription)
    if (entitlements['raider_pass']) {
      const expiry = entitlements['raider_pass'].expirationDate;
      storageService.grantEntitlement('raider_pass');
      storageService.grantEntitlement('raidPassExpiry', expiry ? new Date(expiry).getTime() : null);
    } else {
      storageService.grantEntitlement('raider_pass', false);
    }

    // One-time entitlements
    for (const key of ['bundle_starter', 'skin_neon_city', 'skin_cyber']) {
      if (entitlements[key]) storageService.grantEntitlement(key);
    }

    this._notifyListeners();
  }

  _grantProduct(def) {
    if (def.entitlement) {
      storageService.grantEntitlement(def.entitlement);
    }
    if (def.type === 'consumable' && def.consumableKey) {
      storageService.addConsumable(def.consumableKey, def.qty || 1);
    }
    this._notifyListeners();
  }

  onEntitlementChange(fn) {
    this._listeners.push(fn);
  }

  _notifyListeners() {
    for (const fn of this._listeners) fn();
  }

  checkRaidPassExpiry() {
    const p = storageService.getPlayer();
    const expiry = p.iapEntitlements.raidPassExpiry;
    if (expiry && Date.now() > expiry) {
      storageService.grantEntitlement('raider_pass', false);
    }
  }
}

export const iapService = new IAPService();

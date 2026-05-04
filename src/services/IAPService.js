import { REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY } from '../constants.js';
import { IAP_BY_ID } from '../data/iap.js';
import { storageService } from './StorageService.js';
import { ACCESSORIES } from '../data/accessories.js';

class IAPService {
  constructor() {
    this._Purchases = null;
    this._ready     = false;
    this._listeners = [];
  }

  async init(uid = null) {
    try {
      const { Purchases, LOG_LEVEL } = await import('@revenuecat/purchases-capacitor');
      this._Purchases = Purchases;
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: isIOS ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY, appUserID: uid });
      if (uid) await Purchases.logIn({ appUserID: uid });
      const { customerInfo } = await Purchases.getCustomerInfo();
      this._syncEntitlements(customerInfo);
      this._ready = true;
    } catch (err) {
      console.info('[IAPService] RevenueCat unavailable (dev mode):', err.message);
      this._ready = true;
    }
  }

  hasEntitlement(key) {
    return storageService.hasEntitlement(key);
  }

  async purchase(productId) {
    const def = IAP_BY_ID[productId];
    if (!def) throw new Error(`Unknown product: ${productId}`);

    if (!this._Purchases) {
      // Dev simulation
      this._grantDef(def);
      return { success: true, simulated: true };
    }

    try {
      const products = await this._Purchases.getProducts({ productIdentifiers: [productId] });
      const { customerInfo } = await this._Purchases.purchaseStoreProduct({ product: products.products[0] });
      this._syncEntitlements(customerInfo);
      this._grantConsumable(def);  // consumables aren't in entitlements
      return { success: true };
    } catch (err) {
      if (err.code === 1) return { success: false, cancelled: true };
      throw err;
    }
  }

  async restorePurchases() {
    if (!this._Purchases) return;
    const { customerInfo } = await this._Purchases.restorePurchases();
    this._syncEntitlements(customerInfo);
  }

  _syncEntitlements(customerInfo) {
    const active = customerInfo?.entitlements?.active ?? {};

    const keyMap = {
      base_game:    'base_game',
      pet_hotel:    'pet_hotel',
      extra_slot:   'extra_slot',
      bundle_acc_1: 'bundle_acc_1',
    };
    for (const [entKey, storeKey] of Object.entries(keyMap)) {
      if (active[entKey]) {
        storageService.grantEntitlement(storeKey);
        if (entKey === 'pet_hotel') {
          const expiry = active[entKey].expirationDate;
          storageService.grantEntitlement('hotelExpiry', expiry ? new Date(expiry).getTime() : null);
        }
      }
    }

    // Unlock accessories from bundle
    if (storageService.hasEntitlement('bundle_acc_1')) {
      Object.values(ACCESSORIES)
        .filter(a => a.bundle === 'lp_acc_bundle1')
        .forEach(a => storageService.unlockItem(a.id));
    }

    this._notify();
  }

  _grantDef(def) {
    if (def.entitlement) storageService.grantEntitlement(def.entitlement);
    this._grantConsumable(def);
    // Unlock bundle accessories in dev mode
    if (def.entitlement === 'bundle_acc_1') {
      Object.values(ACCESSORIES)
        .filter(a => a.bundle === 'lp_acc_bundle1')
        .forEach(a => storageService.unlockItem(a.id));
    }
    this._notify();
  }

  _grantConsumable(def) {
    if (def.type !== 'consumable') return;
    if (def.consumableKey === 'gourmet_food') {
      // Grant the gourmet food items to inventory
      const GOURMET = ['soup', 'honey', 'crystal_apple'];
      const perFood = Math.ceil((def.qty ?? 10) / GOURMET.length);
      GOURMET.forEach(id => storageService.addFood(id, perFood));
    } else if (def.consumableKey) {
      storageService.addConsumable(def.consumableKey, def.qty ?? 1);
    }
  }

  onEntitlementChange(fn) { this._listeners.push(fn); }
  _notify() { this._listeners.forEach(fn => fn()); }

  checkHotelExpiry() { storageService.checkHotelExpiry(); }
}

export const iapService = new IAPService();

import { iapService } from '../services/IAPService.js';
import { storageService } from '../services/StorageService.js';
import { ACCESSORIES } from '../data/accessories.js';
import { IAP_CATALOGUE } from '../data/iap.js';
import { COLOR_BG, COLOR_ACCENT, COLOR_PANEL, COLOR_BORDER, IAP_PRODUCTS } from '../constants.js';

const TABS = ['HOTEL', 'FOOD', 'ACCESSORIES'];

export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    const { width, height } = this.scale;
    this._tab = 'hotel';
    this._items = [];

    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Header
    this.add.text(width / 2, height * 0.065, 'SHOP', {
      fontSize: '22px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    // Tabs
    this._tabObjs = {};
    const tabW = width / TABS.length;
    TABS.forEach((label, i) => {
      const x = tabW * i + tabW / 2;
      const txt = this.add.text(x, height * 0.135, label, {
        fontSize: '12px', fontFamily: 'monospace', color: '#665588',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      txt.on('pointerup', () => this._switchTab(label.toLowerCase()));
      this._tabObjs[label.toLowerCase()] = txt;
    });

    // Tab underline
    this._underline = this.add.rectangle(tabW / 2, height * 0.16, tabW - 16, 2, COLOR_ACCENT);

    // Scroll region marker (used for y offset)
    this._contentStartY = height * 0.18;

    // Nav
    this.add.text(18, 20, '< BACK', {
      fontSize: '14px', fontFamily: 'monospace', color: '#4a3a6a',
    }).setInteractive({ useHandCursor: true }).on('pointerup', () => this.scene.start('MainScene'));

    this.add.text(width - 18, 20, 'RESTORE', {
      fontSize: '12px', fontFamily: 'monospace', color: '#3a2a5a',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerup', async () => {
      await iapService.restorePurchases();
      this._switchTab(this._tab);
    });

    this._switchTab('hotel');
  }

  _switchTab(tab) {
    this._tab = tab;
    this._items.forEach(o => o.destroy());
    this._items = [];

    // Highlight tab
    const tabW = this.scale.width / TABS.length;
    TABS.forEach((label, i) => {
      const key = label.toLowerCase();
      const active = key === tab;
      this._tabObjs[key].setColor(active ? `#${COLOR_ACCENT.toString(16).padStart(6, '0')}` : '#665588');
      if (active) {
        this._underline.setX(tabW * i + tabW / 2);
      }
    });

    const { width } = this.scale;
    let y = this._contentStartY;

    if (tab === 'hotel')       y = this._renderHotel(width, y);
    else if (tab === 'food')   y = this._renderFood(width, y);
    else if (tab === 'accessories') y = this._renderAccessories(width, y);
  }

  // ─── Pet Hotel ──────────────────────────────────────────────────────────────

  _renderHotel(width, y) {
    const hotelOwned = iapService.hasEntitlement('pet_hotel');
    const product = IAP_CATALOGUE.find(p => p.id === IAP_PRODUCTS.PET_HOTEL);

    // Hero card
    const card = this.add.rectangle(width / 2, y + 60, width - 32, 110, COLOR_PANEL)
      .setStrokeStyle(1, hotelOwned ? 0x4ade80 : 0x7c4dff);
    this._items.push(card);

    this._txt(width / 2, y + 22, '🏨  PET HOTEL', '15px', '#c084fc', 'center');
    this._txt(width / 2, y + 44, 'Pause stat decay while you\'re away.', '12px', '#9966cc', 'center');
    this._txt(width / 2, y + 60, 'Your Lumipet stays safe & happy', '11px', '#665588', 'center');
    this._txt(width / 2, y + 74, 'no matter how long you\'re gone.', '11px', '#665588', 'center');

    y += 100;

    if (hotelOwned) {
      this._txt(width / 2, y + 14, '✓ ACTIVE — Pet Hotel subscribed', '13px', '#4ade80', 'center');
      y += 42;
    } else {
      const btn = this._bigBtn(width / 2, y + 24, `SUBSCRIBE  ${product?.price ?? '$1.99/mo'}`, 0x7c4dff, async () => {
        const r = await this._buy(IAP_PRODUCTS.PET_HOTEL);
        if (r) this._switchTab('hotel');
      });
      y += 64;
    }

    y += 16;

    // Feature list
    const features = [
      '✦ Stat decay frozen while away',
      '✦ Auto-fed once per day',
      '✦ Weekly bonus gourmet food',
      '✦ Exclusive hotel room background',
    ];
    features.forEach(f => {
      this._txt(28, y, f, '12px', '#7c5d9c');
      y += 26;
    });

    return y;
  }

  // ─── Food ───────────────────────────────────────────────────────────────────

  _renderFood(width, y) {
    const product = IAP_CATALOGUE.find(p => p.id === IAP_PRODUCTS.GOURMET_PACK);
    const inventory = storageService.getFoodInventory();

    this._txt(width / 2, y + 10, 'GOURMET FOOD PACK', '14px', '#9966cc', 'center');
    this._txt(width / 2, y + 28, '10 rare food items for your Lumipet', '11px', '#665588', 'center');
    y += 50;

    // Item preview
    const items = [
      { emoji: '🍵', name: 'Glow Soup',    note: '+45 hunger  +10 happy' },
      { emoji: '🍯', name: 'Moon Honey',   note: '+30 hunger  +25 happy' },
      { emoji: '🍎', name: 'Crystal Apple',note: '+35 hunger  +20 happy' },
    ];
    items.forEach(item => {
      const row = this.add.rectangle(width / 2, y + 28, width - 32, 50, COLOR_PANEL)
        .setStrokeStyle(1, 0x3a2a5a);
      this._items.push(row);
      this._txt(28, y + 14, item.emoji, '20px', '#ffffff');
      this._txt(58, y + 14, item.name, '13px', '#ccccee');
      this._txt(58, y + 30, item.note, '10px', '#665588');

      // Show current qty if owned
      const soups = inventory['soup'] ?? 0;
      const honey = inventory['honey'] ?? 0;
      const apples = inventory['crystal_apple'] ?? 0;
      const qty = item.name === 'Glow Soup' ? soups : item.name === 'Moon Honey' ? honey : apples;
      if (qty > 0) {
        this._txt(width - 28, y + 22, `×${qty}`, '12px', '#9966cc', 'right');
      }
      y += 56;
    });

    y += 8;
    this._bigBtn(width / 2, y + 22, `BUY PACK  ${product?.price ?? '$0.99'}`, 0x7c4dff, async () => {
      const r = await this._buy(IAP_PRODUCTS.GOURMET_PACK);
      if (r) this._switchTab('food');
    });
    y += 60;

    // Revival crystal
    y += 8;
    const revProduct = IAP_CATALOGUE.find(p => p.id === IAP_PRODUCTS.REVIVAL_CRYSTAL);
    const revCount = storageService.getConsumableCount('revival');
    const revRow = this.add.rectangle(width / 2, y + 32, width - 32, 60, COLOR_PANEL)
      .setStrokeStyle(1, 0x5a2a8a);
    this._items.push(revRow);
    this._txt(28, y + 14, '💎', '20px', '#ffffff');
    this._txt(58, y + 14, 'Revival Crystal', '13px', '#c084fc');
    this._txt(58, y + 30, 'Revive your Lumipet once', '10px', '#665588');
    if (revCount > 0) this._txt(width - 28, y + 22, `×${revCount}`, '12px', '#9966cc', 'right');

    const revBtn = this.add.rectangle(width - 64, y + 32, 88, 34, 0x180830)
      .setStrokeStyle(1, 0x9966cc).setInteractive({ useHandCursor: true });
    this._items.push(revBtn);
    const revBtnTxt = this.add.text(width - 64, y + 32, revProduct?.price ?? '$0.99', {
      fontSize: '12px', fontFamily: 'monospace', color: '#9966cc',
    }).setOrigin(0.5);
    this._items.push(revBtnTxt);
    revBtn.on('pointerup', async () => {
      const r = await this._buy(IAP_PRODUCTS.REVIVAL_CRYSTAL);
      if (r) this._switchTab('food');
    });

    return y + 80;
  }

  // ─── Accessories ────────────────────────────────────────────────────────────

  _renderAccessories(width, y) {
    const player = storageService.getPlayer();
    const allItems = Object.values(ACCESSORIES);

    let section = null;
    allItems.forEach(acc => {
      const newSection = acc.unlockMethod === 'iap' ? 'IAP' : acc.unlockMethod === 'level' ? 'LEVEL' : 'FREE';
      if (newSection !== section) {
        section = newSection;
        const sectionLabel = section === 'IAP' ? 'SKY GARDEN BUNDLE  $2.99'
          : section === 'LEVEL' ? 'LEVEL REWARDS'
          : 'UNLOCKED';
        this._txt(20, y, sectionLabel, '10px', section === 'IAP' ? '#9966cc' : '#4a3a6a');
        y += 18;

        // Buy bundle button
        if (section === 'IAP') {
          const bundleOwned = iapService.hasEntitlement('bundle_acc_1');
          if (!bundleOwned) {
            const bundleBtn = this.add.rectangle(width - 80, y - 14, 110, 28, 0x0a0514)
              .setStrokeStyle(1, 0x7c4dff).setInteractive({ useHandCursor: true });
            this._items.push(bundleBtn);
            const bundleTxt = this.add.text(width - 80, y - 14, 'BUY ALL', {
              fontSize: '11px', fontFamily: 'monospace', color: '#9966cc',
            }).setOrigin(0.5);
            this._items.push(bundleTxt);
            bundleBtn.on('pointerup', async () => {
              const r = await this._buy(IAP_PRODUCTS.ACC_BUNDLE_1);
              if (r) this._switchTab('accessories');
            });
          }
        }
      }

      const owned = storageService.hasItem(acc.id)
        || (acc.unlockMethod === 'level' && player.level >= (acc.unlockLevel ?? 0))
        || acc.unlockMethod === 'free';

      const row = this.add.rectangle(width / 2, y + 26, width - 32, 48, COLOR_PANEL)
        .setStrokeStyle(1, owned ? 0x2d3a2d : 0x1a1a2e);
      this._items.push(row);

      this._txt(28, y + 12, acc.name, '13px', owned ? '#ccccee' : '#665588');
      const slotEmoji = acc.slot === 'hat' ? '🎩' : acc.slot === 'bg' ? '🖼' : '✨';
      this._txt(28, y + 28, `${slotEmoji} ${acc.slot.toUpperCase()}`, '9px', '#443355');

      const statusLabel = owned ? 'OWNED'
        : acc.unlockMethod === 'level' ? `LVL ${acc.unlockLevel}`
        : 'BUNDLE';
      const statusColor = owned ? '#4ade80' : '#665588';
      this._txt(width - 28, y + 22, statusLabel, '11px', statusColor, 'right');

      y += 54;
    });

    return y;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  _txt(x, y, str, size, color, align) {
    const obj = this.add.text(x, y, str, {
      fontSize: size, fontFamily: 'monospace', color,
      ...(align === 'center' ? {} : {}),
    });
    if (align === 'center') obj.setOrigin(0.5, 0);
    if (align === 'right')  obj.setOrigin(1, 0);
    this._items.push(obj);
    return obj;
  }

  _bigBtn(x, y, label, color, cb) {
    const hexC = `#${color.toString(16).padStart(6, '0')}`;
    const bg = this.add.rectangle(x, y, 240, 42, 0x0a0514)
      .setStrokeStyle(1, color).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'monospace', color: hexC,
    }).setOrigin(0.5);
    bg.on('pointerup', () => cb());
    bg.on('pointerover', () => bg.setFillStyle(color, 0.15));
    bg.on('pointerout', () => bg.setFillStyle(0x0a0514));
    this._items.push(bg, txt);
    return bg;
  }

  async _buy(productId) {
    try {
      const r = await iapService.purchase(productId);
      return r.success && !r.cancelled;
    } catch { return false; }
  }
}

import { iapService } from '../services/IAPService.js';
import { storageService } from '../services/StorageService.js';
import { IAP_CATALOGUE } from '../data/iap.js';
import { FEATURES, COLOR_ACCENT, COLOR_BG } from '../constants.js';

export class ShopScene extends Phaser.Scene {
  constructor() { super('ShopScene'); }

  create() {
    const { width, height } = this.scale;
    this._tab = 'boosters';

    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Header
    this.add.text(width / 2, height * 0.07, 'SHOP', {
      fontSize: '24px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    // Tabs
    this._tabs = {};
    const tabLabels = ['BOOSTERS', 'SKINS'];
    if (FEATURES.RAIDER_PASS) tabLabels.unshift('RAIDER PASS');

    tabLabels.forEach((label, i) => {
      const x = width / (tabLabels.length + 1) * (i + 1);
      const tab = this.add.text(x, height * 0.14, label, {
        fontSize: '13px', fontFamily: 'monospace', color: '#445566',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      tab.on('pointerup', () => {
        this._switchTab(label.toLowerCase().replace(' ', '_'));
      });
      this._tabs[label.toLowerCase().replace(' ', '_')] = tab;
    });

    // Content area
    this._contentY = height * 0.2;
    this._items = [];
    this._switchTab('boosters');

    // Back button
    const back = this.add.text(20, 20, '< BACK', {
      fontSize: '14px', fontFamily: 'monospace', color: '#445566',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MainMenuScene'));

    // Restore
    const restore = this.add.text(width - 20, 20, 'RESTORE', {
      fontSize: '12px', fontFamily: 'monospace', color: '#334455',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    restore.on('pointerup', async () => {
      await iapService.restorePurchases();
      this._switchTab(this._tab);
    });
  }

  _switchTab(tab) {
    this._tab = tab;
    // Clear previous items
    for (const item of this._items) item.destroy();
    this._items = [];

    // Highlight active tab
    for (const [key, txt] of Object.entries(this._tabs)) {
      txt.setColor(key === tab ? '#00ffcc' : '#445566');
    }

    const { width, height } = this.scale;
    let y = this._contentY + 20;

    const filtered = IAP_CATALOGUE.filter(p => {
      if (tab === 'boosters') return p.type === 'consumable';
      if (tab === 'skins') return p.entitlement?.startsWith('skin');
      if (tab === 'raider_pass') return p.type === 'subscription';
      return false;
    });

    for (const product of filtered) {
      const owned = product.entitlement && iapService.hasEntitlement(product.entitlement);
      this._productRow(width / 2, y, product, owned);
      y += 80;
    }
  }

  _productRow(x, y, product, owned) {
    const { width } = this.scale;
    const bg = this.add.rectangle(x, y, width - 40, 64, 0x111122)
      .setStrokeStyle(1, owned ? 0x00ff44 : 0x334455);
    const name = this.add.text(x - (width / 2 - 36), y - 12, product.name, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ccccee',
    });
    const desc = this.add.text(x - (width / 2 - 36), y + 8, product.description, {
      fontSize: '10px', fontFamily: 'monospace', color: '#445566',
      wordWrap: { width: width - 140 },
    });

    const btnLabel = owned ? 'OWNED' : product.price;
    const btnColor = owned ? 0x334455 : COLOR_ACCENT;
    const btnX = x + width / 2 - 70;
    const btnBg = this.add.rectangle(btnX, y, 100, 36, 0x0a1a0a)
      .setStrokeStyle(1, btnColor);
    const btnTxt = this.add.text(btnX, y, btnLabel, {
      fontSize: '13px', fontFamily: 'monospace',
      color: `#${btnColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    if (!owned) {
      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerup', async () => {
        try {
          const result = await iapService.purchase(product.id);
          if (result.success) {
            this._switchTab(this._tab);
          }
        } catch (err) {
          console.error('Purchase error:', err);
        }
      });
    }

    this._items.push(bg, name, desc, btnBg, btnTxt);
  }
}

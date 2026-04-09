import { iapService } from '../services/IAPService.js';
import { IAP_PRODUCTS } from '../constants.js';
import { COLOR_ACCENT, COLOR_BG } from '../constants.js';

export class PaywallScene extends Phaser.Scene {
  constructor() { super('PaywallScene'); }

  create() {
    const { width, height } = this.scale;

    // Dark overlay background
    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Neon border
    const border = this.add.graphics();
    border.lineStyle(2, COLOR_ACCENT, 1);
    border.strokeRect(24, height * 0.15, width - 48, height * 0.7);

    // Title
    this.add.text(width / 2, height * 0.22, 'NEON BLOCK RAID', {
      fontSize: '24px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    // Game description
    this.add.text(width / 2, height * 0.33, [
      'Block-blast puzzle meets',
      'roguelike dungeon crawler.',
      '',
      '25 floors of neon chaos.',
      'Cards. Bosses. Combos.',
      'No ads. Ever.',
    ].join('\n'), {
      fontSize: '14px', fontFamily: 'monospace', align: 'center', color: '#aaaacc',
    }).setOrigin(0.5);

    // Price button
    this._priceBtn(width / 2, height * 0.55);

    // Starter bundle upsell
    this._bundleBtn(width / 2, height * 0.67);

    // Restore purchases
    const restore = this.add.text(width / 2, height * 0.77, 'Restore Purchases', {
      fontSize: '12px', fontFamily: 'monospace', color: '#555588',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restore.on('pointerup', () => this._restore());

    // Back
    const back = this.add.text(24, height * 0.1, '< BACK', {
      fontSize: '14px', fontFamily: 'monospace', color: '#555588',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MainMenuScene'));
  }

  _priceBtn(x, y) {
    const { width } = this.scale;
    const bg = this.add.rectangle(x, y, 260, 52, 0x0a2a1a)
      .setStrokeStyle(2, COLOR_ACCENT).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 8, 'PLAY NOW', {
      fontSize: '20px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);
    this.add.text(x, y + 12, '$0.99 — One-time purchase', {
      fontSize: '11px', fontFamily: 'monospace', color: '#44cc88',
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x0d3a22));
    bg.on('pointerout', () => bg.setFillStyle(0x0a2a1a));
    bg.on('pointerup', () => this._purchase(IAP_PRODUCTS.BASE_GAME));
  }

  _bundleBtn(x, y) {
    const bg = this.add.rectangle(x, y, 260, 44, 0x1a0a2a)
      .setStrokeStyle(1, 0x7f00ff).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 6, 'STARTER BUNDLE — $3.99', {
      fontSize: '13px', fontFamily: 'monospace', color: '#aa66ff',
    }).setOrigin(0.5);
    this.add.text(x, y + 10, 'Game + Skin + 5 Boosters', {
      fontSize: '11px', fontFamily: 'monospace', color: '#665588',
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(0x22103a));
    bg.on('pointerout', () => bg.setFillStyle(0x1a0a2a));
    bg.on('pointerup', () => this._purchase(IAP_PRODUCTS.BUNDLE_STARTER));
  }

  async _purchase(productId) {
    try {
      const result = await iapService.purchase(productId);
      if (result.cancelled) return;
      if (result.success) {
        this.scene.start('GameScene', { resume: false });
      }
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  }

  async _restore() {
    await iapService.restorePurchases();
    if (iapService.hasEntitlement('base_game')) {
      this.scene.start('GameScene', { resume: false });
    }
  }
}

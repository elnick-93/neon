import { iapService } from '../services/IAPService.js';
import { IAP_PRODUCTS, COLOR_BG, COLOR_ACCENT } from '../constants.js';

export class PaywallScene extends Phaser.Scene {
  constructor() { super('PaywallScene'); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Animated pet preview using text emoji as placeholder
    const pet = this.add.text(width / 2, height * 0.2, '🥚', { fontSize: '72px' }).setOrigin(0.5);
    this.tweens.add({ targets: pet, scaleX: 1.08, scaleY: 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.add.text(width / 2, height * 0.38, 'LUMIPET', {
      fontSize: '32px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.47, [
      'Raise your own glowing companion.',
      'Feed it, play with it, watch it grow.',
      '',
      '12 unique evolutions to discover.',
      'Real-time care. Zero ads.',
    ].join('\n'), {
      fontSize: '13px', fontFamily: 'monospace',
      color: '#a88fc4', align: 'center',
    }).setOrigin(0.5);

    // Main CTA
    this._cta(width / 2, height * 0.63, 'ADOPT YOUR LUMIPET', '$0.99', COLOR_ACCENT, async () => {
      const r = await this._buy(IAP_PRODUCTS.BASE_GAME);
      if (r) this.scene.start('NewPetScene');
    });

    // Restore
    const restore = this.add.text(width / 2, height * 0.75, 'Restore Purchase', {
      fontSize: '12px', fontFamily: 'monospace', color: '#4a3a6a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restore.on('pointerup', async () => {
      await iapService.restorePurchases();
      if (iapService.hasEntitlement('base_game')) this.scene.start('NewPetScene');
    });
  }

  _cta(x, y, title, price, color, cb) {
    const c = `#${color.toString(16).padStart(6, '0')}`;
    const bg = this.add.rectangle(x, y, 270, 58, 0x1a0a2e)
      .setStrokeStyle(2, color).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 9, title, { fontSize: '15px', fontFamily: 'monospace', color: c }).setOrigin(0.5);
    this.add.text(x, y + 11, price, { fontSize: '13px', fontFamily: 'monospace', color: '#aaaacc' }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(color, 0.12));
    bg.on('pointerout',  () => bg.setFillStyle(0x1a0a2e));
    bg.on('pointerup',   () => cb());
  }

  async _buy(productId) {
    try {
      const r = await iapService.purchase(productId);
      return r.success && !r.cancelled;
    } catch { return false; }
  }
}

import { storageService } from '../services/StorageService.js';
import { iapService } from '../services/IAPService.js';
import { COLOR_ACCENT, COLOR_BG, COLOR_TEXT, FEATURES } from '../constants.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Animated grid lines
    this._drawGrid();

    // Title
    const title = this.add.text(width / 2, height * 0.2, 'NEON\nBLOCK RAID', {
      fontSize: '36px', fontFamily: 'monospace', align: 'center',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Pulse title
    this.tweens.add({
      targets: title,
      alpha: 0.75,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Stats panel
    const player = storageService.getPlayer();
    this.add.text(width / 2, height * 0.37, [
      `BEST FLOOR: ${player.bestFloor}`,
      `LEVEL: ${player.level}`,
      `RUNS: ${player.totalRuns}`,
    ].join('    '), {
      fontSize: '12px', fontFamily: 'monospace', color: '#666699',
    }).setOrigin(0.5);

    // PLAY button
    const hasGame = iapService.hasEntitlement('base_game');
    const playLabel = hasGame ? 'PLAY' : 'PLAY — $0.99';
    const playBtn = this._button(width / 2, height * 0.5, playLabel, COLOR_ACCENT, () => {
      this._onPlayPressed();
    });

    // SHOP button
    this._button(width / 2, height * 0.62, 'SHOP', 0x7f00ff, () => {
      this.scene.start('ShopScene');
    });

    // SETTINGS button
    this._button(width / 2, height * 0.72, 'SETTINGS', 0x334455, () => {
      this.scene.start('SettingsScene');
    });

    // Resume interrupted run prompt
    if (storageService.hasInterruptedRun()) {
      this._showResumePrompt(width, height);
    }

    // Leaderboard (if enabled)
    if (FEATURES.LEADERBOARD) {
      this._button(width / 2, height * 0.82, 'LEADERBOARD', 0x334455, () => {
        // TODO: show leaderboard overlay
      });
    }
  }

  _drawGrid() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.lineStyle(1, 0x1a1a2e, 0.5);
    const step = 40;
    for (let x = 0; x < width; x += step) g.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += step) g.lineBetween(0, y, width, y);
  }

  _button(x, y, label, color, callback) {
    const hexColor = `#${color.toString(16).padStart(6, '0')}`;
    const bg = this.add.rectangle(x, y, 220, 44, 0x111122)
      .setStrokeStyle(2, color).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontSize: '16px', fontFamily: 'monospace', color: hexColor,
    }).setOrigin(0.5);

    bg.on('pointerover', () => { bg.setFillStyle(color, 0.15); });
    bg.on('pointerout', () => { bg.setFillStyle(0x111122); });
    bg.on('pointerup', () => {
      this.tweens.add({ targets: [bg, txt], scaleX: 0.95, scaleY: 0.95, duration: 60, yoyo: true });
      callback();
    });

    return { bg, txt };
  }

  async _onPlayPressed() {
    if (!iapService.hasEntitlement('base_game')) {
      this.scene.start('PaywallScene');
      return;
    }
    this.scene.start('GameScene', { resume: false });
  }

  _showResumePrompt(width, height) {
    const overlay = this.add.rectangle(width / 2, height * 0.9, 320, 48, 0x0a0a0f, 0.95)
      .setStrokeStyle(1, 0xffaa00).setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(width / 2, height * 0.9, 'Resume interrupted run?', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffaa00',
    }).setOrigin(0.5).setDepth(11);

    overlay.on('pointerup', () => {
      this.scene.start('GameScene', { resume: true });
    });
  }
}

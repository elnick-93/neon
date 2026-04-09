import { storageService } from '../services/StorageService.js';
import { iapService } from '../services/IAPService.js';
import { IAP_PRODUCTS, COLOR_ACCENT, COLOR_BG, TOTAL_FLOORS } from '../constants.js';

export class RunCompleteScene extends Phaser.Scene {
  constructor() { super('RunCompleteScene'); }

  init(data) {
    this._runState = data.runState;
    this._score = data.score || 0;
    this._won = data.won || false;
    this._xpGained = data.xpGained || 0;
    this._hasRevive = data.hasRevive || false;
  }

  create() {
    const { width, height } = this.scale;
    const rs = this._runState;

    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Title
    const titleColor = this._won ? '#00ffcc' : '#ff4455';
    const titleText = this._won ? 'VICTORY!' : 'RUN OVER';
    this.add.text(width / 2, height * 0.14, titleText, {
      fontSize: '32px', fontFamily: 'monospace', color: titleColor,
    }).setOrigin(0.5);

    // Stats
    const player = storageService.getPlayer();
    const stats = [
      `FLOOR REACHED: ${rs.floor} / ${TOTAL_FLOORS}`,
      `SCORE: ${this._score.toLocaleString()}`,
      `BLOCKS CLEARED: ${rs.blocksCleared}`,
      `CARDS COLLECTED: ${rs.deck.length}`,
      `XP GAINED: +${this._xpGained}`,
      `TOTAL LEVEL: ${player.level}`,
    ];

    stats.forEach((line, i) => {
      this.add.text(width / 2, height * 0.26 + i * 28, line, {
        fontSize: '14px', fontFamily: 'monospace', color: '#aaaacc',
      }).setOrigin(0.5);
    });

    // Best floor indicator
    if (rs.floor >= player.bestFloor) {
      this.add.text(width / 2, height * 0.24, 'NEW BEST!', {
        fontSize: '12px', fontFamily: 'monospace', color: '#ffd700',
      }).setOrigin(0.5);
    }

    let btnY = height * 0.63;

    // Revive offer (only on death, not win, and not past floor 24)
    if (!this._won && this._hasRevive && rs.floor < TOTAL_FLOORS) {
      this._reviveBtn(width / 2, btnY);
      btnY += 58;
    }

    // Raider Pass upsell (engaged players — floor 3+)
    if (!this._won && rs.floor >= 3 && !iapService.hasEntitlement('raider_pass')) {
      this._raidPassUpsell(width / 2, btnY);
      btnY += 58;
    }

    // Play Again
    this._btn(width / 2, btnY, 'PLAY AGAIN', COLOR_ACCENT, () => {
      storageService.clearRun();
      this.scene.start('GameScene', { resume: false });
    });
    btnY += 54;

    // Main Menu
    this._btn(width / 2, btnY, 'MAIN MENU', 0x334455, () => {
      this.scene.start('MainMenuScene');
    });

    // Cards collected this run
    if (rs.deck.length > 0) {
      this._showDeckSummary(width, height);
    }
  }

  _reviveBtn(x, y) {
    const bg = this.add.rectangle(x, y, 260, 48, 0x1a0a0a)
      .setStrokeStyle(2, 0xff4455).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 7, 'USE REVIVE TOKEN', {
      fontSize: '15px', fontFamily: 'monospace', color: '#ff6677',
    }).setOrigin(0.5);
    this.add.text(x, y + 11, 'Continue at 1 HP', {
      fontSize: '11px', fontFamily: 'monospace', color: '#663344',
    }).setOrigin(0.5);

    bg.on('pointerup', () => {
      if (storageService.useConsumable('revive')) {
        this._runState.hp = 1;
        storageService.saveRun(this._runState);
        this.scene.start('GameScene', { resume: true });
      }
    });
  }

  _raidPassUpsell(x, y) {
    const bg = this.add.rectangle(x, y, 260, 48, 0x0a0a1a)
      .setStrokeStyle(1, 0x7f00ff).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 7, 'RAIDER PASS — $2.99/mo', {
      fontSize: '13px', fontFamily: 'monospace', color: '#aa66ff',
    }).setOrigin(0.5);
    this.add.text(x, y + 10, 'Skins + weekly boosters + gold frame', {
      fontSize: '10px', fontFamily: 'monospace', color: '#665588',
    }).setOrigin(0.5);

    bg.on('pointerup', async () => {
      try {
        const result = await iapService.purchase(IAP_PRODUCTS.RAIDER_PASS);
        if (result.success) this.scene.start('GameScene', { resume: false });
      } catch {}
    });
  }

  _btn(x, y, label, color, cb) {
    const hexC = `#${color.toString(16).padStart(6, '0')}`;
    const bg = this.add.rectangle(x, y, 220, 44, 0x111122)
      .setStrokeStyle(2, color).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: '16px', fontFamily: 'monospace', color: hexC,
    }).setOrigin(0.5);

    bg.on('pointerover', () => bg.setFillStyle(color, 0.12));
    bg.on('pointerout', () => bg.setFillStyle(0x111122));
    bg.on('pointerup', () => cb());
  }

  _showDeckSummary(width, height) {
    // Deck summary at bottom
    const deckY = height * 0.88;
    this.add.text(width / 2, deckY, `CARDS THIS RUN: ${this._runState.deck.join(', ')}`, {
      fontSize: '10px', fontFamily: 'monospace', color: '#334455', align: 'center',
      wordWrap: { width: width - 40 },
    }).setOrigin(0.5);
  }
}

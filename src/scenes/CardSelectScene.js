import { CardPickerUI } from '../ui/CardPickerUI.js';
import { COLOR_BG } from '../constants.js';

export class CardSelectScene extends Phaser.Scene {
  constructor() { super('CardSelectScene'); }

  init(data) {
    this._cards = data.cards || [];
    this._onSelect = data.onSelect;
  }

  create() {
    const { width, height } = this.scale;

    // Dim overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setInteractive(); // blocks clicks to GameScene

    // Header
    this.add.text(width / 2, height * 0.22, 'CHOOSE A CARD', {
      fontSize: '20px', fontFamily: 'monospace', color: '#00ffcc',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.28, 'Floor cleared — pick your upgrade', {
      fontSize: '12px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0.5);

    // Card picker
    this._picker = new CardPickerUI(this, this._cards, (cardId) => {
      this._select(cardId);
    });
  }

  _select(cardId) {
    // Slide out
    this.cameras.main.fadeOut(150, 0, 0, 0);
    this.time.delayedCall(150, () => {
      this.scene.stop();
      if (this._onSelect) this._onSelect(cardId);
    });
  }
}

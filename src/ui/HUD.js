import { COLOR_ACCENT, COLOR_TEXT, TOTAL_FLOORS } from '../constants.js';

/**
 * HUD — in-game overlay displaying floor, score, HP, and active cards.
 */
export class HUD {
  constructor(scene) {
    this.scene = scene;
    this._container = null;
    this._scoreText = null;
    this._floorText = null;
    this._hpText = null;
    this._bossBar = null;
    this._progressBar = null;
    this._cardIcons = [];
    this._build();
  }

  _build() {
    const { width } = this.scene.scale;
    const s = this.scene;

    // Background bar
    const bar = s.add.rectangle(width / 2, 28, width, 56, 0x0a0a0f, 0.9).setOrigin(0.5);

    // Floor
    this._floorText = s.add.text(16, 16, 'FLOOR 1', {
      fontSize: '14px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    });

    // Score
    this._scoreText = s.add.text(width / 2, 16, '0', {
      fontSize: '20px', fontFamily: 'monospace',
      color: '#ffffff', align: 'center',
    }).setOrigin(0.5, 0);

    // HP
    this._hpText = s.add.text(width - 16, 16, 'HP 3/3', {
      fontSize: '14px', fontFamily: 'monospace',
      color: '#ff4455', align: 'right',
    }).setOrigin(1, 0);

    // Progress bar (blocks cleared vs target)
    this._progressBg = s.add.rectangle(width / 2, 50, width - 32, 6, 0x333333).setOrigin(0.5);
    this._progressBar = s.add.rectangle(16, 50, 0, 6, COLOR_ACCENT).setOrigin(0, 0.5);

    this._container = s.add.container(0, 0, [
      bar, this._floorText, this._scoreText, this._hpText,
      this._progressBg, this._progressBar,
    ]);
    this._container.setDepth(100);
  }

  update(runState, score) {
    if (!runState) return;

    this._floorText.setText(`FLOOR ${runState.floor}/${TOTAL_FLOORS}`);
    this._scoreText.setText(score.toLocaleString());
    this._hpText.setText(`HP ${runState.hp}/${runState.maxHp}`);

    // Progress bar
    const { width } = this.scene.scale;
    const pct = Math.min(runState.floorBlocksCleared / runState.floorClearTarget, 1);
    const barW = (width - 32) * pct;
    this._progressBar.setSize(barW, 6);

    // Boss shield indicator
    if (runState.boss && !runState.bossDefeated) {
      if (!this._bossLabel) {
        this._bossLabel = this.scene.add.text(width / 2, 58, '', {
          fontSize: '11px', fontFamily: 'monospace', color: '#ff007f', align: 'center',
        }).setOrigin(0.5, 0).setDepth(101);
      }
      this._bossLabel.setText(
        `BOSS SHIELD: ${runState.bossShieldRemaining} combos remaining`
      );
    } else if (this._bossLabel) {
      this._bossLabel.destroy();
      this._bossLabel = null;
    }
  }

  showCombo(combo, x, y) {
    if (combo < 2) return;
    const txt = this.scene.add.text(x, y, `${combo}x COMBO!`, {
      fontSize: '22px', fontFamily: 'monospace',
      color: '#ffaa00', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: txt,
      y: y - 50,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 900,
      ease: 'Power2',
      onComplete: () => txt.destroy(),
    });
  }

  showScoreGain(gain, x, y) {
    const txt = this.scene.add.text(x, y, `+${gain}`, {
      fontSize: '16px', fontFamily: 'monospace',
      color: '#ffffff', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: txt,
      y: y - 30,
      alpha: 0,
      duration: 700,
      ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }

  destroy() {
    this._container?.destroy();
    this._bossLabel?.destroy();
  }
}

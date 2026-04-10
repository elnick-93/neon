import { STAT_MAX, STAT_CRIT, STAT_LOW, COLOR_OK, COLOR_WARN, COLOR_CRIT } from '../constants.js';

/**
 * StatusBar — renders the four pet stat bars (hunger, happiness, cleanliness, energy)
 * plus a health indicator at the top.
 */
export class StatusBar {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  - left edge
   * @param {number} y  - top edge
   * @param {number} w  - total width
   */
  constructor(scene, x, y, w) {
    this.scene = scene;
    this._x = x;
    this._y = y;
    this._w = w;
    this._bars  = {};
    this._labels = {};
    this._fills  = {};
    this._icons  = {};
    this._container = scene.add.container(0, 0).setDepth(80);

    this._build();
  }

  _build() {
    const STATS = [
      { key: 'hunger',      icon: '🍽', label: 'HUNGER'  },
      { key: 'happiness',   icon: '💕', label: 'HAPPY'   },
      { key: 'cleanliness', icon: '✨', label: 'CLEAN'   },
      { key: 'energy',      icon: '⚡', label: 'ENERGY'  },
    ];

    const barH  = 10;
    const gap   = 20;

    STATS.forEach((stat, i) => {
      const yPos = this._y + i * (barH + gap);

      // Icon
      const icon = this.scene.add.text(this._x, yPos + 1, stat.icon, { fontSize: '12px' });
      icon.setDepth(81);

      // Label
      const lbl = this.scene.add.text(this._x + 22, yPos, stat.label, {
        fontSize: '10px', fontFamily: 'monospace', color: '#888aaa',
      }).setDepth(81);

      // Background track
      const track = this.scene.add.rectangle(
        this._x + 22 + 52, yPos + barH / 2,
        this._w - 22 - 52, barH,
        0x2d1b4e
      ).setOrigin(0, 0.5).setDepth(81);

      // Fill
      const fill = this.scene.add.rectangle(
        this._x + 22 + 52, yPos + barH / 2,
        this._w - 22 - 52, barH,
        COLOR_OK
      ).setOrigin(0, 0.5).setDepth(82);

      this._bars[stat.key]   = track;
      this._fills[stat.key]  = fill;
      this._labels[stat.key] = lbl;
      this._icons[stat.key]  = icon;
    });
  }

  update(pet) {
    if (!pet) return;

    const STATS = ['hunger', 'happiness', 'cleanliness', 'energy'];
    const maxW = this._w - 22 - 52;

    STATS.forEach(key => {
      const val = pet[key] ?? 0;
      const fill = this._fills[key];
      if (!fill) return;

      const w = Math.max(0, (val / STAT_MAX) * maxW);
      fill.setSize(w, 10);

      // Color based on threshold
      if (val < STAT_CRIT) {
        fill.setFillStyle(COLOR_CRIT);
      } else if (val < STAT_LOW) {
        fill.setFillStyle(COLOR_WARN);
      } else {
        fill.setFillStyle(COLOR_OK);
      }
    });
  }

  setVisible(v) {
    Object.values(this._fills).forEach(f => f.setVisible(v));
    Object.values(this._bars).forEach(b => b.setVisible(v));
    Object.values(this._labels).forEach(l => l.setVisible(v));
    Object.values(this._icons).forEach(i => i.setVisible(v));
  }

  destroy() {
    [...Object.values(this._fills),
     ...Object.values(this._bars),
     ...Object.values(this._labels),
     ...Object.values(this._icons)].forEach(o => o?.destroy());
    this._container.destroy();
  }
}

import { COLOR_TEXT, COLOR_ACCENT } from '../constants.js';

/**
 * Non-blocking pop-up toast notification.
 * Usage: const toast = new ToastNotification(scene); toast.show('Card activated!');
 */
export class ToastNotification {
  constructor(scene) {
    this.scene = scene;
    this._container = null;
  }

  show(message, color = COLOR_ACCENT, duration = 2000) {
    if (this._container) {
      this._container.destroy();
    }

    const { width, height } = this.scene.scale;
    const bg = this.scene.add.rectangle(0, 0, Math.min(width * 0.8, 400), 50, 0x000000, 0.85)
      .setOrigin(0.5);
    const text = this.scene.add.text(0, 0, message, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: `#${color.toString(16).padStart(6, '0')}`,
      align: 'center',
    }).setOrigin(0.5);

    this._container = this.scene.add.container(width / 2, height * 0.15, [bg, text]);
    this._container.setDepth(1000);
    this._container.setAlpha(0);

    this.scene.tweens.add({
      targets: this._container,
      alpha: 1,
      y: height * 0.12,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.scene.time.delayedCall(duration, () => {
          this.scene.tweens.add({
            targets: this._container,
            alpha: 0,
            y: height * 0.09,
            duration: 300,
            onComplete: () => {
              if (this._container) {
                this._container.destroy();
                this._container = null;
              }
            },
          });
        });
      },
    });
  }
}

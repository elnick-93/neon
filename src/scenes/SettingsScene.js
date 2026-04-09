import { storageService } from '../services/StorageService.js';
import { hapticsService } from '../services/HapticsService.js';
import { iapService } from '../services/IAPService.js';
import { COLOR_ACCENT, COLOR_BG } from '../constants.js';

export class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }

  create() {
    const { width, height } = this.scale;
    this._settings = storageService.loadSettings();

    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    this.add.text(width / 2, height * 0.1, 'SETTINGS', {
      fontSize: '22px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    let y = height * 0.22;
    const lineH = 56;

    y = this._slider(width, y, 'SFX VOLUME', this._settings.sfxVolume, (v) => {
      this._settings.sfxVolume = v;
      storageService.saveSettings(this._settings);
    });

    y = this._slider(width, y + lineH, 'MUSIC VOLUME', this._settings.musicVolume, (v) => {
      this._settings.musicVolume = v;
      storageService.saveSettings(this._settings);
    });

    y = this._toggle(width, y + lineH, 'HAPTICS', this._settings.haptics, (v) => {
      this._settings.haptics = v;
      hapticsService.setEnabled(v);
      storageService.saveSettings(this._settings);
    });

    // Restore purchases
    const restoreY = y + lineH + 20;
    const restoreBtn = this.add.text(width / 2, restoreY, 'RESTORE PURCHASES', {
      fontSize: '14px', fontFamily: 'monospace', color: '#334466',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    restoreBtn.on('pointerup', async () => {
      await iapService.restorePurchases();
      restoreBtn.setColor('#00ff88');
      this.time.delayedCall(1500, () => restoreBtn.setColor('#334466'));
    });

    // Version info
    this.add.text(width / 2, height * 0.9, 'v1.0.0 — Neon Block Raid', {
      fontSize: '11px', fontFamily: 'monospace', color: '#222244',
    }).setOrigin(0.5);

    // Back
    const back = this.add.text(20, 20, '< BACK', {
      fontSize: '14px', fontFamily: 'monospace', color: '#445566',
    }).setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('MainMenuScene'));
  }

  _slider(width, y, label, value, onChange) {
    this.add.text(24, y, label, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaacc',
    });

    const trackX = 24, trackW = width - 48, trackH = 4;
    const track = this.add.rectangle(trackX + trackW / 2, y + 24, trackW, trackH, 0x222233)
      .setOrigin(0.5);
    const fill = this.add.rectangle(trackX, y + 24, trackW * value, trackH, COLOR_ACCENT)
      .setOrigin(0, 0.5);
    const thumb = this.add.circle(trackX + trackW * value, y + 24, 10, COLOR_ACCENT)
      .setInteractive({ draggable: true, useHandCursor: true });

    thumb.on('drag', (ptr, dx) => {
      const newX = Phaser.Math.Clamp(ptr.x, trackX, trackX + trackW);
      thumb.setPosition(newX, y + 24);
      const newVal = (newX - trackX) / trackW;
      fill.setSize(trackW * newVal, trackH);
      onChange(Math.round(newVal * 10) / 10);
    });

    return y;
  }

  _toggle(width, y, label, value, onChange) {
    this.add.text(24, y, label, {
      fontSize: '13px', fontFamily: 'monospace', color: '#aaaacc',
    });

    let state = value;
    const color = () => state ? COLOR_ACCENT : 0x334455;
    const bg = this.add.rectangle(width - 60, y + 8, 52, 26, color())
      .setInteractive({ useHandCursor: true });
    const knob = this.add.circle(state ? width - 40 : width - 72, y + 8, 10, 0xffffff);

    bg.on('pointerup', () => {
      state = !state;
      bg.setFillStyle(color());
      this.tweens.add({
        targets: knob,
        x: state ? width - 40 : width - 72,
        duration: 120,
      });
      onChange(state);
    });

    return y;
  }
}

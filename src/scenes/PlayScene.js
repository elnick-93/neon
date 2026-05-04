import { storageService } from '../services/StorageService.js';
import { hapticsService } from '../services/HapticsService.js';
import { PetSystem } from '../systems/PetSystem.js';
import {
  PLAY_DURATION_MS, PLAY_STAR_INTERVAL, PLAY_HAPPINESS_PER_STAR,
  COLOR_BG, COLOR_ACCENT, COLOR_CRIT,
} from '../constants.js';

/**
 * PlayScene — "Star Catch" mini-game.
 * Stars fall from the top; tap to catch each one.
 * Session: 15 seconds. Score drives happiness gain.
 */
export class PlayScene extends Phaser.Scene {
  constructor() { super('PlayScene'); }

  create() {
    this._pet = storageService.loadPet();
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0d0820);

    // Twinkling background stars (decorative, not interactive)
    for (let i = 0; i < 40; i++) {
      const s = this.add.text(
        Phaser.Math.Between(10, width - 10),
        Phaser.Math.Between(10, height - 10),
        '·', { fontSize: '8px', color: '#aabbff' }
      );
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(800, 2000), yoyo: true, repeat: -1 });
    }

    // HUD
    this._timerText = this.add.text(width / 2, 24, '', {
      fontSize: '18px', fontFamily: 'monospace', color: '#aabbff',
    }).setOrigin(0.5).setDepth(50);

    this._scoreText = this.add.text(width / 2, 48, '0 ⭐', {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFD97D',
    }).setOrigin(0.5).setDepth(50);

    // Pet energy check
    if (this._pet.energy < 10) {
      this._showTooTired(width, height);
      return;
    }

    // Game state
    this._stars     = [];
    this._caught    = 0;
    this._total     = 0;
    this._running   = true;
    this._elapsed   = 0;

    // Star spawner
    this._spawner = this.time.addEvent({
      delay: PLAY_STAR_INTERVAL,
      callback: this._spawnStar,
      callbackScope: this,
      loop: true,
    });

    // Countdown timer
    this._startTime = Date.now();
    this.time.addEvent({
      delay: 100,
      callback: this._updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Pet emoji at bottom center
    this._petEmoji = this.add.text(width / 2, height - 60, '😊', { fontSize: '48px' }).setOrigin(0.5).setDepth(10);
  }

  _spawnStar() {
    if (!this._running) return;
    const { width, height } = this.scale;
    const x     = Phaser.Math.Between(40, width - 40);
    const color = Phaser.Math.RND.pick(['⭐', '🌟', '✨']);
    const speed = Phaser.Math.Between(180, 320);  // pixels per second

    const star = this.add.text(x, -30, color, { fontSize: '32px' })
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    star.on('pointerup', () => this._catchStar(star));
    this._stars.push({ obj: star, speed });
    this._total++;
  }

  _catchStar(star) {
    if (!this._running) return;
    hapticsService.light();
    this._caught++;
    this._scoreText.setText(`${this._caught} ⭐`);

    // Pop and vanish animation
    this.tweens.add({
      targets: star,
      scaleX: 1.8, scaleY: 1.8,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        star.destroy();
        this._stars = this._stars.filter(s => s.obj !== star);
      },
    });

    // Particle burst
    const pt = this.add.text(star.x, star.y, '+' + PLAY_HAPPINESS_PER_STAR, {
      fontSize: '14px', fontFamily: 'monospace', color: '#FFD97D',
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: pt, y: pt.y - 40, alpha: 0, duration: 600, onComplete: () => pt.destroy() });
  }

  _updateTimer() {
    if (!this._running) return;
    const elapsed = Date.now() - this._startTime;
    const remaining = Math.max(0, PLAY_DURATION_MS - elapsed);
    const secs = Math.ceil(remaining / 1000);

    this._timerText.setText(`${secs}s`);
    if (remaining <= 3000) this._timerText.setColor('#ff4d6d');

    // Move stars down
    const dt = this.game.loop.delta / 1000;
    for (const { obj, speed } of this._stars) {
      obj.y += speed * dt;
    }
    // Remove stars that went off-screen (missed)
    this._stars = this._stars.filter(s => {
      if (s.obj.y > this.scale.height + 40) {
        s.obj.destroy();
        return false;
      }
      return true;
    });

    if (remaining <= 0) this._endGame();
  }

  _endGame() {
    this._running = false;
    this._spawner.remove();

    // Clean up remaining stars
    this._stars.forEach(s => s.obj.destroy());
    this._stars = [];

    // Update pet state
    this._pet = PetSystem.afterPlay(this._pet, this._caught, this._total);
    storageService.savePet({ ...this._pet, lastSeenTs: Date.now() });

    const { width, height } = this.scale;
    const perfect = this._caught === this._total && this._total > 0;

    const title = perfect ? '🌟 PERFECT! 🌟' : 'GREAT JOB!';
    this._petEmoji.setText(perfect ? '🥰' : '😄');

    this.add.text(width / 2, height * 0.38, title, {
      fontSize: '26px', fontFamily: 'monospace', color: '#FFD97D',
    }).setOrigin(0.5).setDepth(50);

    this.add.text(width / 2, height * 0.48, `Caught: ${this._caught} / ${this._total}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aabbff',
    }).setOrigin(0.5).setDepth(50);

    const happGain = this._caught * PLAY_HAPPINESS_PER_STAR + (perfect ? 15 : 0);
    this.add.text(width / 2, height * 0.56, `Happiness +${happGain}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#4ade80',
    }).setOrigin(0.5).setDepth(50);

    // Return button
    this.time.delayedCall(1200, () => {
      const btn = this.add.text(width / 2, height * 0.68, 'BACK TO PET', {
        fontSize: '18px', fontFamily: 'monospace',
        color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5).setDepth(50).setInteractive({ useHandCursor: true });
      btn.on('pointerup', () => this.scene.start('MainScene'));
    });
  }

  _showTooTired(width, height) {
    this._spawner?.remove();
    this.add.text(width / 2, height * 0.45, '😴', { fontSize: '64px' }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.58, `${this._pet.name} is too tired to play!`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aabbff', align: 'center',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.65, 'Let them sleep first.', {
      fontSize: '12px', fontFamily: 'monospace', color: '#4a3a6a',
    }).setOrigin(0.5);
    this.time.delayedCall(2500, () => this.scene.start('MainScene'));
  }
}

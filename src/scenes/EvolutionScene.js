import { storageService } from '../services/StorageService.js';
import { hapticsService } from '../services/HapticsService.js';
import { PetSprite } from '../ui/PetSprite.js';
import { EVOLUTIONS, STAGE_NAMES } from '../data/pets.js';
import { COLOR_BG, COLOR_ACCENT } from '../constants.js';

export class EvolutionScene extends Phaser.Scene {
  constructor() { super('EvolutionScene'); }

  init(data) {
    this._pet       = data.pet;
    this._targetId  = data.targetId;
    this._fromBoot  = data.fromBoot ?? false;
  }

  create() {
    const { width, height } = this.scale;
    const evo = EVOLUTIONS[this._targetId];

    // Dark starfield background
    this.add.rectangle(width / 2, height / 2, width, height, 0x040210);
    for (let i = 0; i < 80; i++) {
      const star = this.add.rectangle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3),
        0xffffff, Phaser.Math.FloatBetween(0.2, 0.9)
      );
      this.tweens.add({ targets: star, alpha: 0.1, duration: Phaser.Math.Between(600, 2000), yoyo: true, repeat: -1 });
    }

    // Flash rings
    this._rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = this.add.circle(width / 2, height * 0.42, 10, COLOR_ACCENT, 0.8).setDepth(5);
      this._rings.push(ring);
      this.tweens.add({
        targets: ring, scaleX: 8, scaleY: 8, alpha: 0,
        duration: 1200, repeat: -1, delay: i * 400, ease: 'Power2',
      });
    }

    // "Evolving..." text
    const evolveText = this.add.text(width / 2, height * 0.18, `${this._pet.name} is evolving!`, {
      fontSize: '18px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.tweens.add({ targets: evolveText, alpha: 1, duration: 600 });

    // Pet sprite (pre-evolution)
    this._sprite = new PetSprite(this, width / 2, height * 0.42, { ...this._pet, evolutionId: null });

    // Sequence
    this.time.delayedCall(1200, () => {
      hapticsService.heavy();
      this._sprite.playEvolutionFlash(() => {
        // Show evolved pet
        this._sprite.update(this._pet);
        this._revealNewForm(width, height, evo);
      });
    });
  }

  _revealNewForm(width, height, evo) {
    hapticsService.success();

    // Fade in reveal
    this.cameras.main.flash(400, 255, 255, 255);

    const name = evo?.name ?? STAGE_NAMES[this._pet.stage] ?? 'Unknown';
    const rarity = evo?.rarity ?? 'common';
    const rarityColor = { legendary: 0xFFD700, rare: 0x7DD9FF, common: COLOR_ACCENT }[rarity];
    const rarityHex = `#${rarityColor.toString(16).padStart(6, '0')}`;

    this.add.text(width / 2, height * 0.18, `${this._pet.name} became...`, {
      fontSize: '15px', fontFamily: 'monospace', color: '#aabbff',
    }).setOrigin(0.5).setDepth(20);

    const nameText = this.add.text(width / 2, height * 0.25, name.toUpperCase(), {
      fontSize: '28px', fontFamily: 'monospace', color: rarityHex,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0).setDepth(20);

    this.tweens.add({ targets: nameText, alpha: 1, scaleX: 1.1, scaleY: 1.1, duration: 400, yoyo: true });

    if (rarity !== 'common') {
      this.add.text(width / 2, height * 0.32, `✨ ${rarity.toUpperCase()} EVOLUTION ✨`, {
        fontSize: '13px', fontFamily: 'monospace', color: rarityHex,
      }).setOrigin(0.5).setDepth(20);
    }

    if (evo?.description) {
      this.add.text(width / 2, height * 0.69, `"${evo.description}"`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#665588',
        align: 'center', wordWrap: { width: width - 48 },
      }).setOrigin(0.5).setDepth(20);
    }

    // Hearts / sparkles
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 120, () => {
        const x = Phaser.Math.Between(20, width - 20);
        const y = Phaser.Math.Between(height * 0.1, height * 0.8);
        const t = this.add.text(x, y, '✨', { fontSize: '16px' }).setDepth(30).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, y: t.y - 40, duration: 800, ease: 'Power2',
          onComplete: () => t.destroy() });
      });
    }

    // Continue button
    this.time.delayedCall(1800, () => {
      const btn = this.add.text(width / 2, height * 0.84, 'CONTINUE →', {
        fontSize: '18px', fontFamily: 'monospace',
        color: `#${rarityColor.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });
      btn.on('pointerup', () => {
        storageService.savePet({ ...this._pet, lastSeenTs: Date.now() });
        this.scene.start('MainScene');
      });
    });
  }

  shutdown() {
    this._sprite?.destroy();
  }
}

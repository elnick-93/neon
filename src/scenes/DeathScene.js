import { storageService } from '../services/StorageService.js';
import { iapService } from '../services/IAPService.js';
import { PetSystem } from '../systems/PetSystem.js';
import { hapticsService } from '../services/HapticsService.js';
import { IAP_PRODUCTS, COLOR_BG } from '../constants.js';
import { EVOLUTIONS, STAGE_NAMES } from '../data/pets.js';

export class DeathScene extends Phaser.Scene {
  constructor() { super('DeathScene'); }

  create() {
    const pet = storageService.loadPet();
    const { width, height } = this.scale;

    hapticsService.heavy();

    this.add.rectangle(width / 2, height / 2, width, height, 0x080410);

    // Ghost / memorial
    const ghost = this.add.text(width / 2, height * 0.22, '👻', { fontSize: '64px' }).setOrigin(0.5);
    this.tweens.add({ targets: ghost, y: ghost.y - 12, alpha: 0.7, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const evoName = pet?.evolutionId
      ? (EVOLUTIONS[pet.evolutionId]?.name ?? 'Unknown')
      : (STAGE_NAMES[pet?.stage ?? 0] ?? 'Baby');

    this.add.text(width / 2, height * 0.38, `${pet?.name ?? 'Your Lumipet'} (${evoName})`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.45, 'has passed away. 💜', {
      fontSize: '14px', fontFamily: 'monospace', color: '#665588',
    }).setOrigin(0.5);

    const ageHours = Math.floor((pet?.ageMs ?? 0) / 3_600_000);
    const ageDays  = Math.floor(ageHours / 24);
    this.add.text(width / 2, height * 0.52, ageDays > 0 ? `Lived ${ageDays} days.` : `Lived ${ageHours} hours.`, {
      fontSize: '12px', fontFamily: 'monospace', color: '#443355',
    }).setOrigin(0.5);

    let y = height * 0.63;

    // Revival option (if they have a crystal)
    const hasRevival = storageService.hasConsumable('revival');
    if (hasRevival) {
      this._btn(width / 2, y, '💎 USE REVIVAL CRYSTAL', 0x9966cc, async () => {
        if (storageService.useConsumable('revival')) {
          const revived = PetSystem.revive(pet);
          storageService.savePet({ ...revived, lastSeenTs: Date.now() });
          this.scene.start('MainScene');
        }
      });
      y += 58;
    } else {
      // Upsell revival
      this._btn(width / 2, y, '💎 REVIVE — $0.99', 0x7f00ff, async () => {
        const r = await this._buy(IAP_PRODUCTS.REVIVAL_CRYSTAL);
        if (r) {
          const revived = PetSystem.revive(pet);
          storageService.savePet({ ...revived, lastSeenTs: Date.now() });
          this.scene.start('MainScene');
        }
      });
      y += 58;
    }

    // Start over
    this._btn(width / 2, y, 'RAISE A NEW LUMIPET', 0x4a3a6a, () => {
      storageService.clearPet();
      this.scene.start('NewPetScene');
    });
  }

  _btn(x, y, label, color, cb) {
    const hexC = `#${color.toString(16).padStart(6, '0')}`;
    const bg = this.add.rectangle(x, y, 260, 46, 0x0a0514)
      .setStrokeStyle(1, color).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontSize: '13px', fontFamily: 'monospace', color: hexC }).setOrigin(0.5);
    bg.on('pointerup', () => cb());
  }

  async _buy(productId) {
    try {
      const r = await iapService.purchase(productId);
      return r.success && !r.cancelled;
    } catch { return false; }
  }
}

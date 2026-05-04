import { iapService } from '../services/IAPService.js';
import { firebaseService } from '../services/FirebaseService.js';
import { storageService } from '../services/StorageService.js';
import { hapticsService } from '../services/HapticsService.js';
import { notificationSystem } from '../systems/NotificationSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { PetSystem } from '../systems/PetSystem.js';
import { EvolutionSystem } from '../systems/EvolutionSystem.js';
import { COLOR_BG, COLOR_ACCENT } from '../constants.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const { width, height } = this.scale;

    // Splash logo text
    this.add.text(width / 2, height * 0.42, '✨', { fontSize: '48px' }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.54, 'LUMIPET', {
      fontSize: '30px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Loading bar
    const barW = width * 0.5;
    this.add.rectangle(width / 2, height * 0.65, barW, 6, 0x2d1b4e).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - barW / 2, height * 0.65, 0, 6, COLOR_ACCENT).setOrigin(0, 0.5);
    this.load.on('progress', v => bar.setSize(barW * v, 6));

    // Audio assets (uncomment when you have files)
    // this.load.audio('music_main',  'assets/audio/main.ogg');
    // this.load.audio('sfx_feed',    'assets/audio/feed.ogg');
    // this.load.audio('sfx_play',    'assets/audio/play.ogg');
    // this.load.audio('sfx_clean',   'assets/audio/clean.ogg');
    // this.load.audio('sfx_evolve',  'assets/audio/evolve.ogg');
    // this.load.audio('sfx_tap',     'assets/audio/tap.ogg');
    // this.load.audio('sfx_death',   'assets/audio/death.ogg');
  }

  async create() {
    storageService.loadPlayer();
    storageService.loadSettings();

    await Promise.allSettled([
      iapService.init(storageService.getPlayer().uid),
      firebaseService.init(),
    ]);

    iapService.checkHotelExpiry();

    // Sync Firebase UID → player
    if (firebaseService.uid && !storageService.getPlayer().uid) {
      const p = storageService.getPlayer();
      p.uid = firebaseService.uid;
      storageService.savePlayer(p);
    }

    // Apply real-time decay to pet while the app was closed
    const pet = storageService.loadPet();
    if (pet?.isAlive) {
      const elapsed = Date.now() - (pet.lastSeenTs ?? Date.now());
      const hotelActive = iapService.hasEntitlement('pet_hotel');
      const { pet: updated, died } = TimeSystem.applyDecay(pet, elapsed, hotelActive);

      if (died) {
        const dead = PetSystem.kill(updated);
        storageService.savePet({ ...dead, lastSeenTs: Date.now() });
      } else {
        // Also check evolution while we were away
        const { shouldEvolve, targetId } = EvolutionSystem.check(updated);
        if (shouldEvolve) {
          const evolved = PetSystem.evolve(updated, targetId);
          storageService.savePet({ ...evolved, lastSeenTs: Date.now() });
          this.scene.start('EvolutionScene', { pet: evolved, targetId, fromBoot: true });
          return;
        }
        storageService.savePet({ ...updated, lastSeenTs: Date.now() });
      }

      // Reschedule notifications based on fresh stats
      await notificationSystem.reschedule(storageService.loadPet());
    }

    this.time.delayedCall(600, () => this._navigate());
  }

  _navigate() {
    if (!iapService.hasEntitlement('base_game')) {
      this.scene.start('PaywallScene');
      return;
    }
    const pet = storageService.loadPet();
    if (!pet) {
      this.scene.start('NewPetScene');
      return;
    }
    if (!pet.isAlive) {
      this.scene.start('DeathScene');
      return;
    }
    this.scene.start('MainScene');
  }
}

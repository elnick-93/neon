import { iapService } from '../services/IAPService.js';
import { firebaseService } from '../services/FirebaseService.js';
import { storageService } from '../services/StorageService.js';
import { hapticsService } from '../services/HapticsService.js';
import { COLOR_BG, COLOR_ACCENT } from '../constants.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const { width, height } = this.scale;

    // Loading bar background
    const barBg = this.add.rectangle(width / 2, height / 2 + 60, width * 0.6, 8, 0x222222);
    const bar = this.add.rectangle(
      width / 2 - width * 0.3, height / 2 + 60, 0, 8, COLOR_ACCENT
    ).setOrigin(0, 0.5);

    this.add.text(width / 2, height / 2, 'NEON BLOCK RAID', {
      fontSize: '28px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.setSize(width * 0.6 * value, 8);
    });

    // Placeholder audio — replace with real assets
    // this.load.audio('music_zone1', 'assets/audio/zone1.ogg');
    // this.load.audio('sfx_place',   'assets/audio/place.ogg');
    // this.load.audio('sfx_clear',   'assets/audio/clear.ogg');
    // this.load.audio('sfx_combo2',  'assets/audio/combo2.ogg');
    // this.load.audio('sfx_boss',    'assets/audio/boss.ogg');
    // this.load.audio('sfx_death',   'assets/audio/death.ogg');
    // this.load.audio('sfx_win',     'assets/audio/win.ogg');
    // this.load.audio('sfx_card',    'assets/audio/card.ogg');
  }

  async create() {
    // Init services
    storageService.loadPlayer();
    storageService.loadSettings();

    // IAP and Firebase init in parallel — both fail gracefully
    await Promise.allSettled([
      iapService.init(storageService.getPlayer().uid),
      firebaseService.init(),
    ]);

    iapService.checkRaidPassExpiry();

    // Sync Firebase UID to player
    if (firebaseService.uid && !storageService.getPlayer().uid) {
      const p = storageService.getPlayer();
      p.uid = firebaseService.uid;
      storageService.savePlayer(p);
    }

    // Short splash delay
    this.time.delayedCall(800, () => {
      this.scene.start('MainMenuScene');
    });
  }
}

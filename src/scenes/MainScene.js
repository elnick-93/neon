import { storageService } from '../services/StorageService.js';
import { iapService } from '../services/IAPService.js';
import { hapticsService } from '../services/HapticsService.js';
import { notificationSystem } from '../systems/NotificationSystem.js';
import { PetSystem } from '../systems/PetSystem.js';
import { EvolutionSystem } from '../systems/EvolutionSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { PetSprite } from '../ui/PetSprite.js';
import { StatusBar } from '../ui/StatusBar.js';
import { ToastNotification } from '../ui/ToastNotification.js';
import { ACCESSORIES } from '../data/accessories.js';
import { STAGE_NAMES } from '../data/pets.js';
import {
  COLOR_BG, COLOR_ACCENT, COLOR_PANEL, COLOR_BORDER,
  TIME_PALETTES,
} from '../constants.js';

export class MainScene extends Phaser.Scene {
  constructor() { super('MainScene'); }

  init(data) {
    this._newPet = data?.newPet ?? false;
  }

  create() {
    this._pet  = storageService.loadPet();
    this._audio = new AudioSystem(this);
    this._audio.applySetting(storageService.getSettings());

    const { width, height } = this.scale;

    // ── Background ───────────────────────────────────────────────────────────
    this._drawBackground(width, height);

    // ── Habitat panel (where pet lives) ──────────────────────────────────────
    const panelY = height * 0.18;
    const panelH = height * 0.48;
    this._habitatPanel = this.add.rectangle(width / 2, panelY + panelH / 2, width - 32, panelH, COLOR_PANEL, 0.85)
      .setStrokeStyle(2, COLOR_BORDER).setDepth(5);

    // ── Pet name + stage tag ──────────────────────────────────────────────────
    this._nameText = this.add.text(width / 2, panelY + 16, `${this._pet.name}`, {
      fontSize: '18px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5, 0).setDepth(10);

    this._stageText = this.add.text(width / 2, panelY + 36, this._stageLabel(), {
      fontSize: '11px', fontFamily: 'monospace', color: '#665588',
    }).setOrigin(0.5, 0).setDepth(10);

    // ── Evolution progress bar ─────────────────────────────────────────────────
    this._evoLabel = this.add.text(width / 2, panelY + panelH - 30, '', {
      fontSize: '10px', fontFamily: 'monospace', color: '#665588',
    }).setOrigin(0.5, 0).setDepth(10);
    this._evoTrack = this.add.rectangle(width / 2, panelY + panelH - 12, width * 0.6, 5, 0x2d1b4e).setDepth(10);
    this._evoFill  = this.add.rectangle(
      width / 2 - (width * 0.6) / 2, panelY + panelH - 12,
      0, 5, COLOR_ACCENT
    ).setOrigin(0, 0.5).setDepth(11);

    // ── Pet sprite ────────────────────────────────────────────────────────────
    this._sprite = new PetSprite(this, width / 2, panelY + panelH / 2 + 10, this._pet);

    // Tap pet for happiness boost (with cooldown)
    this._petTapCooldown = false;
    const tapZone = this.add.rectangle(width / 2, panelY + panelH / 2 + 10, 160, 160, 0x000000, 0)
      .setDepth(15).setInteractive({ useHandCursor: true });
    tapZone.on('pointerup', () => this._onPetTap());

    // ── Status bars ───────────────────────────────────────────────────────────
    this._statusBar = new StatusBar(this, 20, height * 0.69, width - 40);
    this._statusBar.update(this._pet);

    // ── Action buttons ────────────────────────────────────────────────────────
    this._buildActionButtons(width, height);

    // ── Toast ─────────────────────────────────────────────────────────────────
    this._toast = new ToastNotification(this);

    // ── Ambient timer: update stats display every 30 seconds ─────────────────
    this.time.addEvent({
      delay: 30_000,
      callback: this._tick,
      callbackScope: this,
      loop: true,
    });

    // ── Post-hatch intro ──────────────────────────────────────────────────────
    if (this._newPet && this._pet.stage === 0) {
      this._toast.show(`${this._pet.name}'s egg is warming up... 🥚`, COLOR_ACCENT, 3000);
      // Schedule hatch check
      this.time.addEvent({ delay: 5000, callback: this._checkEvolution, callbackScope: this, loop: true });
    } else {
      this.time.addEvent({ delay: 60_000, callback: this._checkEvolution, callbackScope: this, loop: true });
    }

    this._updateEvolutionBar();
    this._audio.playMusic('music_main');
  }

  // ── Background ───────────────────────────────────────────────────────────────
  _drawBackground(width, height) {
    const hour = new Date().getHours();
    const palette = this._timeOfDayPalette(hour);
    const bg = ACCESSORIES[this._pet?.equippedBg ?? 'bg_pastel'];
    const wallColor  = bg?.colors?.wall  ?? palette.sky;
    const floorColor = bg?.colors?.floor ?? palette.ground;

    this.add.rectangle(width / 2, height * 0.4, width, height * 0.8, wallColor).setDepth(0);
    this.add.rectangle(width / 2, height * 0.85, width, height * 0.3, floorColor).setDepth(0);
  }

  _timeOfDayPalette(hour) {
    if (hour >= 5  && hour < 8)  return TIME_PALETTES.dawn;
    if (hour >= 8  && hour < 12) return TIME_PALETTES.morning;
    if (hour >= 12 && hour < 16) return TIME_PALETTES.noon;
    if (hour >= 16 && hour < 19) return TIME_PALETTES.evening;
    if (hour >= 19 && hour < 21) return TIME_PALETTES.dusk;
    return TIME_PALETTES.night;
  }

  // ── Stage label ──────────────────────────────────────────────────────────────
  _stageLabel() {
    const evoName = this._pet.evolutionId
      ? (this._pet.evolutionId === 'baby'
          ? `${this._pet.name} (Baby)`
          : (this._pet.evolutionId.charAt(0).toUpperCase() + this._pet.evolutionId.slice(1)))
      : STAGE_NAMES[this._pet.stage] ?? '';
    return evoName.toUpperCase();
  }

  // ── Evolution progress bar ────────────────────────────────────────────────────
  _updateEvolutionBar() {
    const pct = EvolutionSystem.evolutionProgress(this._pet);
    const trackW = this.scale.width * 0.6;
    this._evoFill.setSize(trackW * pct, 5);

    if (this._pet.stage < 4) {
      const next = EvolutionSystem.predictNextEvolution(this._pet);
      const hrs  = TimeSystem.hoursUntilNextStage(this._pet);
      if (hrs !== null) {
        this._evoLabel.setText(
          hrs < 1
            ? `Evolving into ${next} soon!`
            : `Next: ${next} — ${Math.ceil(hrs)}h`
        );
      }
    } else {
      this._evoLabel.setText('FULLY EVOLVED ✨');
    }
  }

  // ── Action buttons ────────────────────────────────────────────────────────────
  _buildActionButtons(width, height) {
    const btnY  = height * 0.9;
    const btnW  = 68;
    const btnH  = 52;
    const gap   = (width - 32) / 4;
    const startX = 16 + gap / 2;

    const actions = [
      { icon: '🍽', label: 'FEED',  cb: () => this.scene.start('FeedScene')  },
      { icon: '🎮', label: 'PLAY',  cb: () => this.scene.start('PlayScene')  },
      { icon: '✨', label: 'CLEAN', cb: () => this._cleanPet()               },
      { icon: '💤', label: 'SLEEP', cb: () => this._toggleSleep()            },
    ];

    actions.forEach((action, i) => {
      const x = startX + i * gap;
      const bg = this.add.rectangle(x, btnY, btnW, btnH, COLOR_PANEL)
        .setStrokeStyle(1, COLOR_BORDER).setInteractive({ useHandCursor: true }).setDepth(20);
      this.add.text(x, btnY - 8, action.icon, { fontSize: '20px' }).setOrigin(0.5).setDepth(21);
      this.add.text(x, btnY + 12, action.label, {
        fontSize: '9px', fontFamily: 'monospace', color: '#665588',
      }).setOrigin(0.5).setDepth(21);

      bg.on('pointerover', () => bg.setFillStyle(COLOR_BORDER, 0.2));
      bg.on('pointerout',  () => bg.setFillStyle(COLOR_PANEL));
      bg.on('pointerup',   () => { hapticsService.light(); action.cb(); });
    });

    // Nav icons: shop and stats at top corners
    const shopBtn = this.add.text(width - 16, 16, '🛍', { fontSize: '24px' })
      .setOrigin(1, 0).setDepth(20).setInteractive({ useHandCursor: true });
    shopBtn.on('pointerup', () => this.scene.start('ShopScene'));

    const statsBtn = this.add.text(16, 16, '📊', { fontSize: '24px' })
      .setOrigin(0).setDepth(20).setInteractive({ useHandCursor: true });
    statsBtn.on('pointerup', () => this.scene.start('StatsScene'));
  }

  // ── Pet tap: tiny happiness boost ────────────────────────────────────────────
  _onPetTap() {
    if (this._petTapCooldown || this._pet.sleeping) return;
    this._petTapCooldown = true;
    hapticsService.light();

    this._pet = { ...this._pet, happiness: Math.min(100, this._pet.happiness + 3) };
    storageService.savePet({ ...this._pet, lastSeenTs: Date.now() });
    this._sprite.playHappy();
    this._statusBar.update(this._pet);

    this._toast.show('💕', COLOR_ACCENT, 800);

    this.time.delayedCall(3000, () => { this._petTapCooldown = false; });
  }

  // ── Clean ─────────────────────────────────────────────────────────────────────
  _cleanPet() {
    if (this._pet.cleanliness >= 90) {
      this._toast.show(`${this._pet.name} is already clean! ✨`);
      return;
    }
    hapticsService.medium();
    this._pet = PetSystem.clean(this._pet);
    storageService.savePet({ ...this._pet, lastSeenTs: Date.now() });
    this._statusBar.update(this._pet);
    this._sprite.playHappy();
    this._toast.show('Squeaky clean! ✨', COLOR_ACCENT);
  }

  // ── Sleep toggle ──────────────────────────────────────────────────────────────
  _toggleSleep() {
    this._pet = PetSystem.setSleeping(this._pet, !this._pet.sleeping);
    storageService.savePet({ ...this._pet, lastSeenTs: Date.now() });
    if (this._pet.sleeping) {
      this._sprite.playSleeping();
      this._toast.show(`${this._pet.name} is sleeping... 💤`, 0xaabbff);
    } else {
      this._sprite.stopSleeping();
      this._toast.show(`${this._pet.name} woke up! ☀️`);
    }
  }

  // ── Periodic tick ────────────────────────────────────────────────────────────
  _tick() {
    const fresh = storageService.loadPet();
    if (!fresh?.isAlive) { this.scene.start('DeathScene'); return; }

    this._pet = fresh;
    this._sprite.update(this._pet);
    this._statusBar.update(this._pet);
    this._updateEvolutionBar();

    if (PetSystem.isCritical(this._pet)) {
      hapticsService.medium();
      this._toast.show(`${this._pet.name} needs attention! 😢`, 0xff4d6d);
    }
  }

  // ── Evolution check ───────────────────────────────────────────────────────────
  _checkEvolution() {
    const fresh = storageService.loadPet();
    if (!fresh) return;
    const { shouldEvolve, targetId } = EvolutionSystem.check(fresh);
    if (shouldEvolve) {
      const evolved = PetSystem.evolve(fresh, targetId);
      storageService.savePet({ ...evolved, lastSeenTs: Date.now() });
      this.scene.start('EvolutionScene', { pet: evolved, targetId });
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  shutdown() {
    storageService.savePet({ ...this._pet, lastSeenTs: Date.now() });
    notificationSystem.reschedule(this._pet);
    this._sprite?.destroy();
    this._statusBar?.destroy();
    this._audio?.stopMusic();
  }
}

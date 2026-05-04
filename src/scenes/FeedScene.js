import { storageService } from '../services/StorageService.js';
import { hapticsService } from '../services/HapticsService.js';
import { PetSystem } from '../systems/PetSystem.js';
import { FOODS, BASIC_FOODS, GOURMET_FOODS } from '../data/foods.js';
import { COLOR_BG, COLOR_PANEL, COLOR_BORDER, COLOR_ACCENT, COLOR_CRIT } from '../constants.js';

export class FeedScene extends Phaser.Scene {
  constructor() { super('FeedScene'); }

  create() {
    this._pet  = storageService.loadPet();
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Header
    this.add.text(width / 2, height * 0.08, 'FEED', {
      fontSize: '22px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.14, `Hunger: ${Math.round(this._pet.hunger)}/100`, {
      fontSize: '13px', fontFamily: 'monospace', color: '#665588',
    }).setOrigin(0.5);

    // Back
    this.add.text(16, 20, '< BACK', { fontSize: '14px', fontFamily: 'monospace', color: '#4a3a6a' })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('MainScene'));

    // Build food rows
    const gourmetInventory = storageService.getFoodInventory();
    let y = height * 0.22;
    const rowH = 72;

    // Basic foods (always available)
    this.add.text(20, y, 'DAILY', { fontSize: '10px', fontFamily: 'monospace', color: '#4a3a6a' });
    y += 18;
    BASIC_FOODS.forEach(id => {
      this._foodRow(id, null, width, y);
      y += rowH;
    });

    // Gourmet foods (from inventory)
    const ownedGourmet = GOURMET_FOODS.filter(id => (gourmetInventory[id] ?? 0) > 0);
    if (ownedGourmet.length > 0) {
      y += 8;
      this.add.text(20, y, 'GOURMET', { fontSize: '10px', fontFamily: 'monospace', color: '#9966cc' });
      y += 18;
      ownedGourmet.forEach(id => {
        const qty = gourmetInventory[id];
        this._foodRow(id, qty, width, y);
        y += rowH;
      });
    } else {
      y += 16;
      this.add.text(width / 2, y, 'No gourmet food. Visit the shop!', {
        fontSize: '12px', fontFamily: 'monospace', color: '#3a2a5a',
      }).setOrigin(0.5);
    }
  }

  _foodRow(foodId, qty, width, y) {
    const food = FOODS[foodId];
    const now  = Date.now();
    const cooldownExpiry = this._pet.foodCooldowns?.[foodId] ?? 0;
    const onCooldown = now < cooldownExpiry;
    const rowH = 64;

    const bg = this.add.rectangle(width / 2, y + rowH / 2, width - 32, rowH - 4, COLOR_PANEL)
      .setStrokeStyle(1, onCooldown ? 0x2d1b4e : COLOR_BORDER);

    // Icon + name
    this.add.text(28, y + 10, food.emoji, { fontSize: '24px' });
    this.add.text(58, y + 10, food.name, { fontSize: '14px', fontFamily: 'monospace', color: '#ccccee' });
    this.add.text(58, y + 28, `+${food.hunger} hunger   +${food.happiness} happy`, {
      fontSize: '11px', fontFamily: 'monospace', color: '#665588',
    });

    // Qty badge (gourmet)
    if (qty !== null) {
      this.add.text(width - 90, y + 10, `×${qty}`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#9966cc',
      });
    }

    // Feed / Cooldown button
    if (onCooldown) {
      const secLeft = Math.ceil((cooldownExpiry - now) / 1000 / 60);
      this.add.text(width - 50, y + rowH / 2, `${secLeft}m`, {
        fontSize: '12px', fontFamily: 'monospace', color: '#443355',
      }).setOrigin(0.5);
    } else {
      const btn = this.add.rectangle(width - 48, y + rowH / 2, 72, 34, 0x0a1a0a)
        .setStrokeStyle(1, COLOR_ACCENT).setInteractive({ useHandCursor: true });
      this.add.text(width - 48, y + rowH / 2, 'FEED', {
        fontSize: '13px', fontFamily: 'monospace',
        color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);

      btn.on('pointerover', () => btn.setFillStyle(COLOR_ACCENT, 0.15));
      btn.on('pointerout',  () => btn.setFillStyle(0x0a1a0a));
      btn.on('pointerup',   () => this._feed(foodId, qty !== null));
    }

    if (onCooldown) {
      bg.setAlpha(0.5);
    }
  }

  _feed(foodId, isGourmet) {
    if (isGourmet && !storageService.useFood(foodId)) {
      return;
    }

    const { pet, blocked, reason } = PetSystem.feed(this._pet, foodId);
    if (blocked) {
      this._showToast(reason ?? 'Cannot feed right now');
      return;
    }

    hapticsService.medium();
    this._pet = pet;
    storageService.savePet({ ...pet, lastSeenTs: Date.now() });

    // Redraw scene to update cooldowns / qty
    this.scene.restart();
  }

  _showToast(msg) {
    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height * 0.5, msg, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff8888',
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, duration: 1500, onComplete: () => t.destroy() });
  }
}

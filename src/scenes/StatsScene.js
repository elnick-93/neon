import { storageService } from '../services/StorageService.js';
import { EvolutionSystem } from '../systems/EvolutionSystem.js';
import { EVOLUTIONS, STAGE_NAMES } from '../data/pets.js';
import { COLOR_BG, COLOR_ACCENT, COLOR_PANEL, COLOR_BORDER } from '../constants.js';

export class StatsScene extends Phaser.Scene {
  constructor() { super('StatsScene'); }

  create() {
    const pet = storageService.loadPet();
    const player = storageService.getPlayer();
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    // Back button
    this.add.text(16, 20, '< BACK', { fontSize: '14px', fontFamily: 'monospace', color: '#4a3a6a' })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.scene.start('MainScene'));

    this.add.text(width / 2, height * 0.07, 'PET STATUS', {
      fontSize: '20px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    let y = height * 0.14;
    const lineH = 32;

    // Pet name and species
    const evoName = pet.evolutionId
      ? (EVOLUTIONS[pet.evolutionId]?.name ?? pet.evolutionId)
      : STAGE_NAMES[pet.stage] ?? 'Egg';

    this._row(width, y, 'NAME',     pet.name);                       y += lineH;
    this._row(width, y, 'FORM',     evoName);                        y += lineH;
    this._row(width, y, 'STAGE',    STAGE_NAMES[pet.stage] ?? '—');  y += lineH;

    const ageHours = Math.floor(pet.ageMs / 3_600_000);
    const ageDays  = Math.floor(ageHours / 24);
    const ageLabel = ageDays > 0
      ? `${ageDays}d ${ageHours % 24}h`
      : `${ageHours}h`;
    this._row(width, y, 'AGE',      ageLabel);                       y += lineH;

    y += 8;
    this._divider(width, y); y += 20;

    // Stats
    this._row(width, y, 'HUNGER',      `${Math.round(pet.hunger)}/100`);    y += lineH;
    this._row(width, y, 'HAPPINESS',   `${Math.round(pet.happiness)}/100`); y += lineH;
    this._row(width, y, 'CLEANLINESS', `${Math.round(pet.cleanliness)}/100`); y += lineH;
    this._row(width, y, 'ENERGY',      `${Math.round(pet.energy)}/100`);    y += lineH;
    this._row(width, y, 'HEALTH',      `${Math.round(pet.health)}/100`);    y += lineH;

    y += 8;
    this._divider(width, y); y += 20;

    // Care stats
    this._row(width, y, 'CARE SCORE', `${Math.round(pet.careScore)}/100`);   y += lineH;
    this._row(width, y, 'FEEDINGS',   String(pet.totalFeedings));             y += lineH;
    this._row(width, y, 'PLAY SESSIONS', String(pet.totalPlaySessions));     y += lineH;

    y += 8;
    this._divider(width, y); y += 20;

    // Evolution forecast
    const next = EvolutionSystem.predictNextEvolution(pet);
    if (next) {
      this._row(width, y, 'EVOLVING INTO', next); y += lineH;
      const prog = Math.round(EvolutionSystem.evolutionProgress(pet) * 100);
      this._row(width, y, 'EVO PROGRESS', `${prog}%`); y += lineH;
    }

    y += 8;
    this._divider(width, y); y += 20;

    // Trainer level
    this._row(width, y, 'TRAINER LVL', String(player.level)); y += lineH;
  }

  _row(width, y, label, value) {
    this.add.text(24, y, label, { fontSize: '12px', fontFamily: 'monospace', color: '#665588' });
    this.add.text(width - 24, y, value, {
      fontSize: '12px', fontFamily: 'monospace', color: '#ccccee',
    }).setOrigin(1, 0);
  }

  _divider(width, y) {
    this.add.rectangle(width / 2, y, width - 40, 1, 0x2d1b4e).setOrigin(0.5, 0);
  }
}

import { storageService } from '../services/StorageService.js';
import { PetSystem } from '../systems/PetSystem.js';
import { STARTER_SPECIES, SPECIES } from '../data/pets.js';
import { COLOR_BG, COLOR_ACCENT } from '../constants.js';

const EGG_EMOJI = { lumie: '🟡', sparky: '🔵', blossy: '🩷' };
const EGG_DESC  = {
  lumie:  'Warm & friendly\nGreat starter',
  sparky: 'Playful & electric\nLoves to play',
  blossy: 'Sweet & social\nCraves attention',
};

export class NewPetScene extends Phaser.Scene {
  constructor() { super('NewPetScene'); }

  create() {
    const { width, height } = this.scale;
    this._selected = 'lumie';
    this._nameInput = 'Lumi';

    this.add.rectangle(width / 2, height / 2, width, height, COLOR_BG);

    this.add.text(width / 2, height * 0.07, 'CHOOSE YOUR EGG', {
      fontSize: '18px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    // Species selector cards
    this._speciesCards = {};
    this._buildSpeciesCards(width, height);

    // Name input hint
    this.add.text(width / 2, height * 0.58, 'NAME YOUR LUMIPET', {
      fontSize: '12px', fontFamily: 'monospace', color: '#665588',
    }).setOrigin(0.5);

    this._nameDisplay = this.add.text(width / 2, height * 0.64, this._nameInput, {
      fontSize: '22px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Tap name to edit (uses prompt on web; Capacitor Dialog plugin recommended for native)
    this._nameDisplay.on('pointerup', () => {
      const input = window.prompt('Name your Lumipet (max 12 chars):', this._nameInput);
      if (input !== null) {
        this._nameInput = input.slice(0, 12).trim() || 'Lumi';
        this._nameDisplay.setText(this._nameInput);
      }
    });

    // Confirm button
    const btn = this.add.rectangle(width / 2, height * 0.77, 240, 50, 0x1a0a2e)
      .setStrokeStyle(2, COLOR_ACCENT).setInteractive({ useHandCursor: true });
    this.add.text(width / 2, height * 0.77, 'HATCH MY EGG! 🥚', {
      fontSize: '16px', fontFamily: 'monospace',
      color: `#${COLOR_ACCENT.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setFillStyle(COLOR_ACCENT, 0.1));
    btn.on('pointerout',  () => btn.setFillStyle(0x1a0a2e));
    btn.on('pointerup',   () => this._confirm());
  }

  _buildSpeciesCards(width, height) {
    const cardW   = width * 0.28;
    const startX  = width / 2 - cardW * 1.2;
    const y       = height * 0.35;

    STARTER_SPECIES.forEach((id, i) => {
      const x     = startX + i * cardW * 1.2;
      const isSelected = id === this._selected;
      const accentColor = SPECIES[id].accentColor;
      const hexC  = `#${accentColor.toString(16).padStart(6, '0')}`;

      const bg = this.add.rectangle(x, y, cardW, cardW * 1.5, 0x1a0a2e)
        .setStrokeStyle(2, isSelected ? accentColor : 0x2d1b4e)
        .setInteractive({ useHandCursor: true });

      const egg = this.add.text(x, y - cardW * 0.25, EGG_EMOJI[id], {
        fontSize: '36px',
      }).setOrigin(0.5);

      const name = this.add.text(x, y + cardW * 0.15, SPECIES[id].name, {
        fontSize: '14px', fontFamily: 'monospace', color: hexC,
      }).setOrigin(0.5);

      const desc = this.add.text(x, y + cardW * 0.38, EGG_DESC[id], {
        fontSize: '10px', fontFamily: 'monospace', color: '#665588',
        align: 'center',
      }).setOrigin(0.5);

      this._speciesCards[id] = { bg, egg, name, desc };

      bg.on('pointerup', () => this._selectSpecies(id));
    });
  }

  _selectSpecies(id) {
    this._selected = id;
    STARTER_SPECIES.forEach(sid => {
      const card = this._speciesCards[sid];
      const isSelected = sid === id;
      const accentColor = SPECIES[sid].accentColor;
      card.bg.setStrokeStyle(2, isSelected ? accentColor : 0x2d1b4e);
      this.tweens.add({ targets: card.bg, scaleX: isSelected ? 1.05 : 1, scaleY: isSelected ? 1.05 : 1, duration: 120 });
    });
  }

  _confirm() {
    const pet = PetSystem.createPet(this._selected, this._nameInput);
    storageService.savePet({ ...pet, lastSeenTs: Date.now() });
    this.scene.start('MainScene', { newPet: true });
  }
}

/**
 * CardPickerUI — renders a 3-card fan layout for the card selection overlay.
 */
export class CardPickerUI {
  constructor(scene, cards, onSelect) {
    this.scene = scene;
    this.cards = cards;
    this.onSelect = onSelect;
    this._containers = [];
    this._build();
  }

  _rarityColor(rarity) {
    return { common: 0x888888, rare: 0x0088ff, legendary: 0xffd700 }[rarity] || 0x888888;
  }

  _build() {
    const { width, height } = this.scene.scale;
    const cardW = Math.min(width * 0.28, 120);
    const cardH = cardW * 1.6;
    const spacing = cardW + 16;
    const startX = width / 2 - spacing * (this.cards.length - 1) / 2;

    this.cards.forEach((card, i) => {
      const x = startX + i * spacing;
      const y = height / 2;
      const color = this._rarityColor(card.rarity);

      // Card background
      const bg = this.scene.add.rectangle(0, 0, cardW, cardH, 0x0d0d1a)
        .setStrokeStyle(2, color);

      // Rarity glow line
      const glowLine = this.scene.add.rectangle(0, -cardH / 2 + 4, cardW - 4, 4, color).setOrigin(0.5, 0.5);

      // Card name
      const nameText = this.scene.add.text(0, -cardH * 0.25, card.name, {
        fontSize: '13px', fontFamily: 'monospace',
        color: `#${color.toString(16).padStart(6, '0')}`,
        align: 'center', wordWrap: { width: cardW - 12 },
      }).setOrigin(0.5);

      // Rarity label
      const rarityText = this.scene.add.text(0, -cardH * 0.4, card.rarity.toUpperCase(), {
        fontSize: '9px', fontFamily: 'monospace', color: '#666666',
      }).setOrigin(0.5);

      // Description
      const descText = this.scene.add.text(0, cardH * 0.1, card.description, {
        fontSize: '11px', fontFamily: 'monospace', color: '#aaaaaa',
        align: 'center', wordWrap: { width: cardW - 12 },
      }).setOrigin(0.5);

      const container = this.scene.add.container(x, y + cardH, [bg, glowLine, rarityText, nameText, descText]);
      container.setDepth(500);
      container.setSize(cardW, cardH);
      container.setInteractive();

      // Slide in
      this.scene.tweens.add({
        targets: container,
        y,
        duration: 280,
        ease: 'Back.Out',
        delay: i * 60,
      });

      // Hover
      container.on('pointerover', () => {
        this.scene.tweens.add({ targets: container, scaleX: 1.08, scaleY: 1.08, duration: 120 });
      });
      container.on('pointerout', () => {
        this.scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120 });
      });

      // Select
      container.on('pointerup', () => {
        this._onCardSelected(card, i);
      });

      this._containers.push(container);
    });
  }

  _onCardSelected(card, idx) {
    // Flash selected card
    const selected = this._containers[idx];
    this.scene.tweens.add({
      targets: selected,
      scaleX: 1.15, scaleY: 1.15,
      duration: 80,
      yoyo: true,
      onComplete: () => {
        this.destroy();
        this.onSelect(card.id);
      },
    });
  }

  destroy() {
    for (const c of this._containers) c.destroy();
    this._containers = [];
  }
}

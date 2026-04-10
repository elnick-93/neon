import { EVOLUTIONS, SPECIES, getFrame } from '../data/pets.js';

const PIXEL_SIZE = 6;  // each logical pixel = 6×6 screen pixels
const FRAME_W    = 16; // logical pixels wide
const FRAME_H    = 12; // logical pixels tall

/**
 * PetSprite — renders a pet as pixel art using Phaser Graphics.
 * Supports idle, happy, eating, sleeping, sick, and sad states.
 * Handles scale-bounce and ambient idle animations via Phaser tweens.
 */
export class PetSprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x  - center x position
   * @param {number} y  - center y position
   * @param {object} pet - current pet state
   */
  constructor(scene, x, y, pet) {
    this.scene    = scene;
    this.centerX  = x;
    this.centerY  = y;
    this._gfx     = scene.add.graphics();
    this._gfx.setDepth(20);
    this._state   = 'idle';
    this._idleTween = null;
    this._effectTween = null;
    this._heartParticles = [];

    this._palette = null;
    this._frameSet = null;

    this.update(pet);
    this._startIdleAnimation();
  }

  /** Call whenever pet state changes to redraw the sprite. */
  update(pet) {
    if (!pet) return;

    // Resolve palette and frameSet from evolution/species
    const evo = pet.evolutionId ? EVOLUTIONS[pet.evolutionId] : null;
    const species = SPECIES[pet.speciesId];

    if (evo?.palette) {
      this._palette = evo.palette;
    } else if (species) {
      this._palette = species.palette;
    } else {
      this._palette = { b: 0xFFD97D, h: 0xFFEFAA, s: 0xC4952A, e: 0x2D1B00, w: 0xFFFFFF };
    }

    const frameSet = evo?.frameSet ?? species?.frameSet ?? {};

    this._frameSet = {
      idle:     frameSet.idle     ?? 'baby_idle',
      happy:    frameSet.happy    ?? 'baby_happy',
      eating:   frameSet.eating   ?? 'baby_eating',
      sleeping: frameSet.sleeping ?? 'baby_sleeping',
      sick:     frameSet.sick     ?? 'baby_sick',
      sad:      frameSet.sad      ?? 'baby_sad',
      egg:      'egg_idle',
    };

    // Pick emotional state based on pet stats
    const visualState = this._pickState(pet);
    this._drawState(visualState);
  }

  _pickState(pet) {
    if (pet.stage === 0) return 'egg';
    if (!pet.isAlive)    return 'sick';  // show sick frame for dead pets until DeathScene
    if (pet.sleeping)    return 'sleeping';
    if (pet.health < 30 || (pet.hunger < 15 && pet.happiness < 15)) return 'sick';
    if (pet.hunger < 20) return 'sad';
    if (pet.happiness > 75) return 'happy';
    return 'idle';
  }

  setState(state) {
    if (this._state === state) return;
    this._state = state;
    this._drawState(state);
    if (state === 'happy') this._showHearts();
  }

  _drawState(state) {
    const frameKey = this._frameSet?.[state] ?? 'baby_idle';
    const frameStr = getFrame(frameKey);
    this._draw(frameStr);
  }

  _draw(frameStr) {
    const g = this._gfx;
    g.clear();

    if (!frameStr || frameStr.length < FRAME_W * FRAME_H) return;

    const originX = this.centerX - (FRAME_W * PIXEL_SIZE) / 2;
    const originY = this.centerY - (FRAME_H * PIXEL_SIZE) / 2;

    for (let row = 0; row < FRAME_H; row++) {
      for (let col = 0; col < FRAME_W; col++) {
        const ch = frameStr[row * FRAME_W + col];
        if (ch === '.' || ch === ' ') continue;
        const color = this._palette[ch];
        if (color == null) continue;
        g.fillStyle(color, 1);
        g.fillRect(
          originX + col * PIXEL_SIZE,
          originY + row * PIXEL_SIZE,
          PIXEL_SIZE,
          PIXEL_SIZE,
        );
      }
    }
  }

  // ── Idle animation: gentle bob ──────────────────────────────────────────────
  _startIdleAnimation() {
    this._idleTween = this.scene.tweens.add({
      targets:  this._gfx,
      y:        '-=4',
      duration: 900,
      ease:     'Sine.InOut',
      yoyo:     true,
      repeat:   -1,
    });
  }

  // ── Happy animation: scale pop ──────────────────────────────────────────────
  playHappy() {
    this.setState('happy');
    this._idleTween?.stop();
    this._effectTween = this.scene.tweens.add({
      targets:  this._gfx,
      scaleX:   1.2,
      scaleY:   1.2,
      duration: 120,
      yoyo:     true,
      repeat:   2,
      ease:     'Power2',
      onComplete: () => {
        this._startIdleAnimation();
        this.setState('idle');
      },
    });
    this._showHearts();
  }

  // ── Eating animation: head bob ──────────────────────────────────────────────
  playEating() {
    this.setState('eating');
    this._idleTween?.stop();
    let bobs = 0;
    const bob = () => {
      this.scene.tweens.add({
        targets: this._gfx, x: '+=5', duration: 80, yoyo: true, ease: 'Power1',
        onComplete: () => {
          bobs++;
          if (bobs < 4) bob();
          else { this.setState('idle'); this._startIdleAnimation(); }
        },
      });
    };
    bob();
  }

  // ── Sleep animation: gentle scale breathing ─────────────────────────────────
  playSleeping() {
    this.setState('sleeping');
    this._idleTween?.stop();
    this._effectTween = this.scene.tweens.add({
      targets:  this._gfx,
      scaleX:   1.05,
      scaleY:   0.95,
      duration: 1600,
      ease:     'Sine.InOut',
      yoyo:     true,
      repeat:   -1,
    });
    this._spawnZzz();
  }

  stopSleeping() {
    this._effectTween?.stop();
    this._gfx.setScale(1, 1);
    this.setState('idle');
    this._startIdleAnimation();
  }

  // ── Evolution flash ─────────────────────────────────────────────────────────
  playEvolutionFlash(onComplete) {
    this._idleTween?.stop();
    this._effectTween?.stop();
    this.scene.tweens.add({
      targets:  this._gfx,
      alpha:    0,
      scaleX:   2,
      scaleY:   2,
      duration: 600,
      ease:     'Power3',
      onComplete: () => {
        this._gfx.setScale(1).setAlpha(1);
        if (onComplete) onComplete();
        this._startIdleAnimation();
      },
    });
  }

  // ── Particle effects ────────────────────────────────────────────────────────
  _showHearts() {
    const colors = [0xFF8FAB, 0xFF4D6D, 0xFFD97D];
    for (let i = 0; i < 5; i++) {
      const tx = this.centerX + Phaser.Math.Between(-40, 40);
      const ty = this.centerY - 20;
      const heart = this.scene.add.text(tx, ty, '♥', {
        fontSize: '18px', color: `#${colors[i % 3].toString(16).padStart(6, '0')}`,
      }).setDepth(30);
      this.scene.tweens.add({
        targets: heart, y: ty - 60, alpha: 0, duration: 1000, ease: 'Power2',
        onComplete: () => heart.destroy(),
      });
    }
  }

  _spawnZzz() {
    const spawn = () => {
      if (this._state !== 'sleeping') return;
      const zzz = this.scene.add.text(
        this.centerX + 30, this.centerY - 30, 'z', {
          fontSize: '20px', fontFamily: 'monospace', color: '#aabbff',
        }
      ).setDepth(30).setAlpha(0);
      this.scene.tweens.add({
        targets: zzz, y: zzz.y - 40, alpha: 1, duration: 400,
        onComplete: () => {
          this.scene.tweens.add({
            targets: zzz, y: zzz.y - 30, alpha: 0, duration: 600,
            onComplete: () => zzz.destroy(),
          });
        },
      });
      this.scene.time.delayedCall(1200, spawn);
    };
    this.scene.time.delayedCall(400, spawn);
  }

  setPosition(x, y) {
    this.centerX = x;
    this.centerY = y;
    this._gfx.setPosition(0, 0);  // Graphics draws absolute; redraw
    this._drawState(this._state);
  }

  destroy() {
    this._idleTween?.stop();
    this._effectTween?.stop();
    this._gfx.destroy();
  }
}

/**
 * AudioSystem — wraps Phaser's SoundManager.
 * All sound keys must be preloaded in BootScene.
 */
export class AudioSystem {
  constructor(scene) {
    this.scene = scene;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.6;
    this._currentMusic = null;
  }

  applySetting(settings) {
    this.sfxVolume = settings.sfxVolume ?? 0.8;
    this.musicVolume = settings.musicVolume ?? 0.6;
    if (this._currentMusic) {
      this._currentMusic.setVolume(this.musicVolume);
    }
  }

  play(key, config = {}) {
    if (!this.scene.sound.get(key) && !this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, { volume: this.sfxVolume, ...config });
  }

  playMusic(key) {
    if (this._currentMusic) {
      this._currentMusic.stop();
    }
    if (!this.scene.cache.audio.exists(key)) return;
    this._currentMusic = this.scene.sound.add(key, {
      loop: true,
      volume: this.musicVolume,
    });
    this._currentMusic.play();
  }

  stopMusic() {
    if (this._currentMusic) {
      this._currentMusic.stop();
      this._currentMusic = null;
    }
  }

  crossfadeTo(key, duration = 1000) {
    if (!this.scene.cache.audio.exists(key)) return;
    const next = this.scene.sound.add(key, { loop: true, volume: 0 });
    next.play();
    if (this._currentMusic) {
      this.scene.tweens.add({
        targets: this._currentMusic,
        volume: 0,
        duration,
        onComplete: () => { this._currentMusic.stop(); this._currentMusic = next; },
      });
    }
    this.scene.tweens.add({
      targets: next,
      volume: this.musicVolume,
      duration,
    });
    this._currentMusic = next;
  }
}

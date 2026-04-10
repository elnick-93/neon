import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { PaywallScene } from './scenes/PaywallScene.js';
import { NewPetScene } from './scenes/NewPetScene.js';
import { MainScene } from './scenes/MainScene.js';
import { FeedScene } from './scenes/FeedScene.js';
import { PlayScene } from './scenes/PlayScene.js';
import { EvolutionScene } from './scenes/EvolutionScene.js';
import { StatsScene } from './scenes/StatsScene.js';
import { DeathScene } from './scenes/DeathScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { COLOR_BG } from './constants.js';

// Make Phaser globally available for scenes that reference it directly
window.Phaser = Phaser;

const config = {
  type: Phaser.AUTO,
  backgroundColor: COLOR_BG,
  scene: [
    BootScene,
    PaywallScene,
    NewPetScene,
    MainScene,
    FeedScene,
    PlayScene,
    EvolutionScene,
    StatsScene,
    DeathScene,
    ShopScene,
    SettingsScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    parent: document.body,
  },
  input: {
    activePointers: 2,  // support multi-touch
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
};

const game = new Phaser.Game(config);
export default game;

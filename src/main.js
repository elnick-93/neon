import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainMenuScene } from './scenes/MainMenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { CardSelectScene } from './scenes/CardSelectScene.js';
import { RunCompleteScene } from './scenes/RunCompleteScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { PaywallScene } from './scenes/PaywallScene.js';
import { COLOR_BG } from './constants.js';

// Make Phaser globally available for scenes that reference it directly
window.Phaser = Phaser;

const config = {
  type: Phaser.AUTO,
  backgroundColor: COLOR_BG,
  scene: [
    BootScene,
    MainMenuScene,
    GameScene,
    CardSelectScene,
    RunCompleteScene,
    ShopScene,
    SettingsScene,
    PaywallScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
    parent: document.body,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  input: {
    activePointers: 2,  // support multi-touch
  },
  audio: {
    disableWebAudio: false,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
};

const game = new Phaser.Game(config);
export default game;

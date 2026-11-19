import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GRAVITY, TARGET_FPS } from './config';

import { BootScene }      from './scenes/BootScene';
import { PreloadScene }   from './scenes/PreloadScene';
import { MainMenuScene }  from './scenes/MainMenuScene';
import { GameScene }      from './scenes/GameScene';
import { HUDScene }       from './scenes/HUDScene';
import { ShopScene }      from './scenes/ShopScene';
import { ResultsScene }   from './scenes/ResultsScene';
import { GameOverScene }  from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  pixelArt: true,           // disables anti-aliasing for crisp pixel rendering
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      fps: TARGET_FPS,
      fixedStep: true,
      debug: false,         // set true to see hitboxes during development
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    GameScene,
    HUDScene,
    ShopScene,
    ResultsScene,
    GameOverScene,
  ],
};

const game = new Phaser.Game(config);

// Dev-only handle for debugging / automated smoke tests (stripped from production builds)
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

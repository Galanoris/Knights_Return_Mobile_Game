import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Set global scale mode for pixel-perfect rendering
    this.scale.setGameSize(GAME_WIDTH, GAME_HEIGHT);
    this.scene.start('PreloadScene');
  }
}

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Game size is set in main.ts and kept in sync with the screen by systems/ViewportFit.ts
    this.scene.start('PreloadScene');
  }
}

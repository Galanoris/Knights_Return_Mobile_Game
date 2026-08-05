import Phaser from 'phaser';
import { SaveManager } from '../systems/SaveManager';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 40, "KNIGHT'S RETURN", {
      fontSize: '16px', color: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const startBtn = this.add.text(cx, cy, '[ NEW GAME ]', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerup', () => {
      SaveManager.reset();
      this.scene.start('GameScene', { levelKey: '1-1', levelId: '1-1' });
    });

    const hasSave = Object.keys(SaveManager.get().crowns).length > 0;
    if (hasSave) {
      const contBtn = this.add.text(cx, cy + 20, '[ CONTINUE ]', {
        fontSize: '10px', color: '#aaaaff', fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      contBtn.on('pointerup', () => {
        this.scene.start('GameScene', { levelKey: '1-1', levelId: '1-1' });
      });
    }
  }
}

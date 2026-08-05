import Phaser from 'phaser';

interface GameOverData {
  levelId: string;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 20, 'GAME OVER', {
      fontSize: '20px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const retry = this.add.text(cx, cy + 10, '[ RETRY ]', {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retry.on('pointerup', () => {
      this.scene.start('GameScene', { levelKey: '1-1', levelId: data.levelId });
    });
  }
}

import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private restartCalled = false;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { levelId?: string }): void {
    this.restartCalled = false;
    const levelId = data.levelId ?? '1-1';

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 20, 'GAME OVER', {
      fontSize: '20px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Starts dim, brightens when ready to accept input
    const prompt = this.add.text(cx, cy + 10, 'tap or press any key to retry', {
      fontSize: '8px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0.3);

    const doRestart = () => {
      if (this.restartCalled) return;
      this.restartCalled = true;
      this.scene.start('GameScene', { levelKey: levelId, levelId });
    };

    // Grace period via native setTimeout — no dependency on Phaser update loop
    const timer = setTimeout(() => {
      prompt.setAlpha(1);
      window.addEventListener('pointerup', doRestart);
      window.addEventListener('keydown', doRestart);
    }, 600);

    this.events.once('shutdown', () => {
      clearTimeout(timer);
      window.removeEventListener('pointerup', doRestart);
      window.removeEventListener('keydown', doRestart);
    });
  }
}

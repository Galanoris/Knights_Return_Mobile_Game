import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private restartCalled = false;
  private frameCount = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    this.restartCalled = false;
    this.frameCount = 0;

    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 20, 'GAME OVER', {
      fontSize: '20px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 10, 'click or press any key to retry', {
      fontSize: '8px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const doRestart = () => {
      // ~500ms grace period (30 frames) prevents death-frame input from instantly retrying
      if (this.restartCalled || this.frameCount < 30) return;
      this.restartCalled = true;
      this.scene.start('GameScene', { levelKey: '1-1', levelId: '1-1' });
    };

    // Use native DOM events — bypasses Phaser InputPlugin entirely, always works
    window.addEventListener('click', doRestart);
    window.addEventListener('keydown', doRestart);

    // Clean up DOM listeners when scene shuts down so they don't accumulate
    this.events.once('shutdown', () => {
      window.removeEventListener('click', doRestart);
      window.removeEventListener('keydown', doRestart);
    });
  }

  update(): void {
    this.frameCount++;
  }
}

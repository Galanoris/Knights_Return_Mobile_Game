import Phaser from 'phaser';
import { TouchControls, resetTouchInput } from '../ui/TouchControls';

export class HUDScene extends Phaser.Scene {
  private heartsText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private relicNotice!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.heartsText = this.add.text(6, 6, '♥♥♥', {
      fontSize: '10px', color: '#ff4444', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    });
    this.livesText = this.add.text(6, 19, 'x3', {
      fontSize: '8px', color: '#dddddd', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    });
    this.coinText = this.add.text(6, 30, '$ 000', {
      fontSize: '8px', color: '#ffdd00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    });

    if (this.sys.game.device.input.touch) {
      new TouchControls(this);
    } else {
      this.add.text(this.scale.width - 4, this.scale.height - 4, '[J/Z] punch  [↓+J] pogo', {
        fontSize: '6px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(1, 1);
    }

    // Relic notice (hidden by default)
    this.relicNotice = this.add.text(
      this.scale.width / 2, 12,
      '✦ RELIC FOUND ✦',
      { fontSize: '9px', color: '#00ffaa', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 2 },
    ).setOrigin(0.5).setAlpha(0);

    // Subscribe to GameScene events
    const game = this.scene.get('GameScene');
    game.events.on('heartChanged',    this.onHeartChanged,  this);
    game.events.on('livesChanged',    this.onLivesChanged,  this);
    game.events.on('coinChanged',     this.onCoinChanged,   this);
    game.events.on('relicFound',      this.onRelicFound,    this);

    // These listeners live on GameScene's emitter, which Phaser does not clear when HUD stops.
    // Left in place, they'd update destroyed text on the next GameScene start and crash the loop.
    this.events.once('shutdown', () => {
      game.events.off('heartChanged', this.onHeartChanged, this);
      game.events.off('livesChanged', this.onLivesChanged, this);
      game.events.off('coinChanged',  this.onCoinChanged,  this);
      game.events.off('relicFound',   this.onRelicFound,   this);
      resetTouchInput(); // a finger held through death must not keep the knight running after Retry
    });
  }

  private onHeartChanged(current: number, max: number): void {
    this.heartsText.setText('♥'.repeat(current) + '♡'.repeat(Math.max(0, max - current)));
  }

  private onLivesChanged(lives: number): void {
    this.livesText.setText(`x${lives}`);
  }

  private onCoinChanged(total: number): void {
    this.coinText.setText(`$ ${String(total).padStart(3, '0')}`);
  }

  private onRelicFound(): void {
    this.tweens.add({
      targets: this.relicNotice,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1500,
      onComplete: () => { this.relicNotice.setAlpha(0); },
    });
  }
}

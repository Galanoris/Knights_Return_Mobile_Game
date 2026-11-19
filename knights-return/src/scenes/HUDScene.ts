import Phaser from 'phaser';
import { TouchControls, resetTouchInput } from '../ui/TouchControls';
import { getSafeInsets } from '../systems/ViewportFit';

export class HUDScene extends Phaser.Scene {
  private heartsText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private relicNotice!: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text | null = null;
  private pauseBox!: Phaser.GameObjects.Rectangle;
  private pauseLabel!: Phaser.GameObjects.Text;
  private touchControls: TouchControls | null = null;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const style = (fontSize: string, color: string) => ({
      fontSize, color, fontFamily: 'monospace', stroke: '#000000', strokeThickness: 2,
    });
    this.heartsText = this.add.text(0, 0, '♥♥♥', style('10px', '#ff4444'));
    this.livesText = this.add.text(0, 0, 'x3', style('8px', '#dddddd'));
    this.coinText = this.add.text(0, 0, '$ 000', style('8px', '#ffdd00'));

    this.touchControls = null;
    this.hintText = null;
    if (this.sys.game.device.input.touch) {
      this.touchControls = new TouchControls(this);
    } else {
      this.hintText = this.add.text(0, 0, '[J/Z] punch  [↓+J] pogo  [Esc] pause', {
        fontSize: '6px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(1, 1);
    }
    this.createPauseButton();

    // Relic notice (hidden by default)
    this.relicNotice = this.add.text(0, 0, '✦ RELIC FOUND ✦', style('9px', '#00ffaa')).setOrigin(0.5).setAlpha(0);

    // Positions depend on the game width (it follows the screen) and the safe-area insets
    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);

    // While paused, the HUD misses finger releases — let go of everything up front
    const onPause = () => this.touchControls?.releaseAll();
    this.events.on(Phaser.Scenes.Events.PAUSE, onPause);

    // Subscribe to GameScene events
    const game = this.scene.get('GameScene');
    game.events.on('heartChanged',    this.onHeartChanged,  this);
    game.events.on('livesChanged',    this.onLivesChanged,  this);
    game.events.on('coinChanged',     this.onCoinChanged,   this);
    game.events.on('relicFound',      this.onRelicFound,    this);

    // These listeners live on GameScene's emitter / the global scale manager, which Phaser does
    // not clear when HUD stops. Left in place, they'd touch destroyed objects and crash the loop.
    this.events.once('shutdown', () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.events.off(Phaser.Scenes.Events.PAUSE, onPause);
      game.events.off('heartChanged', this.onHeartChanged, this);
      game.events.off('livesChanged', this.onLivesChanged, this);
      game.events.off('coinChanged',  this.onCoinChanged,  this);
      game.events.off('relicFound',   this.onRelicFound,   this);
      resetTouchInput(); // a finger held through death must not keep the knight running after Retry
    });
  }

  /** Anchor everything to the screen edges, inside the notch / home-indicator safe area. */
  private layout(): void {
    const { width, height } = this.scale;
    const inset = getSafeInsets(this.scale);
    const left = 6 + inset.left, top = 6 + inset.top;
    this.heartsText.setPosition(left, top);
    this.livesText.setPosition(left, top + 13);
    this.coinText.setPosition(left, top + 24);
    this.pauseBox.setPosition(width - 14 - inset.right, 13 + inset.top);
    this.pauseLabel.setPosition(this.pauseBox.x, this.pauseBox.y);
    this.relicNotice.setPosition(width / 2, 12 + inset.top);
    this.hintText?.setPosition(width - 4 - inset.right, height - 4 - inset.bottom);
    this.touchControls?.layout(width, height, inset);
  }

  /** "II" button, top-right — the only way to pause on phones (no Esc key). */
  private createPauseButton(): void {
    this.pauseBox = this.add.rectangle(0, 0, 18, 16, 0x000000, 0.35).setStrokeStyle(1, 0xffffff, 0.7);
    this.pauseLabel = this.add.text(0, 0, 'II', {
      fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    // Hit area larger than the drawn box — thumbs are imprecise
    this.pauseBox.setInteractive(new Phaser.Geom.Rectangle(-3, -4, 24, 24), Phaser.Geom.Rectangle.Contains);
    this.pauseBox.input!.cursor = 'pointer';
    this.pauseBox.on('pointerdown', () => this.scene.get('GameScene').events.emit('requestPause'));
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

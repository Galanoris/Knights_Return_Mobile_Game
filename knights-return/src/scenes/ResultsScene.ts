import Phaser from 'phaser';

export interface ResultsData {
  levelId: string;
  crowns: number;
  timeMs: number;
  coinsCollected: number;
  relicFound: boolean;
}

export class ResultsScene extends Phaser.Scene {
  private continueCalled = false;
  private frameCount = 0;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  create(data: ResultsData): void {
    this.continueCalled = false;
    this.frameCount = 0;

    const cx = this.scale.width / 2;
    let y = 20;

    this.add.text(cx, y, 'LEVEL COMPLETE', {
      fontSize: '14px', color: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    y += 24;

    const crowns = data.crowns;
    const crownStr = '★'.repeat(crowns) + '☆'.repeat(3 - crowns);
    const crownText = this.add.text(cx, y, '☆☆☆', {
      fontSize: '20px', color: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0);
    y += 28;

    this.tweens.add({
      targets: crownText,
      alpha: 1,
      duration: 400,
      onComplete: () => crownText.setText(crownStr),
    });

    const secs = (data.timeMs / 1000).toFixed(1);
    this.add.text(cx, y, `Time: ${secs}s`, {
      fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);
    y += 14;

    this.add.text(cx, y, `Coins: ${data.coinsCollected}`, {
      fontSize: '8px', color: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    y += 14;

    if (data.relicFound) {
      this.add.text(cx, y, '✦ Relic Found!', {
        fontSize: '8px', color: '#00ffaa', fontFamily: 'monospace',
      }).setOrigin(0.5);
      y += 14;
    }

    y += 10;

    this.add.text(cx, y, 'click or press any key to continue', {
      fontSize: '8px', color: '#aaffaa', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const doContinue = () => {
      // ~1s grace period (60 frames) so the level-end fanfare plays first
      if (this.continueCalled || this.frameCount < 60) return;
      this.continueCalled = true;
      this.scene.start('GameScene', { levelKey: '1-1', levelId: '1-1' });
    };

    window.addEventListener('click', doContinue);
    window.addEventListener('keydown', doContinue);

    this.events.once('shutdown', () => {
      window.removeEventListener('click', doContinue);
      window.removeEventListener('keydown', doContinue);
    });
  }

  update(): void {
    this.frameCount++;
  }
}

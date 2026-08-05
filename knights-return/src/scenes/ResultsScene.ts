import Phaser from 'phaser';

export interface ResultsData {
  levelId: string;
  crowns: number;
  timeMs: number;
  coinsCollected: number;
  relicFound: boolean;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultsScene' });
  }

  create(data: ResultsData): void {
    const cx = this.scale.width / 2;
    let y = 20;

    this.add.text(cx, y, 'LEVEL COMPLETE', {
      fontSize: '14px', color: '#ffdd00', fontFamily: 'monospace',
    }).setOrigin(0.5);
    y += 24;

    // Crowns — animate in one by one
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

    // Stats
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

    // Continue button
    const cont = this.add.text(cx, y, '[ CONTINUE ]', {
      fontSize: '10px', color: '#aaffaa', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cont.setAlpha(0);

    // Show continue after a moment
    this.time.delayedCall(1000, () => {
      this.tweens.add({ targets: cont, alpha: 1, duration: 300 });
    });

    cont.on('pointerup', () => {
      // For now, replay the same level. LevelSelect added in M4.
      this.scene.start('GameScene', { levelKey: '1-1', levelId: '1-1' });
    });

    cont.on('pointerover', () => cont.setColor('#ffffff'));
    cont.on('pointerout',  () => cont.setColor('#aaffaa'));
  }
}

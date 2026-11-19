import Phaser from 'phaser';
import { relayoutOnResize } from '../systems/ViewportFit';
import { getNextLevelId, getLevelConfig, isRegionFinale, REGION_NAMES } from '../data/levels';

export interface ResultsData {
  levelId: string;
  crowns: number;
  timeMs: number;
  coinsCollected: number;
  relicFound: boolean;
}

export class ResultsScene extends Phaser.Scene {
  private continueCalled = false;

  constructor() {
    super({ key: 'ResultsScene' });
  }

  create(data: ResultsData): void {
    relayoutOnResize(this); // centred layout: rebuild if the screen's shape changes
    this.continueCalled = false;

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

    // Starts dim, brightens after grace period
    const cfg = getLevelConfig(data.levelId);
    if (cfg && isRegionFinale(data.levelId)) {
      this.add.text(cx, y, `${REGION_NAMES[cfg.regionId].toUpperCase()} — COMPLETE`, {
        fontSize: '9px', color: '#ffdd00', fontFamily: 'monospace',
      }).setOrigin(0.5);
      y += 14;
    }

    const nextId = getNextLevelId(data.levelId);
    if (!nextId) {
      this.add.text(cx, y, 'More of the road awaits soon...', {
        fontSize: '8px', color: '#aaaaaa', fontFamily: 'monospace',
      }).setOrigin(0.5);
      y += 14;
    }

    const prompt = this.add.text(cx, y, 'tap or press any key to continue', {
      fontSize: '8px', color: '#aaffaa', fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0.3);

    const doContinue = () => {
      if (this.continueCalled) return;
      this.continueCalled = true;
      if (nextId) {
        this.scene.start('GameScene', { levelKey: nextId, levelId: nextId });
      } else {
        this.scene.start('MainMenuScene');
      }
    };

    // 1s grace period — lets crown animation play before accepting input
    const timer = setTimeout(() => {
      prompt.setAlpha(1);
      window.addEventListener('pointerup', doContinue);
      window.addEventListener('keydown', doContinue);
    }, 1000);

    this.events.once('shutdown', () => {
      clearTimeout(timer);
      window.removeEventListener('pointerup', doContinue);
      window.removeEventListener('keydown', doContinue);
    });
  }
}

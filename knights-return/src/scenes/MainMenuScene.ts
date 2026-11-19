import Phaser from 'phaser';
import { SaveManager } from '../systems/SaveManager';
import { getContinueLevelId } from '../data/levels';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const cx = this.scale.width / 2;
    const h  = this.scale.height;

    const menuObjs:  Phaser.GameObjects.Text[] = [];
    const instrObjs: Phaser.GameObjects.Text[] = [];

    const showMenu = () => {
      menuObjs.forEach(o => o.setVisible(true));
      instrObjs.forEach(o => o.setVisible(false));
    };
    const showInstr = () => {
      menuObjs.forEach(o => o.setVisible(false));
      instrObjs.forEach(o => o.setVisible(true));
    };

    // ── Menu ──────────────────────────────────────────────────────────

    menuObjs.push(
      this.add.text(cx, 50, "KNIGHT'S RETURN", {
        fontSize: '16px', color: '#ffdd00', fontFamily: 'monospace',
      }).setOrigin(0.5),

      this.add.text(cx, 70, '───────────────', {
        fontSize: '8px', color: '#444466', fontFamily: 'monospace',
      }).setOrigin(0.5),
    );

    const hasSave = Object.keys(SaveManager.get().crowns).length > 0;
    let nextY = 100;

    menuObjs.push(this.makeButton(cx, nextY, 'NEW GAME', () => {
      SaveManager.reset();
      this.scene.start('GameScene', { levelKey: '1-1', levelId: '1-1' });
    }));
    nextY += 20;

    if (hasSave) {
      menuObjs.push(this.makeButton(cx, nextY, 'CONTINUE', () => {
        const id = getContinueLevelId(SaveManager.get().crowns);
        this.scene.start('GameScene', { levelKey: id, levelId: id });
      }));
      nextY += 20;
    }

    menuObjs.push(this.makeButton(cx, nextY, 'INSTRUCTIONS', showInstr));

    menuObjs.push(
      this.add.text(this.scale.width - 4, h - 4, 'v0.1', {
        fontSize: '6px', color: '#444466', fontFamily: 'monospace',
      }).setOrigin(1, 1),
    );

    // ── Instructions ──────────────────────────────────────────────────

    instrObjs.push(
      this.add.text(cx, 30, '── CONTROLS ──', {
        fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5),
    );

    const rows: [string, string][] = [
      ['Move',        'Arrow keys / A  D'],
      ['Jump',        'Space / W / Up'],
      ['Double Jump', 'Jump again in air'],
      ['Punch',       'J  or  Z'],
      ['Pogo strike', 'Down + J/Z  (in air)'],
    ];
    let iy = 55;
    for (const [label, value] of rows) {
      instrObjs.push(
        this.add.text(cx - 80, iy, label, {
          fontSize: '7px', color: '#aaaaaa', fontFamily: 'monospace',
        }),
        this.add.text(cx + 20, iy, value, {
          fontSize: '7px', color: '#ffffff', fontFamily: 'monospace',
        }),
      );
      iy += 14;
    }

    instrObjs.push(
      this.add.text(cx, iy + 10, '── GOAL ──', {
        fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5),
      this.add.text(cx, iy + 26, 'Beat rats and crows, collect coins,\nreach the red flag!', {
        fontSize: '7px', color: '#aaaaaa', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5),
    );

    instrObjs.push(this.makeButton(cx, 205, 'BACK', showMenu));

    instrObjs.forEach(o => o.setVisible(false));
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, `[ ${label} ]`, {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ color: '#ffdd00' }));
    btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
    btn.on('pointerup',   onClick);
    return btn;
  }
}

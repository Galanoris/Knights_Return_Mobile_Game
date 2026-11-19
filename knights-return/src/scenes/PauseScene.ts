import Phaser from 'phaser';
import { relayoutOnResize, getSafeInsets } from '../systems/ViewportFit';
import { getLevelConfig } from '../data/levels';
import { resetTouchInput } from '../ui/TouchControls';

export interface PauseData {
  levelId: string;
  levelKey: string;
}

const INPUT_GUARD_MS = 150; // ignore the key press that opened the menu

/**
 * Overlay launched by GameScene (Esc / P / HUD pause button) while GameScene and HUDScene
 * are paused. Keyboard: ↑↓ or W/S to choose, Enter/Space/J/Z to confirm, Esc/P to resume.
 */
export class PauseScene extends Phaser.Scene {
  private levelId = '';
  private levelKey = '';
  private buttons: { text: Phaser.GameObjects.Text; label: string; action: () => void }[] = [];
  private selected = 0;
  private openedAt = 0;
  private closing = false;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(data: PauseData): void {
    relayoutOnResize(this); // centred layout: rebuild if the screen's shape changes
    this.levelId = data.levelId;
    this.levelKey = data.levelKey;
    this.buttons = [];
    this.selected = 0;
    this.closing = false;
    this.openedAt = this.game.loop.time;

    const { width, height } = this.scale;
    const cx = width / 2;

    // Dim the frozen level; interactive so taps never fall through to the game/HUD below
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0, 0).setInteractive();

    this.add.text(cx, 50, 'PAUSED', {
      fontSize: '16px', color: '#ffdd00', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);
    const name = getLevelConfig(this.levelId)?.name;
    this.add.text(cx, 70, name ? `${this.levelId} · ${name}` : `LEVEL ${this.levelId}`, {
      fontSize: '8px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const items: [string, () => void][] = [
      ['RESUME',        () => this.resumeGame()],
      ['RESTART LEVEL', () => this.restartLevel()],
      ['MAIN MENU',     () => this.toMainMenu()],
    ];
    // RESUME must stay first — Esc/P activate index 0
    items.forEach(([label, action], i) => {
      const text = this.add.text(cx, 104 + i * 20, label, {
        fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      text.on('pointerover', () => this.select(i));
      text.on('pointerup', () => this.activate(i));
      this.buttons.push({ text, label, action });
    });
    this.select(0);

    if (!this.sys.game.device.input.touch) {
      this.add.text(cx, height - 12 - getSafeInsets(this.scale).bottom, '↑↓ choose · Enter confirm · Esc resume', {
        fontSize: '6px', color: '#888888', fontFamily: 'monospace',
      }).setOrigin(0.5);
    }

    // Keyboard-plugin listeners are removed automatically when this scene shuts down
    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => {
      if (ev.repeat || this.game.loop.time - this.openedAt < INPUT_GUARD_MS) return;
      switch (ev.code) {
        case 'Escape': case 'KeyP':
          this.activate(0); break; // RESUME
        case 'ArrowUp': case 'KeyW':
          this.select((this.selected + this.buttons.length - 1) % this.buttons.length); break;
        case 'ArrowDown': case 'KeyS':
          this.select((this.selected + 1) % this.buttons.length); break;
        case 'Enter': case 'Space': case 'KeyJ': case 'KeyZ':
          this.activate(this.selected); break;
      }
    });
  }

  private select(i: number): void {
    this.selected = i;
    this.buttons.forEach((b, k) => {
      b.text.setText(k === i ? `▶ ${b.label} ◀` : b.label);
      b.text.setColor(k === i ? '#ffdd00' : '#ffffff');
    });
  }

  private activate(i: number): void {
    if (this.closing) return;
    this.closing = true;
    this.buttons[i].action();
  }

  private resumeGame(): void {
    resetTouchInput();
    this.scene.resume('HUDScene');
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  private restartLevel(): void {
    // GameScene.create() stops and relaunches the HUD itself
    resetTouchInput();
    this.scene.start('GameScene', { levelKey: this.levelKey, levelId: this.levelId });
  }

  private toMainMenu(): void {
    resetTouchInput();
    this.scene.stop('HUDScene');
    this.scene.stop('GameScene');
    this.scene.start('MainMenuScene');
  }
}

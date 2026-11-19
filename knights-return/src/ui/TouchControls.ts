import Phaser from 'phaser';
import type { Insets } from '../systems/ViewportFit';

type TouchKey = 'left' | 'right' | 'down' | 'jump' | 'attack';

/** Held state of the on-screen buttons; read by InputManager alongside the keyboard. */
export const touchInput: Record<TouchKey, boolean> = {
  left: false, right: false, down: false, jump: false, attack: false,
};

export function resetTouchInput(): void {
  for (const key of Object.keys(touchInput) as TouchKey[]) touchInput[key] = false;
}

const RADIUS = 16;
const IDLE_ALPHA = 0.15;
const HELD_ALPHA = 0.4;

// Anchored to a bottom corner so the layout works at any game width (see ViewportFit):
// dx = distance of the button centre from that side, dy = distance from the bottom.
const BUTTONS: { key: TouchKey; side: 'left' | 'right'; dx: number; dy: number; label: string }[] = [
  { key: 'left',   side: 'left',  dx: 24, dy: 25, label: '◀' },
  { key: 'right',  side: 'left',  dx: 62, dy: 25, label: '▶' },
  { key: 'down',   side: 'left',  dx: 43, dy: 59, label: '▼' },
  { key: 'attack', side: 'right', dx: 66, dy: 21, label: 'HIT' },
  { key: 'jump',   side: 'right', dx: 26, dy: 41, label: 'JUMP' },
];

export class TouchControls {
  /** Which pointer is holding each button, so a release only frees the buttons that finger held. */
  private heldBy = new Map<TouchKey, number>();
  private release = new Map<TouchKey, () => void>();
  private placed: { def: typeof BUTTONS[number]; circle: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text }[] = [];

  /** Let go of every held button (used when the game pauses — the release would otherwise be missed). */
  releaseAll: () => void = () => {};

  constructor(scene: Phaser.Scene) {
    scene.input.addPointer(3); // run + jump + attack at the same time

    for (const def of BUTTONS) {
      const circle = scene.add.circle(0, 0, RADIUS, 0xffffff, IDLE_ALPHA)
        .setStrokeStyle(1, 0xffffff, 0.5)
        // Hit area a bit larger than the drawn circle — thumbs are imprecise
        .setInteractive(new Phaser.Geom.Circle(RADIUS, RADIUS, RADIUS * 1.3), Phaser.Geom.Circle.Contains);
      const label = scene.add.text(0, 0, def.label, {
        fontSize: def.label.length > 1 ? '8px' : '10px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0.7);
      this.placed.push({ def, circle, label });

      const press = (p: Phaser.Input.Pointer) => {
        this.heldBy.set(def.key, p.id);
        touchInput[def.key] = true;
        circle.setFillStyle(0xffffff, HELD_ALPHA);
      };
      const release = () => {
        this.heldBy.delete(def.key);
        touchInput[def.key] = false;
        circle.setFillStyle(0xffffff, IDLE_ALPHA);
      };
      this.release.set(def.key, release);

      circle.on('pointerdown', press);
      // Sliding a finger from ◀ onto ▶ should switch direction without lifting
      circle.on('pointerover', (p: Phaser.Input.Pointer) => { if (p.isDown) press(p); });
      circle.on('pointerout', (p: Phaser.Input.Pointer) => {
        if (this.heldBy.get(def.key) === p.id) release();
      });
    }

    this.releaseAll = () => { for (const key of [...this.heldBy.keys()]) this.release.get(key)!(); };

    const releasePointer = (p: Phaser.Input.Pointer) => {
      for (const [key, id] of this.heldBy) if (id === p.id) this.release.get(key)!();
    };
    scene.input.on('pointerup', releasePointer);
    scene.input.on('pointerupoutside', releasePointer);

    this.layout(scene.scale.width, scene.scale.height, { top: 0, right: 0, bottom: 0, left: 0 });
  }

  /** Place the buttons in the bottom corners of a width×height screen, inside the safe area. */
  layout(width: number, height: number, insets: Insets): void {
    for (const { def, circle, label } of this.placed) {
      const x = def.side === 'left' ? insets.left + def.dx : width - insets.right - def.dx;
      const y = height - insets.bottom - def.dy;
      circle.setPosition(x, y);
      label.setPosition(x, y);
    }
  }
}

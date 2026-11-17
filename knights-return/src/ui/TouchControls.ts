import Phaser from 'phaser';

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

const BUTTONS: { key: TouchKey; x: number; y: number; label: string }[] = [
  { key: 'left',   x: 24,  y: 200, label: '◀' },
  { key: 'right',  x: 62,  y: 200, label: '▶' },
  { key: 'down',   x: 43,  y: 166, label: '▼' },
  { key: 'attack', x: 334, y: 204, label: 'HIT' },
  { key: 'jump',   x: 374, y: 184, label: 'JUMP' },
];

export class TouchControls {
  /** Which pointer is holding each button, so a release only frees the buttons that finger held. */
  private heldBy = new Map<TouchKey, number>();
  private release = new Map<TouchKey, () => void>();

  constructor(scene: Phaser.Scene) {
    scene.input.addPointer(3); // run + jump + attack at the same time

    for (const def of BUTTONS) {
      const circle = scene.add.circle(def.x, def.y, RADIUS, 0xffffff, IDLE_ALPHA)
        .setStrokeStyle(1, 0xffffff, 0.5)
        // Hit area a bit larger than the drawn circle — thumbs are imprecise
        .setInteractive(new Phaser.Geom.Circle(RADIUS, RADIUS, RADIUS * 1.3), Phaser.Geom.Circle.Contains);
      scene.add.text(def.x, def.y, def.label, {
        fontSize: def.label.length > 1 ? '8px' : '10px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setAlpha(0.7);

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

    const releasePointer = (p: Phaser.Input.Pointer) => {
      for (const [key, id] of this.heldBy) if (id === p.id) this.release.get(key)!();
    };
    scene.input.on('pointerup', releasePointer);
    scene.input.on('pointerupoutside', releasePointer);
  }
}

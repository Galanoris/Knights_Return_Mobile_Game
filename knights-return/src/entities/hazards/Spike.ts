import Phaser from 'phaser';

export class Spike extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
    // Position sprite at center of object rect
    super(scene, x + w / 2, y + h / 2, 'spike');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w - 2, h - 4); // slightly smaller hitbox than visual (forgiving)
    body.reset(x + w / 2, y + h / 2);
  }
}

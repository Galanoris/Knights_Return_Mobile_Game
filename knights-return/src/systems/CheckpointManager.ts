import Phaser from 'phaser';

export class CheckpointManager {
  private respawnPoint: Phaser.Math.Vector2;

  constructor(defaultX: number, defaultY: number) {
    this.respawnPoint = new Phaser.Math.Vector2(defaultX, defaultY);
  }

  activate(x: number, y: number): void {
    this.respawnPoint.set(x, y);
  }

  get x(): number { return this.respawnPoint.x; }
  get y(): number { return this.respawnPoint.y; }
}

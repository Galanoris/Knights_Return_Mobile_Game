import Phaser from 'phaser';
import { CAM_LOOK_AHEAD } from '../config';

export class CameraController {
  private cam: Phaser.Cameras.Scene2D.Camera;
  private target: Phaser.Physics.Arcade.Sprite;
  private currentOffset = 0;

  constructor(
    cam: Phaser.Cameras.Scene2D.Camera,
    target: Phaser.Physics.Arcade.Sprite,
    worldBounds: Phaser.Geom.Rectangle,
  ) {
    this.cam = cam;
    this.target = target;
    cam.setBounds(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height);
    cam.startFollow(target, true, 0.1, 0.1);
  }

  update(): void {
    const vx = (this.target.body as Phaser.Physics.Arcade.Body).velocity.x;
    // Threshold of 20px/s ignores brief taps before speed builds up
    const targetOffset = Math.abs(vx) > 20 ? Math.sign(vx) * CAM_LOOK_AHEAD : 0;
    this.currentOffset += (targetOffset - this.currentOffset) * 0.08;
    if (Math.abs(this.currentOffset) < 0.5) this.currentOffset = 0;
    this.cam.setFollowOffset(-this.currentOffset, 0);
  }

  shake(duration = 150, intensity = 0.005): void {
    this.cam.shake(duration, intensity);
  }

  lock(): void {
    this.cam.stopFollow();
  }
}

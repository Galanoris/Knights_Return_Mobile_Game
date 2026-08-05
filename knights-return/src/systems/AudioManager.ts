import Phaser from 'phaser';

export class AudioManager {
  private scene: Phaser.Scene;
  private music: Phaser.Sound.BaseSound | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  playMusic(key: string, volume = 0.6): void {
    if (this.music) {
      this.music.stop();
    }
    if (!this.scene.cache.audio.exists(key)) return;
    this.music = this.scene.sound.add(key, { loop: true, volume });
    this.music.play();
  }

  stopMusic(): void {
    this.music?.stop();
    this.music = null;
  }

  playSfx(key: string, volume = 1): void {
    if (!this.scene.cache.audio.exists(key)) return;
    this.scene.sound.play(key, { volume });
  }
}

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Loading bar
    const bar = this.add.graphics();
    const bg = this.add.graphics();
    bg.fillStyle(0x333333);
    bg.fillRect(48, 98, 304, 24);
    this.load.on('progress', (v: number) => {
      bar.clear();
      bar.fillStyle(0xffdd00);
      bar.fillRect(50, 100, 300 * v, 20);
    });

    this.add.text(this.scale.width / 2, 80, 'LOADING...', {
      fontSize: '8px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Tilemap — only level 1-1 for now
    this.load.tilemapTiledJSON('1-1', 'assets/tilemaps/levels/1-1.json');
  }

  create(): void {
    this.generateTextures();
    this.scene.start('MainMenuScene');
  }

  private makeTexture(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private generateTextures(): void {
    this.makeTexture('tiles', 16, 16, g => {
      g.fillStyle(0x7a7a8a); g.fillRect(0, 0, 16, 16);
      g.lineStyle(1, 0x55556a); g.strokeRect(0, 0, 15, 15);
      g.fillStyle(0x9a9aaa); g.fillRect(1, 1, 14, 3);
    });

    this.makeTexture('player', 12, 16, g => {
      g.fillStyle(0x3366cc); g.fillRect(0, 0, 12, 16);
      g.fillStyle(0x88aaff); g.fillRect(1, 1, 10, 4);
    });

    this.makeTexture('spike', 16, 16, g => {
      g.fillStyle(0xdd2222); g.fillTriangle(8, 0, 16, 16, 0, 16);
      g.fillStyle(0xff4444); g.fillTriangle(8, 3, 13, 14, 3, 14);
    });

    this.makeTexture('coin', 12, 12, g => {
      g.fillStyle(0xffd700); g.fillCircle(6, 6, 6);
      g.fillStyle(0xffee88); g.fillCircle(4, 4, 3);
    });

    this.makeTexture('relic', 12, 12, g => {
      g.fillStyle(0x00cc66);
      g.fillRect(3, 0, 6, 3); g.fillRect(0, 3, 12, 6); g.fillRect(3, 9, 6, 3);
      g.fillStyle(0x88ffcc); g.fillRect(4, 1, 3, 2);
    });

    this.makeTexture('checkpoint', 16, 16, g => {
      g.fillStyle(0x888888); g.fillRect(6, 0, 4, 16);
      g.fillStyle(0x444444); g.fillRect(4, 12, 8, 4);
    });

    this.makeTexture('checkpoint_active', 16, 16, g => {
      g.fillStyle(0x888888); g.fillRect(6, 0, 4, 16);
      g.fillStyle(0x444444); g.fillRect(4, 12, 8, 4);
      g.fillStyle(0xdddd00); g.fillRect(7, 1, 7, 6);
    });

    this.makeTexture('banner', 16, 16, g => {
      g.fillStyle(0x888888); g.fillRect(6, 0, 4, 16);
      g.fillStyle(0xff4400); g.fillRect(7, 1, 9, 7);
    });

    this.makeTexture('rat', 12, 10, g => {
      g.fillStyle(0x886644); g.fillRect(0, 2, 12, 8);  // body
      g.fillStyle(0x553322); g.fillRect(0, 0, 4, 4);   // head
      g.fillStyle(0x000000); g.fillRect(2, 1, 1, 1);   // eye
    });
  }
}

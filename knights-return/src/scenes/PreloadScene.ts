import Phaser from 'phaser';
import { PLAYABLE_LEVEL_IDS } from '../data/levels';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
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

    for (const id of PLAYABLE_LEVEL_IDS) {
      this.load.tilemapTiledJSON(id, `assets/tilemaps/levels/${id}.json`);
    }
  }

  create(): void {
    this.generateTextures();
    this.anims.create({
      key: 'run',
      frames: [{ key: 'player_run1' }, { key: 'player_run2' }],
      frameRate: 10,
      repeat: -1,
    });
    this.scene.start('MainMenuScene');
  }

  private makeTexture(key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private generateTextures(): void {
    // ── Tile (16×16) — two-row stone brick ──────────────────────────────────
    this.makeTexture('tiles', 16, 16, g => {
      const mortar = 0x3a4050, mid = 0x6e7a8a, hi = 0x8aaabb, lo = 0x4a5a6a;
      g.fillStyle(mortar); g.fillRect(0, 0, 16, 16);

      // Brick row 1 (y 0–6): two bricks, split at x 7/8
      g.fillStyle(mid);
      g.fillRect(0, 0, 7, 7);
      g.fillRect(9, 0, 7, 7);
      g.fillStyle(hi);
      g.fillRect(0, 0, 6, 1);  g.fillRect(0, 0, 1, 6);   // left brick highlight
      g.fillRect(9, 0, 6, 1);  g.fillRect(9, 0, 1, 6);   // right brick highlight
      g.fillStyle(lo);
      g.fillRect(0, 6, 7, 1);  g.fillRect(6, 0, 1, 7);   // left brick shadow
      g.fillRect(9, 6, 7, 1);  g.fillRect(15, 0, 1, 7);  // right brick shadow

      // Brick row 2 (y 9–15): three bricks (offset)
      g.fillStyle(mid);
      g.fillRect(0, 9, 4, 7);
      g.fillRect(6, 9, 5, 7);
      g.fillRect(13, 9, 3, 7);
      g.fillStyle(hi);
      g.fillRect(0, 9, 3, 1);  g.fillRect(0, 9, 1, 6);
      g.fillRect(6, 9, 4, 1);  g.fillRect(6, 9, 1, 6);
      g.fillRect(13, 9, 2, 1); g.fillRect(13, 9, 1, 6);
      g.fillStyle(lo);
      g.fillRect(0, 15, 4, 1); g.fillRect(4, 9, 1, 7);
      g.fillRect(6, 15, 5, 1); g.fillRect(10, 9, 1, 7);
      g.fillRect(13, 15, 3, 1); g.fillRect(15, 9, 1, 7);
    });

    // ── Player (12×16) — armored knight: standing + two walk frames ─────────
    this.makeTexture('player',      12, 16, g => this.drawKnight(g, 0, 0));
    this.makeTexture('player_run1', 12, 16, g => this.drawKnight(g, 0, 2));
    this.makeTexture('player_run2', 12, 16, g => this.drawKnight(g, 2, 0));

    this.generateWorldTextures();
  }

  /** leftLift / rightLift raise that leg by N pixels — alternating them makes the walk cycle. */
  private drawKnight(g: Phaser.GameObjects.Graphics, leftLift: number, rightLift: number): void {
    const dark   = 0x3a4a5a;
    const mid    = 0x5a7090;
    const hiArmor = 0x8ab0c0;
    const visor  = 0x0a0a14;
    const belt   = 0x7a4a28;
    const buckle = 0xccaa44;

    // Helmet dome (rows 0–3)
    g.fillStyle(mid);   g.fillRect(2, 0, 8, 4);
    g.fillStyle(dark);  g.fillRect(2, 0, 1, 4); g.fillRect(9, 0, 1, 4); // sides
    g.fillStyle(hiArmor); g.fillRect(3, 0, 6, 1); g.fillRect(3, 0, 1, 3); // top + left
    // Visor slit (rows 2–3, inner 6px)
    g.fillStyle(visor); g.fillRect(3, 2, 6, 2);
    g.fillStyle(hiArmor); g.fillRect(3, 2, 1, 1); // glint in visor

    // Collar (row 4)
    g.fillStyle(dark); g.fillRect(3, 4, 6, 1);

    // Chest plate (rows 5–9)
    g.fillStyle(mid);     g.fillRect(1, 5, 10, 5);
    g.fillStyle(dark);    g.fillRect(1, 5, 1, 5); g.fillRect(10, 5, 1, 5);  // sides
    g.fillStyle(hiArmor); g.fillRect(2, 5, 8, 1); g.fillRect(2, 5, 1, 4);   // top + left hi
    g.fillStyle(dark);    g.fillRect(1, 9, 10, 1);                           // bottom shadow
    // Centre crease
    g.fillStyle(dark); g.fillRect(5, 6, 2, 3);

    // Belt (rows 10–11)
    g.fillStyle(belt);   g.fillRect(2, 10, 8, 2);
    g.fillStyle(buckle); g.fillRect(4, 10, 4, 2);
    g.fillStyle(dark);   g.fillRect(2, 10, 1, 2); g.fillRect(9, 10, 1, 2);

    // Legs: thigh (rows 12–13), wider boot, dark sole — shifted up by `lift`
    const leg = (x: number, bootX: number, lift: number) => {
      if (lift < 2) { g.fillStyle(mid); g.fillRect(x, 12, 4, 2 - lift); }
      g.fillStyle(mid);  g.fillRect(bootX, 14 - lift, 5, 1);
      g.fillStyle(dark); g.fillRect(bootX, 15 - lift, 5, 1);
    };
    leg(1, 0, leftLift);
    leg(7, 7, rightLift);
  }

  private generateWorldTextures(): void {
    // ── Rat (12×10) — brown rodent ──────────────────────────────────────────
    this.makeTexture('rat', 12, 10, g => {
      const outline = 0x2a1a0a, dark = 0x5a3a1e, mid = 0x7a5032;
      const belly = 0xc08855, ear = 0xcc8880;

      // Body oval (cols 2–11, rows 2–8)
      g.fillStyle(mid);   g.fillRect(2, 2, 9, 6);
      g.fillStyle(dark);  g.fillRect(2, 2, 9, 1);   // top edge
      g.fillStyle(dark);  g.fillRect(2, 8, 9, 1);   // bottom edge
      g.fillStyle(dark);  g.fillRect(10, 2, 1, 7);  // right edge
      g.fillStyle(belly); g.fillRect(4, 4, 5, 4);   // pale belly
      // Fur highlight on back
      g.fillStyle(0x996644); g.fillRect(3, 3, 5, 1);

      // Head (cols 0–3, rows 1–5)
      g.fillStyle(dark);  g.fillRect(0, 1, 4, 5);
      g.fillStyle(mid);   g.fillRect(0, 1, 3, 4);
      // Ear
      g.fillStyle(ear);   g.fillRect(1, 0, 2, 2);
      g.fillStyle(outline); g.fillRect(1, 0, 2, 1);
      // Eye
      g.fillStyle(0x000000); g.fillRect(1, 2, 1, 1);
      g.fillStyle(0xffffff); g.fillRect(2, 2, 1, 1); // eye glint
      // Nose
      g.fillStyle(0xcc5544); g.fillRect(0, 3, 1, 1);

      // Tail (cols 10–11, rows 6–9)
      g.fillStyle(dark); g.fillRect(10, 6, 2, 1);
      g.fillStyle(dark); g.fillRect(11, 7, 1, 2);
    });

    // ── Crow (12×10) — black bird, faces right (flipX when flying left) ─────
    this.makeTexture('crow', 12, 10, g => {
      const black = 0x14121c, dark = 0x2a2638, sheen = 0x4a4466;
      const beak = 0xe0a020, eye = 0xffdd33;

      // Body (cols 2–9, rows 3–7)
      g.fillStyle(dark);  g.fillRect(2, 3, 8, 5);
      g.fillStyle(black); g.fillRect(2, 7, 8, 1);    // belly shadow
      // Tail feathers (cols 0–2, rows 4–6)
      g.fillStyle(black); g.fillRect(0, 4, 2, 2); g.fillRect(0, 6, 1, 1);
      // Raised wing (cols 3–7, rows 0–3)
      g.fillStyle(black); g.fillRect(4, 0, 3, 1); g.fillRect(3, 1, 5, 2);
      g.fillStyle(sheen); g.fillRect(4, 1, 3, 1);    // wing sheen
      // Head (cols 8–10, rows 2–5)
      g.fillStyle(dark);  g.fillRect(8, 2, 3, 4);
      g.fillStyle(eye);   g.fillRect(9, 3, 1, 1);
      // Beak (col 11)
      g.fillStyle(beak);  g.fillRect(11, 4, 1, 1);
      // Legs (rows 8–9)
      g.fillStyle(beak);  g.fillRect(5, 8, 1, 2); g.fillRect(7, 8, 1, 2);
    });

    // ── Spike (16×16) — three-tine spike strip ──────────────────────────────
    this.makeTexture('spike', 16, 16, g => {
      const base = 0xaa1111, bright = 0xff4444, tipCol = 0xffcc88, metal = 0x556066;

      // Metal base strip
      g.fillStyle(metal);        g.fillRect(0, 13, 16, 3);
      g.fillStyle(0x889099);     g.fillRect(0, 13, 16, 1); // highlight on top of base

      // Centre spike (tallest)
      g.fillStyle(base);   g.fillTriangle(7, 0, 4, 13, 10, 13);
      g.fillStyle(bright); g.fillTriangle(7, 1, 5, 11, 8, 11);  // inner highlight
      g.fillStyle(tipCol); g.fillRect(7, 0, 1, 1);              // tip pixel

      // Left spike
      g.fillStyle(base);   g.fillTriangle(3, 4, 1, 13, 5, 13);
      g.fillStyle(bright); g.fillTriangle(3, 5, 2, 11, 4, 11);

      // Right spike
      g.fillStyle(base);   g.fillTriangle(13, 4, 11, 13, 15, 13);
      g.fillStyle(bright); g.fillTriangle(13, 5, 12, 11, 14, 11);
    });

    // ── Coin (12×12) — gold disc ────────────────────────────────────────────
    this.makeTexture('coin', 12, 12, g => {
      g.fillStyle(0xbb8800); g.fillCircle(6, 6, 6);  // outer ring
      g.fillStyle(0xffcc00); g.fillCircle(6, 6, 5);  // main gold
      g.fillStyle(0xffee66); g.fillCircle(4, 4, 2);  // shine spot
      g.fillStyle(0xffffff); g.fillRect(3, 3, 1, 1); // shine pixel
      g.fillStyle(0xcc9900); g.fillCircle(6, 6, 2);  // inner ring detail
      g.fillStyle(0xffaa00); g.fillRect(5, 5, 2, 2); // inner centre
    });

    // ── Relic (12×12) — glowing cross gem ───────────────────────────────────
    this.makeTexture('relic', 12, 12, g => {
      g.fillStyle(0x008844); g.fillRect(4, 0, 4, 12); // vertical bar
      g.fillStyle(0x008844); g.fillRect(0, 4, 12, 4); // horizontal bar
      g.fillStyle(0x00cc66); g.fillRect(5, 1, 2, 10); // inner bright vert
      g.fillStyle(0x00cc66); g.fillRect(1, 5, 10, 2); // inner bright horiz
      g.fillStyle(0x88ffcc); g.fillRect(5, 5, 2, 2);  // centre glow
      g.fillStyle(0xffffff); g.fillRect(5, 5, 1, 1);  // centre shine
    });

    // ── Checkpoint (16×16) — flagpole, inactive ──────────────────────────────
    this.makeTexture('checkpoint', 16, 16, g => {
      g.fillStyle(0x888888); g.fillRect(5, 0, 3, 16);  // pole
      g.fillStyle(0xaaaaaa); g.fillRect(5, 0, 1, 16);  // pole highlight
      g.fillStyle(0x555555); g.fillRect(7, 0, 1, 16);  // pole shadow
      g.fillStyle(0x666666); g.fillRect(3, 13, 8, 3);  // base block
      g.fillStyle(0x556677); g.fillRect(8, 2, 7, 5);   // flag (inactive grey-blue)
      g.fillStyle(0x778899); g.fillRect(8, 2, 6, 1);   // flag highlight
    });

    // ── Checkpoint active (16×16) — flagpole, activated ──────────────────────
    this.makeTexture('checkpoint_active', 16, 16, g => {
      g.fillStyle(0x888888); g.fillRect(5, 0, 3, 16);
      g.fillStyle(0xaaaaaa); g.fillRect(5, 0, 1, 16);
      g.fillStyle(0x555555); g.fillRect(7, 0, 1, 16);
      g.fillStyle(0x666666); g.fillRect(3, 13, 8, 3);
      g.fillStyle(0xdddd00); g.fillRect(8, 2, 7, 5);   // gold flag
      g.fillStyle(0xffff44); g.fillRect(8, 2, 6, 1);
      g.fillStyle(0xaaaa00); g.fillRect(8, 6, 7, 1);   // shadow
    });

    // ── Banner / level-end flag (16×16) ──────────────────────────────────────
    this.makeTexture('banner', 16, 16, g => {
      g.fillStyle(0x888888); g.fillRect(5, 0, 3, 16);
      g.fillStyle(0xaaaaaa); g.fillRect(5, 0, 1, 16);
      g.fillStyle(0x555555); g.fillRect(7, 0, 1, 16);
      g.fillStyle(0x666666); g.fillRect(3, 13, 8, 3);
      g.fillStyle(0xff4400); g.fillRect(8, 1, 7, 8);   // red banner
      g.fillStyle(0xff7744); g.fillRect(8, 1, 6, 1);   // highlight
      g.fillStyle(0xcc2200); g.fillRect(8, 8, 7, 1);   // shadow
      g.fillStyle(0xffffff); g.fillRect(10, 3, 3, 4);  // white cross detail
    });

    // ── Sky background (400×225) — gradient with stars ───────────────────────
    this.makeTexture('sky', 400, 225, g => {
      // Gradient bands from top (darkest) to bottom
      const bands: [number, number, number][] = [
        [0,   50, 0x08081a],
        [50,  50, 0x0a0a1e],
        [100, 50, 0x0c0c22],
        [150, 50, 0x0f0f26],
        [200, 25, 0x111128],
      ];
      for (const [y, h, col] of bands) {
        g.fillStyle(col); g.fillRect(0, y, 400, h);
      }
      // Stars — fixed pixel dots at scattered positions
      const stars = [
        [30, 12], [75, 7],  [122, 20], [180, 4],  [241, 17],
        [302, 9], [352, 24],[45, 38],  [162, 33], [282, 41],
        [381, 6], [92, 48], [322, 16], [141, 60], [201, 70],
        [62, 80], [261, 85],[341, 72], [15, 65],  [200, 22],
        [111, 90],[350, 58],[50, 110], [290, 100],[170, 105],
      ];
      g.fillStyle(0xffffff);
      for (const [sx, sy] of stars) { g.fillRect(sx, sy, 1, 1); }
      // A handful of slightly larger "bright" stars (2px)
      g.fillRect(150, 14, 2, 1);
      g.fillRect(222, 50, 1, 2);
      g.fillRect(318, 29, 2, 1);
    });
  }
}

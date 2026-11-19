#!/usr/bin/env node
// Builds Tiled-compatible JSON levels from ASCII sources.
//
//   node scripts/build-level.mjs          → builds every levels-src/*.txt
//   node scripts/build-level.mjs 1-2      → builds only levels-src/1-2.txt
//
// Source format: one line per tile row (all rows padded to the longest line).
// Lines starting with ';' are comments and ignored.
//
// Legend
//   #  solid tile (Platforms layer, tile 1)
//   B  cracked brick (Platforms layer, tile 2): solid like '#', breaks when punched
//   .  air
//   S  player spawn
//   r  rat            c  crow
//   ^  spike          f  fire (burning debris — hurts like a spike)
//   o  coin           R  relic
//   C  checkpoint     (2-tile-wide full-height trigger column; any row)
//   E  end trigger    (2-tile-wide full-height trigger column; any row)
//
// Object coordinates follow the hand-made 1-1.json: objects sit at the
// top-left of their tile, trigger zones span the full map height.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'levels-src');
const OUT_DIR = join(ROOT, 'public/assets/tilemaps/levels');
const T = 16;

const OBJECT_KINDS = {
  S: { layer: 'Entities',     type: 'spawn', name: 'player_spawn', w: 16, h: 16 },
  r: { layer: 'Entities',     type: 'rat',   name: 'rat',          w: 12, h: 10 },
  c: { layer: 'Entities',     type: 'crow',  name: 'crow',         w: 12, h: 10 },
  '^': { layer: 'Hazards',    type: 'spike', name: 'spike',        w: 16, h: 16 },
  f: { layer: 'Hazards',      type: 'fire',  name: 'fire',         w: 16, h: 16 },
  o: { layer: 'Collectibles', type: 'coin',  name: 'coin',         w: 12, h: 12 },
  R: { layer: 'Collectibles', type: 'relic', name: 'relic',        w: 12, h: 12 },
};
const TRIGGER_KINDS = {
  C: { type: 'checkpoint',  name: 'checkpoint' },
  E: { type: 'end_trigger', name: 'end_trigger' },
};

function build(id) {
  const raw = readFileSync(join(SRC_DIR, `${id}.txt`), 'utf8');
  const rows = raw.split(/\r?\n/).filter(l => l.length > 0 && !l.startsWith(';'));
  const height = rows.length;
  const width = Math.max(...rows.map(r => r.length));
  const grid = rows.map(r => r.padEnd(width, '.'));

  const data = new Array(width * height).fill(0);
  const layers = { Entities: [], Triggers: [], Hazards: [], Collectibles: [] };
  let crackedTiles = 0;
  const triggerCols = new Map(); // col → kind, so a column marked on several rows yields one zone
  let nextId = 1;
  let spawns = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const ch = grid[r][c];
      if (ch === '#') {
        data[r * width + c] = 1;
      } else if (ch === 'B') {
        data[r * width + c] = 2;
        crackedTiles++;
      } else if (OBJECT_KINDS[ch]) {
        const k = OBJECT_KINDS[ch];
        if (k.type === 'spawn') spawns++;
        layers[k.layer].push({
          id: nextId++, name: k.name, type: k.type,
          x: c * T, y: r * T, width: k.w, height: k.h,
          rotation: 0, visible: true, properties: [],
        });
      } else if (TRIGGER_KINDS[ch]) {
        triggerCols.set(c, ch);
      } else if (ch !== '.') {
        throw new Error(`${id}: unknown character '${ch}' at row ${r}, col ${c}`);
      }
    }
  }

  for (const [c, ch] of [...triggerCols].sort((a, b) => a[0] - b[0])) {
    const k = TRIGGER_KINDS[ch];
    layers.Triggers.push({
      id: nextId++, name: k.name, type: k.type,
      x: c * T, y: 0, width: 2 * T, height: height * T,
      rotation: 0, visible: true, properties: [],
    });
  }

  if (spawns !== 1) throw new Error(`${id}: expected exactly one spawn 'S', found ${spawns}`);
  if (!layers.Triggers.some(t => t.type === 'end_trigger')) throw new Error(`${id}: no end trigger 'E'`);

  const objectLayer = (lid, name) => ({
    draworder: 'topdown', id: lid, name, objects: layers[name],
    opacity: 1, type: 'objectgroup', visible: true, x: 0, y: 0,
  });

  const map = {
    compressionlevel: -1,
    height, width,
    infinite: false,
    layers: [
      {
        comment: `Generated from levels-src/${id}.txt by scripts/build-level.mjs — edit the .txt, not this file.`,
        data, height, id: 1, name: 'Platforms', opacity: 1,
        type: 'tilelayer', visible: true, width, x: 0, y: 0,
      },
      objectLayer(2, 'Entities'),
      objectLayer(3, 'Triggers'),
      objectLayer(4, 'Hazards'),
      objectLayer(5, 'Collectibles'),
    ],
    nextlayerid: 6,
    nextobjectid: nextId,
    orientation: 'orthogonal',
    renderorder: 'right-down',
    tiledversion: '1.8.0',
    tileheight: T,
    // The 'tiles' texture is generated in PreloadScene (tile 1 brick, tile 2 cracked brick).
    // Maps without cracked bricks keep the original one-tile entry so they stay byte-identical.
    tilesets: [{
      columns: crackedTiles ? 2 : 1, firstgid: 1, image: '../../tilesets/tiles.png',
      imageheight: 16, imagewidth: crackedTiles ? 32 : 16, margin: 0, name: 'tiles',
      spacing: 0, tilecount: crackedTiles ? 2 : 1, tileheight: 16, tilewidth: 16,
    }],
    tilewidth: T,
    type: 'map',
    version: '1.8',
  };

  writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(map, null, 2) + '\n');
  const count = n => layers[n].length;
  console.log(
    `${id}: ${width}×${height} tiles — ${count('Entities') - 1} enemies, ` +
    `${count('Hazards')} hazards, ${count('Collectibles')} collectibles, ${count('Triggers')} triggers` +
    (crackedTiles ? `, ${crackedTiles} cracked bricks` : ''),
  );
}

const ids = process.argv.length > 2
  ? process.argv.slice(2)
  : readdirSync(SRC_DIR).filter(f => f.endsWith('.txt')).map(f => basename(f, '.txt')).sort();
for (const id of ids) build(id);

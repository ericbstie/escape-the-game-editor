// Generates a compact "block gallery" level:
//  - all non-enemy block IDs on a tight grid (1 empty tile apart) above spawn
//  - exactly one enemy of each size, each sealed in its own solid box, placed
//    well away from the spawn and the rest of the blocks.
// Used to screenshot the real game and extract per-block sprites.

const BACKGROUND = 20;
const SPAWN = 4;
const SOLID = 1;
const TILE_PX = 16;

const COLS = 10;
const STEP = 2; // 1 empty tile between samples
const MARGIN = 2;

// One enemy per size. n = entity footprint in tiles (small 1x1, med 2x2, big 3x3)
const ENEMIES = [
  { id: 30, n: 1, label: "small" },
  { id: 38, n: 2, label: "medium" },
  { id: 43, n: 3, label: "big" },
];
const ENEMY_IDS = new Set([30, 36, 37, 38, 39, 43, 44]);

// Non-enemy samples: 0..56 except background (20), spawn (4) and all enemies.
const sampleIds: number[] = [];
for (let id = 0; id <= 56; id++) {
  if (id === BACKGROUND || id === SPAWN || ENEMY_IDS.has(id)) continue;
  sampleIds.push(id);
}

const rows = Math.ceil(sampleIds.length / COLS);
const galleryW = MARGIN * 2 + (COLS - 1) * STEP + 1;
const gridBottomY = MARGIN + (rows - 1) * STEP;
const floorY = gridBottomY + 3; // ground under the gallery/spawn

// Enemy boxes go far to the right of the gallery.
const GAP = 12;
const boxBottom = floorY - 1; // align box bottoms near the gallery baseline

interface Box {
  id: number;
  label: string;
  bx: number;
  by: number;
  s: number;
}
const boxes: Box[] = [];
let cursor = galleryW + GAP;
for (const e of ENEMIES) {
  const s = e.n + 2; // solid wall on every side
  boxes.push({ id: e.id, label: e.label, bx: cursor, by: boxBottom - (s - 1), s });
  cursor += s + 2; // 2-tile gap between boxes
}

const WIDTH = cursor - 2 + MARGIN;
const HEIGHT = floorY + 2;

const grid: number[][] = Array.from({ length: HEIGHT }, () =>
  Array<number>(WIDTH).fill(BACKGROUND)
);

// --- gallery samples ---
interface Placement {
  id: number;
  x: number;
  y: number;
}
const layout: Placement[] = [];
sampleIds.forEach((id, i) => {
  const x = MARGIN + (i % COLS) * STEP;
  const y = MARGIN + Math.floor(i / COLS) * STEP;
  grid[y]![x] = id;
  layout.push({ id, x, y });
});

// --- ground + spawn (left side only) ---
for (let x = 0; x < galleryW; x++) grid[floorY]![x] = SOLID;
const spawnX = MARGIN;
const spawnY = floorY - 1;
grid[spawnY]![spawnX] = SPAWN;

// --- enemy boxes ---
for (const b of boxes) {
  for (let y = b.by; y < b.by + b.s; y++) {
    for (let x = b.bx; x < b.bx + b.s; x++) {
      const edge =
        y === b.by || y === b.by + b.s - 1 || x === b.bx || x === b.bx + b.s - 1;
      if (edge) grid[y]![x] = SOLID;
    }
  }
  grid[b.by + 1]![b.bx + 1] = b.id; // enemy in the box interior (top-left)
}

// ---- serialize ----------------------------------------------------------
const lines: string[] = [];
lines.push(`[${WIDTH},${HEIGHT}]`);
for (const r of grid) lines.push(r.join(",") + ",");
lines.push("1");
lines.push(`(${spawnX * TILE_PX},${spawnY * TILE_PX}){992-224}[1,1]`);
await Bun.write("gallery/Level_gallery.txt", lines.join("\n"));

// ---- layout map ---------------------------------------------------------
const map: string[] = [];
map.push("# Block Gallery Layout", "");
map.push(`Grid: ${WIDTH} x ${HEIGHT} tiles.`);
map.push(`Non-enemy samples: ${COLS}-col grid, 1 empty tile apart, top-left.`);
map.push(`Spawn (id 4) at tile (${spawnX}, ${spawnY}); ground at row ${floorY}.`, "");
map.push("## Samples (ascending id, left-to-right, top-to-bottom)", "");
map.push("| id | tile (x,y) |", "| -- | ---------- |");
for (const p of layout) map.push(`| ${p.id} | (${p.x}, ${p.y}) |`);
map.push("", "## Enemy boxes (far right)", "");
map.push("| size | id | box top-left | box size | enemy tile |");
map.push("| ---- | -- | ------------ | -------- | ---------- |");
for (const b of boxes) {
  map.push(
    `| ${b.label} | ${b.id} | (${b.bx}, ${b.by}) | ${b.s}x${b.s} | (${b.bx + 1}, ${b.by + 1}) |`
  );
}
await Bun.write("gallery/layout.md", map.join("\n") + "\n");

console.log(`Wrote gallery/Level_gallery.txt  (${WIDTH}x${HEIGHT}, ${sampleIds.length} samples + 3 boxed enemies)`);
for (const b of boxes) console.log(`  ${b.label} enemy id ${b.id}: ${b.s}x${b.s} box at (${b.bx},${b.by})`);

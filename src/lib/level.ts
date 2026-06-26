// The editor stores blocks in an unbounded world coordinate system (a sparse
// map keyed by "x,y"). The "level" itself is just a rectangular cut-out of that
// world, described by `bounds`. Resizing moves the bounds edges; blocks outside
// the bounds are retained (not destroyed) so you can shrink and re-expand
// without losing work. On export we slice out the bounds region.

export interface Bounds {
  left: number;
  top: number;
  right: number; // exclusive
  bottom: number; // exclusive
}

export type ToolMode = "paint" | "erase";

export interface LevelState {
  cells: Map<string, number>; // "x,y" -> blockId (background id 20 is omitted)
  bounds: Bounds;
  spawnKey: string | null; // key of the unique spawn cell (id 4), or null
  selectedBlock: number;
  mode: ToolMode; // sticky tool, toggled from the floating bar
}

export const BACKGROUND = 20;
export const SPAWN = 4;
export const TILE_PX = 16;

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function parseKey(key: string): [number, number] {
  const i = key.indexOf(",");
  return [Number(key.slice(0, i)), Number(key.slice(i + 1))];
}

export function boundsWidth(b: Bounds): number {
  return b.right - b.left;
}

export function boundsHeight(b: Bounds): number {
  return b.bottom - b.top;
}

export function createEmptyLevel(width: number, height: number): LevelState {
  return {
    cells: new Map(),
    bounds: { left: 0, top: 0, right: width, bottom: height },
    spawnKey: null,
    selectedBlock: 1,
    mode: "paint",
  };
}

export interface Snapshot {
  cells: Map<string, number>;
  bounds: Bounds;
  spawnKey: string | null;
}

export function snapshot(s: LevelState): Snapshot {
  return {
    cells: new Map(s.cells),
    bounds: { ...s.bounds },
    spawnKey: s.spawnKey,
  };
}

export function serialize(state: LevelState): string {
  const { left, top, right, bottom } = state.bounds;
  const w = right - left;
  const h = bottom - top;

  const lines: string[] = [];
  lines.push(`[${w},${h}]`);

  for (let y = top; y < bottom; y++) {
    const row: number[] = [];
    for (let x = left; x < right; x++) {
      row.push(state.cells.get(cellKey(x, y)) ?? BACKGROUND);
    }
    lines.push(row.join(",") + ",");
  }

  // Spawn coordinates are relative to the bounds origin, in pixels.
  let sx = 0;
  let sy = 0;
  if (state.spawnKey) {
    const [scx, scy] = parseKey(state.spawnKey);
    if (scx >= left && scx < right && scy >= top && scy < bottom) {
      sx = (scx - left) * TILE_PX;
      sy = (scy - top) * TILE_PX;
    }
  }

  lines.push("1");
  lines.push(`(${sx},${sy}){992-224}[1,1]`);

  return lines.join("\n");
}

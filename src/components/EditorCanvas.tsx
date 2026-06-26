import { useRef, useEffect, useCallback } from "react";
import { getBlock, blockFootprint } from "../lib/blocks";
import { BLOCK_SPRITES } from "../lib/blockSprites";
import {
  BACKGROUND,
  cellKey,
  parseKey,
  type Bounds,
  type LevelState,
} from "../lib/level";

const TILE = 16;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const MAX_DIM = 1000;
const HANDLE = 9; // grab threshold / draw size in screen px
const CAM_SPEED = 750; // px/sec for WASD camera
const SPRITE_INSET = 5; // px trimmed from each side of a sprite when drawn

type HandleId = "left" | "right" | "top" | "bottom" | "tl" | "tr" | "bl" | "br";

interface ViewState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

interface EditorCanvasProps {
  level: LevelState;
  onPaint: (x: number, y: number, blockId: number) => void;
  onStrokeStart: () => void;
  onResize: (bounds: Bounds) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function edgesFor(h: HandleId) {
  return {
    l: h === "left" || h === "tl" || h === "bl",
    r: h === "right" || h === "tr" || h === "br",
    t: h === "top" || h === "tl" || h === "tr",
    b: h === "bottom" || h === "bl" || h === "br",
  };
}

function cursorFor(h: HandleId | null): string {
  switch (h) {
    case "left":
    case "right":
      return "ew-resize";
    case "top":
    case "bottom":
      return "ns-resize";
    case "tl":
    case "br":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "crosshair";
  }
}

export function EditorCanvas({
  level,
  onPaint,
  onStrokeStart,
  onResize,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const view = useRef<ViewState>({ offsetX: 60, offsetY: 60, zoom: 1 });
  const levelRef = useRef(level);
  levelRef.current = level;

  const isPainting = useRef(false);
  const strokeErasing = useRef(false); // does the active stroke erase?
  const hoverCell = useRef<{ x: number; y: number } | null>(null);
  const lastPainted = useRef<{ x: number; y: number } | null>(null);

  const resizeHandle = useRef<HandleId | null>(null);
  const hoverHandle = useRef<HandleId | null>(null);

  const keys = useRef<Set<string>>(new Set());
  const lastFrame = useRef<number>(performance.now());

  // Preloaded block sprite images, keyed by block id.
  const sprites = useRef<Map<number, HTMLImageElement>>(new Map());
  useEffect(() => {
    for (const [idStr, url] of Object.entries(BLOCK_SPRITES)) {
      const img = new Image();
      img.src = url;
      sprites.current.set(Number(idStr), img);
    }
  }, []);

  // ---- coordinate helpers -------------------------------------------------
  const canvasXY = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { mx: clientX - rect.left, my: clientY - rect.top };
  }, []);

  const worldCell = useCallback((mx: number, my: number) => {
    const { offsetX, offsetY, zoom } = view.current;
    const ts = TILE * zoom;
    return {
      x: Math.floor((mx - offsetX) / ts),
      y: Math.floor((my - offsetY) / ts),
    };
  }, []);

  // Which resize handle (if any) is under a canvas-relative point.
  const handleAt = useCallback((mx: number, my: number): HandleId | null => {
    const { offsetX, offsetY, zoom } = view.current;
    const ts = TILE * zoom;
    const b = levelRef.current.bounds;
    const lx = offsetX + b.left * ts;
    const rx = offsetX + b.right * ts;
    const ty = offsetY + b.top * ts;
    const by = offsetY + b.bottom * ts;
    const midX = (lx + rx) / 2;
    const midY = (ty + by) / 2;

    const near = (a: number, bb: number) => Math.abs(a - bb) <= HANDLE;
    const corner = (hx: number, hy: number) =>
      Math.abs(mx - hx) <= HANDLE && Math.abs(my - hy) <= HANDLE;

    // Corners take priority
    if (corner(lx, ty)) return "tl";
    if (corner(rx, ty)) return "tr";
    if (corner(lx, by)) return "bl";
    if (corner(rx, by)) return "br";

    const withinX = mx >= lx - HANDLE && mx <= rx + HANDLE;
    const withinY = my >= ty - HANDLE && my <= by + HANDLE;
    if (near(mx, lx) && withinY) return "left";
    if (near(mx, rx) && withinY) return "right";
    if (near(my, ty) && withinX) return "top";
    if (near(my, by) && withinX) return "bottom";
    return null;
  }, []);

  const applyResize = useCallback(
    (mx: number, my: number) => {
      const h = resizeHandle.current;
      if (!h) return;
      const { offsetX, offsetY, zoom } = view.current;
      const ts = TILE * zoom;
      const b = { ...levelRef.current.bounds };
      const e = edgesFor(h);
      const wx = Math.round((mx - offsetX) / ts);
      const wy = Math.round((my - offsetY) / ts);
      if (e.l) b.left = clamp(wx, b.right - MAX_DIM, b.right - 1);
      if (e.r) b.right = clamp(wx, b.left + 1, b.left + MAX_DIM);
      if (e.t) b.top = clamp(wy, b.bottom - MAX_DIM, b.bottom - 1);
      if (e.b) b.bottom = clamp(wy, b.top + 1, b.top + MAX_DIM);
      const cur = levelRef.current.bounds;
      if (
        b.left !== cur.left ||
        b.right !== cur.right ||
        b.top !== cur.top ||
        b.bottom !== cur.bottom
      ) {
        onResize(b);
      }
    },
    [onResize]
  );

  // Paint at a world cell, respecting bounds + current mode.
  const applyPaint = useCallback(
    (x: number, y: number) => {
      const m = levelRef.current;
      const b = m.bounds;
      if (x < b.left || x >= b.right || y < b.top || y >= b.bottom) return;
      const lp = lastPainted.current;
      if (lp && lp.x === x && lp.y === y) return;
      lastPainted.current = { x, y };
      if (strokeErasing.current) onPaint(x, y, BACKGROUND);
      else onPaint(x, y, m.selectedBlock);
    },
    [onPaint]
  );

  // ---- WASD camera + render loop -----------------------------------------
  useEffect(() => {
    let raf = 0;
    const render = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        raf = requestAnimationFrame(render);
        return;
      }

      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrame.current) / 1000);
      lastFrame.current = now;

      // Camera movement
      const k = keys.current;
      let dx = 0;
      let dy = 0;
      if (k.has("a")) dx += 1;
      if (k.has("d")) dx -= 1;
      if (k.has("w")) dy += 1;
      if (k.has("s")) dy -= 1;
      if (dx || dy) {
        view.current.offsetX += dx * CAM_SPEED * dt;
        view.current.offsetY += dy * CAM_SPEED * dt;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        raf = requestAnimationFrame(render);
        return;
      }

      const lvl = levelRef.current;
      const b = lvl.bounds;
      const { offsetX, offsetY, zoom } = view.current;
      const ts = TILE * zoom;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#1c1b1f";
      ctx.fillRect(0, 0, w, h);

      // Visible world-cell range
      const startX = Math.floor(-offsetX / ts);
      const endX = Math.ceil((w - offsetX) / ts);
      const startY = Math.floor(-offsetY / ts);
      const endY = Math.ceil((h - offsetY) / ts);

      const inBounds = (x: number, y: number) =>
        x >= b.left && x < b.right && y >= b.top && y < b.bottom;

      // Tiles — draw real sprites where available, else the flat block colour.
      // `size` lets multi-tile enemies be drawn across their footprint.
      const tsCeil = Math.ceil(ts);
      const drawSprite = (id: number, dx: number, dy: number, size: number) => {
        const img = sprites.current.get(id);
        if (img && img.complete && img.naturalWidth > 0) {
          // Trim ~5px off every side of the source so the captured border/glow
          // doesn't show; scale the inner region to fill the target.
          const ix = Math.min(SPRITE_INSET, (img.naturalWidth - 1) / 2);
          const iy = Math.min(SPRITE_INSET, (img.naturalHeight - 1) / 2);
          ctx.drawImage(
            img,
            ix, iy, img.naturalWidth - 2 * ix, img.naturalHeight - 2 * iy,
            dx, dy, size, size
          );
        } else {
          ctx.fillStyle = getBlock(id).color;
          ctx.fillRect(dx, dy, size, size);
        }
      };
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const inside = inBounds(x, y);
          const id = lvl.cells.get(cellKey(x, y));
          if (inside) {
            ctx.globalAlpha = 1;
            // Multi-tile enemies are drawn in a later pass; keep the anchor
            // cell as background here so nothing peeks out behind them.
            const drawId = id !== undefined && blockFootprint(id) > 1 ? BACKGROUND : id ?? BACKGROUND;
            drawSprite(drawId, offsetX + x * ts, offsetY + y * ts, tsCeil);
          } else if (id !== undefined) {
            // Retained-but-cropped block: show dimmed
            ctx.globalAlpha = 0.18;
            drawSprite(id, offsetX + x * ts, offsetY + y * ts, tsCeil);
          }
        }
      }
      ctx.globalAlpha = 1;

      // Enemies still occupy a single cell, but large (3x3) and huge (6x6) ones
      // are drawn scaled-up and centred on their cell, on top of the tiles.
      // Scan a margin so a big enemy whose cell is off-screen still renders.
      const MAX_FP = 6;
      for (let y = startY - MAX_FP; y < endY + MAX_FP; y++) {
        for (let x = startX - MAX_FP; x < endX + MAX_FP; x++) {
          if (!inBounds(x, y)) continue;
          const id = lvl.cells.get(cellKey(x, y));
          if (id === undefined) continue;
          const fp = blockFootprint(id);
          if (fp <= 1) continue;
          const size = fp * ts;
          const dx = offsetX + (x + 0.5) * ts - size / 2;
          const dy = offsetY + (y + 0.5) * ts - size / 2;
          drawSprite(id, dx, dy, Math.ceil(size));
        }
      }

      // Grid overlay (inside bounds only)
      if (zoom >= 0.5) {
        const gx0 = Math.max(startX, b.left);
        const gx1 = Math.min(endX, b.right);
        const gy0 = Math.max(startY, b.top);
        const gy1 = Math.min(endY, b.bottom);
        if (gx0 < gx1 && gy0 < gy1) {
          ctx.strokeStyle = "rgba(236,230,218,0.10)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let x = gx0; x <= gx1; x++) {
            ctx.moveTo(offsetX + x * ts, offsetY + gy0 * ts);
            ctx.lineTo(offsetX + x * ts, offsetY + gy1 * ts);
          }
          for (let y = gy0; y <= gy1; y++) {
            ctx.moveTo(offsetX + gx0 * ts, offsetY + y * ts);
            ctx.lineTo(offsetX + gx1 * ts, offsetY + y * ts);
          }
          ctx.stroke();
        }
      }

      // Bounds border — subtle unless a handle is hovered / being dragged
      const bx = offsetX + b.left * ts;
      const byy = offsetY + b.top * ts;
      const bw = (b.right - b.left) * ts;
      const bh = (b.bottom - b.top) * ts;
      const edgeActive =
        hoverHandle.current !== null || resizeHandle.current !== null;
      ctx.strokeStyle = edgeActive ? "#a3d2ec" : "rgba(163,210,236,0.28)";
      ctx.lineWidth = edgeActive ? 2 : 1;
      ctx.strokeRect(bx, byy, bw, bh);

      // Spawn indicator
      if (lvl.spawnKey) {
        const [sx, sy] = parseKey(lvl.spawnKey);
        if (sx >= startX && sx < endX && sy >= startY && sy < endY) {
          const x = offsetX + sx * ts;
          const y = offsetY + sy * ts;
          ctx.strokeStyle = "#00e0ff";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
          if (zoom >= 0.75) {
            ctx.fillStyle = "#ffffff";
            ctx.font = `${Math.floor(ts * 0.7)}px "Patrick Hand", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("S", x + ts / 2, y + ts / 2);
          }
        }
      }

      // Hover cell highlight (inside bounds)
      const hc = hoverCell.current;
      if (hc && inBounds(hc.x, hc.y)) {
        ctx.strokeStyle = "rgba(236,230,218,0.8)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(offsetX + hc.x * ts, offsetY + hc.y * ts, ts, ts);
      }

      // Resize handles (8)
      const midX = bx + bw / 2;
      const midY = byy + bh / 2;
      const handles: [HandleId, number, number][] = [
        ["left", bx, midY],
        ["right", bx + bw, midY],
        ["top", midX, byy],
        ["bottom", midX, byy + bh],
        ["tl", bx, byy],
        ["tr", bx + bw, byy],
        ["bl", bx, byy + bh],
        ["br", bx + bw, byy + bh],
      ];
      for (const [id, cx, cy] of handles) {
        const active = hoverHandle.current === id || resizeHandle.current === id;
        const size = active ? HANDLE : HANDLE * 0.6;
        ctx.globalAlpha = active ? 1 : 0.3;
        ctx.fillStyle = active ? "#f3a7bb" : "#a3d2ec";
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
        if (active) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "#1c1b1f";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  // WASD key tracking
  useEffect(() => {
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return el?.tagName === "INPUT" || el?.tagName === "TEXTAREA";
    };
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ("wasd".includes(key) && !isTyping(e.target)) keys.current.add(key);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const clearAll = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clearAll);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearAll);
    };
  }, []);

  // ---- pointer handlers ---------------------------------------------------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { mx, my } = canvasXY(e.clientX, e.clientY);
      const mode = levelRef.current.mode;

      if (e.button === 0) {
        // Resize handle takes priority
        const handle = handleAt(mx, my);
        if (handle) {
          canvas.setPointerCapture(e.pointerId);
          resizeHandle.current = handle;
          onStrokeStart();
          applyResize(mx, my);
          return;
        }
        // Left-drag: erase in erase mode, otherwise paint
        canvas.setPointerCapture(e.pointerId);
        onStrokeStart();
        isPainting.current = true;
        strokeErasing.current = mode === "erase";
        lastPainted.current = null;
        const c = worldCell(mx, my);
        applyPaint(c.x, c.y);
      } else if (e.button === 2 && mode === "paint") {
        // Right-drag erases only in paint mode (does nothing in erase mode)
        canvas.setPointerCapture(e.pointerId);
        onStrokeStart();
        isPainting.current = true;
        strokeErasing.current = true;
        lastPainted.current = null;
        const c = worldCell(mx, my);
        applyPaint(c.x, c.y);
      }
    },
    [canvasXY, handleAt, applyResize, worldCell, applyPaint, onStrokeStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { mx, my } = canvasXY(e.clientX, e.clientY);
      const c = worldCell(mx, my);
      hoverCell.current = c;

      if (resizeHandle.current) {
        applyResize(mx, my);
        return;
      }
      if (isPainting.current) {
        applyPaint(c.x, c.y);
        return;
      }

      // Idle: update handle highlight + cursor
      const handle = handleAt(mx, my);
      hoverHandle.current = handle;
      canvas.style.cursor = cursorFor(handle);
    },
    [canvasXY, worldCell, applyResize, applyPaint, handleAt]
  );

  const endStroke = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    isPainting.current = false;
    strokeErasing.current = false;
    resizeHandle.current = null;
    lastPainted.current = null;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const { mx, my } = canvasXY(e.clientX, e.clientY);
      const v = view.current;
      const oldZoom = v.zoom;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newZoom = clamp(oldZoom * factor, MIN_ZOOM, MAX_ZOOM);
      const worldX = (mx - v.offsetX) / oldZoom;
      const worldY = (my - v.offsetY) / oldZoom;
      v.offsetX = mx - worldX * newZoom;
      v.offsetY = my - worldY * newZoom;
      v.zoom = newZoom;
    },
    [canvasXY]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block touch-none cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerLeave={() => {
          hoverCell.current = null;
          hoverHandle.current = null;
        }}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
}

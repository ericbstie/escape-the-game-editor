import { useState, useCallback, useRef, useEffect } from "react";
import "./index.css";
import { EditorCanvas } from "./components/EditorCanvas";
import { BlockPalette } from "./components/BlockPalette";
import { FloatingTools } from "./components/FloatingTools";
import { HowToPanel } from "./components/HowToPanel";
import {
  BACKGROUND,
  SPAWN,
  boundsWidth,
  boundsHeight,
  cellKey,
  createEmptyLevel,
  parseKey,
  serialize,
  snapshot,
  type Bounds,
  type LevelState,
  type Snapshot,
  type ToolMode,
} from "./lib/level";

const MAX_HISTORY = 50;
const EXPORT_FILENAME = "Level_custom.txt";

export function App() {
  const [level, setLevel] = useState<LevelState>(() => createEmptyLevel(80, 50));

  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [, bump] = useState(0);
  const rerenderUI = useCallback(() => bump(v => v + 1), []);

  const pushHistory = useCallback(() => {
    setLevel(cur => {
      undoStack.current.push(snapshot(cur));
      if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
      redoStack.current = [];
      return cur;
    });
    rerenderUI();
  }, [rerenderUI]);

  // Paint / erase / spawn at a world cell.
  const handlePaint = useCallback((x: number, y: number, blockId: number) => {
    setLevel(cur => {
      const key = cellKey(x, y);
      const existing = cur.cells.get(key) ?? BACKGROUND;
      if (existing === blockId) return cur;

      const cells = new Map(cur.cells);
      let spawnKey = cur.spawnKey;

      if (blockId === BACKGROUND) {
        cells.delete(key);
        if (spawnKey === key) spawnKey = null;
      } else if (blockId === SPAWN) {
        if (spawnKey && spawnKey !== key) cells.delete(spawnKey);
        cells.set(key, SPAWN);
        spawnKey = key;
      } else {
        cells.set(key, blockId);
        if (spawnKey === key) spawnKey = null;
      }

      return { ...cur, cells, spawnKey };
    });
  }, []);

  const handleResize = useCallback((bounds: Bounds) => {
    setLevel(cur => ({ ...cur, bounds }));
  }, []);

  const handleSetMode = useCallback((mode: ToolMode) => {
    setLevel(cur => (cur.mode === mode ? cur : { ...cur, mode }));
  }, []);

  const handleUndo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    setLevel(cur => {
      const snap = undoStack.current.pop()!;
      redoStack.current.push(snapshot(cur));
      return {
        ...cur,
        cells: new Map(snap.cells),
        bounds: { ...snap.bounds },
        spawnKey: snap.spawnKey,
      };
    });
    rerenderUI();
  }, [rerenderUI]);

  const handleRedo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    setLevel(cur => {
      const snap = redoStack.current.pop()!;
      undoStack.current.push(snapshot(cur));
      return {
        ...cur,
        cells: new Map(snap.cells),
        bounds: { ...snap.bounds },
        spawnKey: snap.spawnKey,
      };
    });
    rerenderUI();
  }, [rerenderUI]);

  const handleClear = useCallback(() => {
    if (!confirm("clear the entire level? (you can undo this)")) return;
    pushHistory();
    setLevel(cur => ({ ...cur, cells: new Map(), spawnKey: null }));
  }, [pushHistory]);

  const handleExport = useCallback(() => {
    const content = serialize(level);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = EXPORT_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [level]);

  // Undo/redo keyboard shortcuts (WASD camera is handled inside the canvas).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleUndo, handleRedo]);

  return (
    <div className="w-full h-screen flex flex-col bg-paper">
      <div className="flex-1 flex min-h-0">
        <BlockPalette
          selectedBlock={level.selectedBlock}
          onSelectBlock={id => setLevel(c => ({ ...c, selectedBlock: id }))}
        />
        <div className="flex-1 min-w-0 relative">
          <EditorCanvas
            level={level}
            onPaint={handlePaint}
            onStrokeStart={pushHistory}
            onResize={handleResize}
          />
          <FloatingTools
            mode={level.mode}
            canUndo={undoStack.current.length > 0}
            canRedo={redoStack.current.length > 0}
            onSetMode={handleSetMode}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClear}
            onExport={handleExport}
          />
        </div>
        <HowToPanel />
      </div>
      <StatusBar level={level} />
    </div>
  );
}

function StatusBar({ level }: { level: LevelState }) {
  let hasSpawn = false;
  if (level.spawnKey) {
    const [sx, sy] = parseKey(level.spawnKey);
    const b = level.bounds;
    hasSpawn = sx >= b.left && sx < b.right && sy >= b.top && sy < b.bottom;
  }
  return (
    <div className="h-7 shrink-0 bg-panel border-t-2 border-line flex items-center gap-4 px-3 text-sm text-muted lowercase">
      <span>
        {boundsWidth(level.bounds)} × {boundsHeight(level.bounds)}
      </span>
      <span className={level.mode === "erase" ? "text-crayon-peach" : "text-crayon-blue"}>
        {level.mode === "erase" ? "erase mode" : "paint mode"}
      </span>
      <span className={hasSpawn ? "text-crayon-mint" : "text-crayon-butter"}>
        {hasSpawn ? "✓ spawn set" : "no spawn point yet"}
      </span>
    </div>
  );
}

export default App;

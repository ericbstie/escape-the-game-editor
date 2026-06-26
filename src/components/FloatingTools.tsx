import { memo } from "react";
import type { ToolMode } from "../lib/level";

interface FloatingToolsProps {
  mode: ToolMode;
  canUndo: boolean;
  canRedo: boolean;
  onSetMode: (mode: ToolMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
}

const baseBtn =
  "px-3 py-1 rounded text-base cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed";
const iconBtn =
  "inline-flex items-center justify-center w-9 h-8 rounded cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed";

const svgProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const UndoIcon = () => (
  <svg {...svgProps}>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-4" />
  </svg>
);
const RedoIcon = () => (
  <svg {...svgProps}>
    <path d="M15 14l5-5-5-5" />
    <path d="M20 9H9a5 5 0 0 0 0 10h4" />
  </svg>
);
const TrashIcon = () => (
  <svg {...svgProps}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

function FloatingToolsImpl({
  mode,
  canUndo,
  canRedo,
  onSetMode,
  onUndo,
  onRedo,
  onClear,
  onExport,
}: FloatingToolsProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-panel border-2 border-line rounded-md px-2 py-1.5">
      <button
        onClick={() => onSetMode("paint")}
        title="Paint mode — left-drag paints, right-drag erases"
        className={`${baseBtn} ${
          mode === "paint"
            ? "bg-crayon-blue text-[#15140f]"
            : "text-muted hover:bg-panel-hi"
        }`}
      >
        paint
      </button>
      <button
        onClick={() => onSetMode("erase")}
        title="Erase mode — left-drag erases, right-click does nothing"
        className={`${baseBtn} ${
          mode === "erase"
            ? "bg-crayon-peach text-[#15140f]"
            : "text-muted hover:bg-panel-hi"
        }`}
      >
        erase
      </button>

      <div className="w-px h-6 bg-line mx-1" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className={`${iconBtn} text-ink hover:bg-panel-hi`}
      >
        <UndoIcon />
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        className={`${iconBtn} text-ink hover:bg-panel-hi`}
      >
        <RedoIcon />
      </button>
      <button
        onClick={onClear}
        title="Clear the level"
        aria-label="Clear"
        className={`${iconBtn} text-ink hover:bg-crayon-pink hover:text-[#15140f]`}
      >
        <TrashIcon />
      </button>

      <div className="w-px h-6 bg-line mx-1" />

      <button
        onClick={onExport}
        title="Export the level as a .txt file"
        className={`${baseBtn} bg-crayon-mint text-[#15140f] hover:bg-crayon-butter`}
      >
        save
      </button>
    </div>
  );
}

export const FloatingTools = memo(FloatingToolsImpl);

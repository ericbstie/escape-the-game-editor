import { memo } from "react";
import { BLOCKS, type BlockCategory, type BlockDef } from "../lib/blocks";
import { BLOCK_SPRITES } from "../lib/blockSprites";

interface BlockPaletteProps {
  selectedBlock: number;
  onSelectBlock: (id: number) => void;
}

const CATEGORY_ORDER: BlockCategory[] = [
  "Special",
  "Solid",
  "Interactive",
  "Hazard",
  "Enemy",
  "Light",
  "Decoration",
];

function BlockPaletteImpl({ selectedBlock, onSelectBlock }: BlockPaletteProps) {
  const grouped = new Map<BlockCategory, BlockDef[]>();
  for (const block of BLOCKS) {
    // Hide void (0) and the empty/background (20) — erasing handles those.
    if (block.id === 0 || block.id === 20) continue;
    const arr = grouped.get(block.category) || [];
    arr.push(block);
    grouped.set(block.category, arr);
  }

  return (
    <div
      className="shrink-0 h-full overflow-y-auto bg-panel border-r-2 border-line flex flex-col"
      style={{ width: "min(25vw, 400px)" }}
    >
      <div className="px-3 py-2.5 border-b-2 border-line sticky top-0 bg-panel z-10">
        <div className="font-block font-bold text-xl text-ink text-center capitalize">
          blocks
        </div>
      </div>

      {CATEGORY_ORDER.map(category => {
        const blocks = grouped.get(category);
        if (!blocks || blocks.length === 0) return null;
        return (
          <div key={category} className="px-3 py-2 border-b border-line/60">
            <div className="font-block text-sm font-bold uppercase tracking-wider text-muted mb-2">
              {category}
            </div>
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-1.5">
              {blocks.map(block => {
                const selected = selectedBlock === block.id;
                return (
                  <button
                    key={block.id}
                    onClick={() => onSelectBlock(block.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded cursor-pointer transition-colors ${
                      selected
                        ? "bg-crayon-blue/25 ring-2 ring-crayon-blue"
                        : "hover:bg-panel-hi"
                    }`}
                    title={`${block.name} (ID ${block.id})`}
                  >
                    {BLOCK_SPRITES[block.id] ? (
                      <img
                        src={BLOCK_SPRITES[block.id]}
                        alt=""
                        draggable={false}
                        className="w-full aspect-square rounded-sm border-2 border-black/30 object-cover [image-rendering:pixelated]"
                      />
                    ) : (
                      <span
                        className="w-full aspect-square rounded-sm border-2 border-black/30"
                        style={{ backgroundColor: block.color }}
                      />
                    )}
                    <span className="font-block text-[13px] font-semibold leading-tight text-center w-full text-ink">
                      {block.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const BlockPalette = memo(BlockPaletteImpl);

export type BlockCategory =
  | "Special"
  | "Solid"
  | "Decoration"
  | "Hazard"
  | "Enemy"
  | "Interactive"
  | "Light";

export interface BlockDef {
  id: number;
  name: string;
  color: string;
  category: BlockCategory;
  solid: boolean;
}

export const BLOCKS: BlockDef[] = [
  // Void / Empty
  { id: 0, name: "Void", color: "#000000", category: "Solid", solid: true },

  // Solid & Structure
  { id: 1, name: "Black Solid", color: "#0a0a0a", category: "Solid", solid: true },
  { id: 20, name: "Empty/Background", color: "#3a3a3a", category: "Decoration", solid: false },
  { id: 50, name: "Fake Block", color: "#5a5a5a", category: "Solid", solid: false },
  { id: 52, name: "Block", color: "#4a4a4a", category: "Solid", solid: true },
  { id: 53, name: "Walkthrough Block", color: "#6a6a6a", category: "Solid", solid: false },

  // Special
  { id: 4, name: "Spawn Point", color: "#00e0ff", category: "Special", solid: false },
  { id: 5, name: "Exit Portal", color: "#00ff66", category: "Special", solid: false },

  // Interactive Blocks
  { id: 9, name: "Grappling Hook", color: "#ff9900", category: "Interactive", solid: false },
  { id: 10, name: "Blue Ladder", color: "#0099ff", category: "Interactive", solid: false },

  // Hazards
  { id: 23, name: "Lava", color: "#ff3300", category: "Hazard", solid: false },
  { id: 24, name: "Green Poison", color: "#00cc00", category: "Hazard", solid: false },

  // Enemies
  { id: 30, name: "Enemy Small 1", color: "#8b0000", category: "Enemy", solid: false },
  { id: 36, name: "Enemy Small 2", color: "#a52a2a", category: "Enemy", solid: false },
  { id: 37, name: "Enemy Small 3", color: "#b22222", category: "Enemy", solid: false },
  { id: 38, name: "Enemy Large 1", color: "#8b4513", category: "Enemy", solid: false },
  { id: 39, name: "Enemy Large 2", color: "#a0522d", category: "Enemy", solid: false },
  { id: 43, name: "Enemy Huge 1", color: "#654321", category: "Enemy", solid: false },
  { id: 44, name: "Enemy Huge 2", color: "#704214", category: "Enemy", solid: false },

  // Weapons
  { id: 40, name: "Cube Gun", color: "#ffff00", category: "Interactive", solid: false },
  { id: 42, name: "Upgrade Block", color: "#88ff00", category: "Interactive", solid: false },

  // Lights
  { id: 11, name: "Weak Light", color: "#ffff88", category: "Light", solid: false },
  { id: 12, name: "Strong Light", color: "#ffff00", category: "Light", solid: false },
  { id: 22, name: "Glowing Green", color: "#00ff88", category: "Light", solid: false },
  { id: 49, name: "Turquoise Lamp", color: "#00ffff", category: "Light", solid: false },
  { id: 51, name: "Purple Lamp", color: "#aa00ff", category: "Light", solid: false },

  // Reflective/See-through blocks
  { id: 3, name: "Blue Reflection", color: "#1166ff", category: "Decoration", solid: false },
  { id: 6, name: "Green Reflection", color: "#11ff66", category: "Decoration", solid: false },

  // Colored blocks (various shades)
  { id: 13, name: "Red 1", color: "#cc0000", category: "Decoration", solid: true },
  { id: 14, name: "Red 2", color: "#dd0000", category: "Decoration", solid: true },
  { id: 15, name: "Purple Red 1", color: "#cc0066", category: "Decoration", solid: true },
  { id: 16, name: "Purple Red 2", color: "#dd0077", category: "Decoration", solid: true },
  { id: 17, name: "Weak Yellow", color: "#cccc44", category: "Decoration", solid: true },
  { id: 18, name: "Weak Green", color: "#44cc44", category: "Decoration", solid: true },
  { id: 19, name: "Dark Green", color: "#004400", category: "Decoration", solid: true },
  { id: 21, name: "Bright Green", color: "#00ff00", category: "Decoration", solid: true },
  { id: 25, name: "Dark Turquoise", color: "#004466", category: "Decoration", solid: true },
  { id: 26, name: "Dark Blue-Grey", color: "#336677", category: "Decoration", solid: true },
  { id: 27, name: "Blue-Grey 1", color: "#3388aa", category: "Decoration", solid: true },
  { id: 28, name: "Blue-Grey 2", color: "#44aacc", category: "Decoration", solid: true },
  { id: 29, name: "Dark Blue", color: "#000088", category: "Decoration", solid: true },
  { id: 31, name: "Dark Grey-Blue", color: "#223344", category: "Decoration", solid: true },
  { id: 32, name: "Dark Blue 1", color: "#000099", category: "Decoration", solid: true },
  { id: 33, name: "Dark Blue Purple", color: "#330088", category: "Decoration", solid: true },
  { id: 34, name: "Dark Purple", color: "#440088", category: "Decoration", solid: true },
  { id: 35, name: "Dark Grey", color: "#444444", category: "Decoration", solid: true },
  { id: 41, name: "Blue", color: "#0033ff", category: "Decoration", solid: true },
  { id: 45, name: "Grey", color: "#555555", category: "Decoration", solid: true },
  { id: 46, name: "Dark Blue-Grey 2", color: "#224466", category: "Decoration", solid: true },
  { id: 47, name: "Dark Blue 2", color: "#000077", category: "Decoration", solid: true },
  { id: 48, name: "Dark Blue 3", color: "#000066", category: "Decoration", solid: true },
  { id: 55, name: "Dark Beige", color: "#886644", category: "Decoration", solid: true },
  { id: 56, name: "Brown", color: "#664422", category: "Decoration", solid: true },
];

export const BLOCK_MAP = new Map(BLOCKS.map(b => [b.id, b]));

export function getBlock(id: number): BlockDef {
  return BLOCK_MAP.get(id) || BLOCKS[0]!;
}

// Enemies occupy more than one tile in-game. Footprint is the side length in
// tiles: small 1x1, large 3x3, huge 6x6.
const ENEMY_FOOTPRINT: Record<number, number> = {
  38: 3, 39: 3, // large
  43: 6, 44: 6, // huge
};

export function blockFootprint(id: number): number {
  return ENEMY_FOOTPRINT[id] ?? 1;
}

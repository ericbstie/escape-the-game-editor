import { test, expect } from "bun:test";
import { createEmptyLevel, serialize, cellKey } from "./level";

test("serializes header, rows with trailing comma, and footer", () => {
  const lvl = createEmptyLevel(4, 3);
  lvl.cells.set(cellKey(2, 1), 4); // spawn block at x=2,y=1
  lvl.spawnKey = cellKey(2, 1);
  lvl.cells.set(cellKey(0, 2), 1); // solid
  const out = serialize(lvl);
  const lines = out.split("\n");

  expect(lines[0]).toBe("[4,3]");
  expect(lines[1]).toBe("20,20,20,20,");
  expect(lines[3]).toBe("1,20,20,20,");
  expect(lines.length).toBe(6);
  expect(lines[4]).toBe("1");
  // spawn at x=2,y=1 => px (32,16)
  expect(lines[5]).toBe("(32,16){992-224}[1,1]");
});

test("defaults spawn coords to 0,0 when no spawn block", () => {
  const lvl = createEmptyLevel(2, 2);
  const out = serialize(lvl);
  const lines = out.split("\n");
  expect(lines[lines.length - 1]).toBe("(0,0){992-224}[1,1]");
});

test("only serializes the bounds region, offset by origin", () => {
  // A level whose bounds start at a negative origin (expanded left/up).
  const lvl = createEmptyLevel(2, 2);
  lvl.bounds = { left: -1, top: -1, right: 1, bottom: 1 };
  lvl.cells.set(cellKey(-1, -1), 13); // top-left of region
  lvl.cells.set(cellKey(0, 0), 1); // bottom-right of region
  lvl.cells.set(cellKey(5, 5), 99); // far outside bounds — must be excluded
  const out = serialize(lvl);
  const lines = out.split("\n");
  expect(lines[0]).toBe("[2,2]");
  expect(lines[1]).toBe("13,20,");
  expect(lines[2]).toBe("20,1,");
  // The far-outside block (id 99) must not appear in any grid row.
  expect(lines.slice(1, 3).join("\n")).not.toContain("99");
});

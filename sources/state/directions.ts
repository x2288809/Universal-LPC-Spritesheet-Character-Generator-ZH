import {
  ANIMATION_CONFIGS,
  DIRECTIONS,
  FRAME_SIZE,
  type DirectionKey,
} from "./constants.ts";
import type { State } from "./state.ts";
import { customAnimations } from "../custom-animations.ts";
import { get2DContext } from "../canvas/canvas-utils.ts";

export function defaultEnabledDirections(): Record<DirectionKey, boolean> {
  return Object.fromEntries(
    DIRECTIONS.map((direction) => [direction, true]),
  ) as Record<DirectionKey, boolean>;
}

export function isDirectionEnabled(state: State, direction: string): boolean {
  if ((DIRECTIONS as readonly string[]).includes(direction)) {
    return Boolean(state.enabledDirections[direction as DirectionKey]);
  }
  return true;
}

/** Enabled LPC direction names in sheet order (up, left, down, right). */
export function getEnabledDirections(state: State): string[] {
  return DIRECTIONS.filter((direction) => isDirectionEnabled(state, direction));
}

/**
 * Row indexes (0..rowCount-1) whose LPC direction is currently enabled.
 * Used by the animation preview strip.
 */
export function getPreviewDirectionIndexes(
  state: State,
  rowCount: number,
): number[] {
  const indexes: number[] = [];
  for (let i = 0; i < rowCount; i++) {
    const direction = DIRECTIONS[i];
    if (direction && isDirectionEnabled(state, direction)) {
      indexes.push(i);
    }
  }
  return indexes;
}

type DirectionStrip = { y: number; h: number };

function allDirectionsSelected(enabledDirections: readonly string[]): boolean {
  return DIRECTIONS.every((direction) => enabledDirections.includes(direction));
}

function uniqueStandardBands(): { row: number; num: number }[] {
  const seen = new Set<number>();
  const bands: { row: number; num: number }[] = [];
  const configs = Object.values(ANIMATION_CONFIGS).sort(
    (a, b) => a.row - b.row,
  );
  for (const config of configs) {
    if (seen.has(config.row)) continue;
    seen.add(config.row);
    bands.push({ row: config.row, num: config.num });
  }
  return bands;
}

const customBlocksByCanvas = new WeakMap<
  HTMLCanvasElement,
  readonly CustomDirectionBlock[]
>();

export function attachCustomDirectionBlocks(
  source: HTMLCanvasElement,
  blocks: readonly CustomDirectionBlock[],
): void {
  customBlocksByCanvas.set(source, blocks);
}

export function customDirectionBlocksFor(
  source: HTMLCanvasElement,
): readonly CustomDirectionBlock[] {
  return customBlocksByCanvas.get(source) ?? [];
}

function blitStrips(
  source: HTMLCanvasElement,
  strips: readonly DirectionStrip[],
): HTMLCanvasElement {
  const drawable = strips.filter(
    (strip) => strip.y >= 0 && strip.y + strip.h <= source.height,
  );
  const dest = document.createElement("canvas");
  dest.width = source.width;
  dest.height = Math.max(
    1,
    drawable.reduce((total, strip) => total + strip.h, 0),
  );
  const ctx = get2DContext(dest);
  let destY = 0;
  for (const strip of drawable) {
    ctx.drawImage(
      source,
      0,
      strip.y,
      source.width,
      strip.h,
      0,
      destY,
      source.width,
      strip.h,
    );
    destY += strip.h;
  }
  return dest;
}

/**
 * Drops disabled facing rows from one animation band whose rows start at y=0.
 * Returns `source` when every direction stays.
 */
export function packDirectionBand(
  source: HTMLCanvasElement,
  enabledDirections: readonly string[],
  frameSize: number,
  rowCount: number,
): HTMLCanvasElement {
  if (allDirectionsSelected(enabledDirections)) return source;
  const enabled = new Set(enabledDirections);
  const strips: DirectionStrip[] = [];
  const rows = Math.min(rowCount, DIRECTIONS.length);
  for (let i = 0; i < rows; i++) {
    if (!enabled.has(DIRECTIONS[i])) continue;
    strips.push({ y: i * frameSize, h: frameSize });
  }
  if (strips.length === rowCount) return source;
  return blitStrips(source, strips);
}

export type CustomDirectionBlock = {
  y: number;
  frameSize: number;
  rowCount: number;
};

export function customBlocksFromYPositions(
  yPositions: Record<string, number>,
): CustomDirectionBlock[] {
  const blocks: CustomDirectionBlock[] = [];
  for (const [name, y] of Object.entries(yPositions)) {
    const def = customAnimations[name];
    if (!def) continue;
    blocks.push({
      y,
      frameSize: def.frameSize,
      rowCount: def.frames.length,
    });
  }
  return blocks;
}

/**
 * Stacks only enabled direction rows of a full LPC sheet (plus custom blocks
 * drawn below the standard sheet). Returns `source` when every direction stays.
 */
export function packEnabledDirectionSheet(
  source: HTMLCanvasElement,
  enabledDirections: readonly string[],
  customBlocks: readonly CustomDirectionBlock[] = [],
): HTMLCanvasElement {
  if (allDirectionsSelected(enabledDirections)) return source;
  const enabled = new Set(enabledDirections);
  const strips: DirectionStrip[] = [];
  for (const band of uniqueStandardBands()) {
    for (let i = 0; i < band.num; i++) {
      const direction = DIRECTIONS[i];
      if (!direction || !enabled.has(direction)) continue;
      strips.push({ y: (band.row + i) * FRAME_SIZE, h: FRAME_SIZE });
    }
  }
  const blocks = customBlocks.length
    ? customBlocks
    : customDirectionBlocksFor(source);
  for (const block of blocks) {
    const rows = Math.min(DIRECTIONS.length, block.rowCount);
    for (let i = 0; i < rows; i++) {
      if (!enabled.has(DIRECTIONS[i])) continue;
      strips.push({ y: block.y + i * block.frameSize, h: block.frameSize });
    }
  }
  return blitStrips(source, strips);
}

/**
 * Clears disabled direction rows on a rendered sheet so preview and PNG/ZIP
 * export omit those facing frames without changing LPC row layout.
 */
export function clearDisabledDirectionRows(
  target: HTMLCanvasElement,
  state: State,
  customYPositions: Record<string, number> = {},
): void {
  const enabled = new Set(getEnabledDirections(state));
  if (enabled.size === DIRECTIONS.length) return;

  const ctx = get2DContext(target);
  const width = target.width;

  for (const config of Object.values(ANIMATION_CONFIGS)) {
    for (let i = 0; i < config.num; i++) {
      const direction = DIRECTIONS[i];
      if (!direction || enabled.has(direction)) continue;
      ctx.clearRect(0, (config.row + i) * FRAME_SIZE, width, FRAME_SIZE);
    }
  }

  for (const [name, yOffset] of Object.entries(customYPositions)) {
    const def = customAnimations[name];
    if (!def) continue;
    const frameSize = def.frameSize;
    const rows = Math.min(DIRECTIONS.length, def.frames.length);
    for (let i = 0; i < rows; i++) {
      const direction = DIRECTIONS[i];
      if (!direction || enabled.has(direction)) continue;
      ctx.clearRect(0, yOffset + i * frameSize, width, frameSize);
    }
  }
}

/** Expand legacy upDown/leftRight groups into per-direction flags. */
export function directionsFromLegacyGroups(
  groups: Partial<Record<"upDown" | "leftRight", boolean>> | undefined,
): Record<DirectionKey, boolean> | null {
  if (!groups) return null;
  return {
    up: Boolean(groups.upDown),
    down: Boolean(groups.upDown),
    left: Boolean(groups.leftRight),
    right: Boolean(groups.leftRight),
  };
}

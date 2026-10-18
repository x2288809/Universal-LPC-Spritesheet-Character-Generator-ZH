import { BODY_TYPES } from "./constants.ts";
import type { CatalogReader, ItemLite } from "./catalog.ts";
import {
  isItemAnimationCompatible,
  isItemLicenseCompatible,
} from "./filters.ts";
import {
  applyMatchBodyColor,
  getSelectionGroup,
  type Selection,
  type State,
} from "./state.ts";

const ALWAYS_TYPES = new Set(["body", "head", "expression"]);

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function appearanceForItem(meta: ItemLite): {
  variant: string | null;
  recolor: string | null;
  name: string;
} {
  if (meta.variants.length > 0) {
    const variant = pickRandom(meta.variants);
    return {
      variant,
      recolor: null,
      name: `${meta.name} (${variant.replaceAll("_", " ")})`,
    };
  }
  const recolorVariants = meta.recolors[0]?.variants ?? [];
  if (recolorVariants.length > 0) {
    const recolor = pickRandom(recolorVariants);
    return {
      variant: "",
      recolor,
      name: `${meta.name} (${recolor.replaceAll("_", " ")})`,
    };
  }
  return { variant: "", recolor: null, name: meta.name };
}

/**
 * Picks a random body type and random compatible gear. Core slots (body, head,
 * expression) always get an item; other types are included about half the time.
 */
export function randomizeOutfit(catalog: CatalogReader, state: State): void {
  const indexes = catalog.getMetadataIndexes().unwrapOr(null);
  if (!indexes) return;

  const bodyType = pickRandom(BODY_TYPES);
  state.bodyType = bodyType;

  const selections: Record<string, Selection> = {};
  for (const [typeName, rows] of Object.entries(indexes.byTypeName)) {
    const candidates: { itemId: string; meta: ItemLite }[] = [];
    for (const row of rows) {
      const meta = catalog.getItemLite(row.itemId).unwrapOr(null);
      if (!meta) continue;
      if (!meta.required.includes(bodyType)) continue;
      if (!isItemLicenseCompatible(catalog, state, row.itemId)) continue;
      if (!isItemAnimationCompatible(catalog, state, row.itemId)) continue;
      candidates.push({ itemId: row.itemId, meta });
    }
    if (candidates.length === 0) continue;
    if (!ALWAYS_TYPES.has(typeName) && Math.random() >= 0.45) continue;

    const pick = pickRandom(candidates);
    const look = appearanceForItem(pick.meta);
    selections[getSelectionGroup(pick.itemId)] = {
      itemId: pick.itemId,
      variant: look.variant,
      recolor: look.recolor,
      name: look.name,
    };
  }

  state.selections = selections;

  const body = Object.values(state.selections).find((selection) => {
    const meta = catalog.getItemLite(selection.itemId).unwrapOr(null);
    return meta?.type_name === "body";
  });
  if (body) {
    applyMatchBodyColor(state, body.variant ?? null, body.recolor ?? null);
  }
}

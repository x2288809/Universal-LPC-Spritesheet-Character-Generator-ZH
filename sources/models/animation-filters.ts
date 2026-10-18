import { ANIMATIONS, DIRECTIONS } from "../state/constants.ts";
import type { DirectionKey } from "../state/constants.ts";
import type { CatalogReader } from "../state/catalog.ts";
import { isItemAnimationCompatible } from "../state/filters.ts";
import type { State } from "../state/state.ts";
import { animationLabel, t } from "../i18n/locale.ts";
import type { MessageKey } from "../i18n/messages.ts";

export type AnimationFilterOptionModel = {
  readonly value: string;
  readonly label: string;
  readonly enabled: boolean;
  setEnabled(enabled: boolean): void;
};

export type DirectionFilterOptionModel = {
  readonly key: DirectionKey;
  readonly label: string;
  readonly enabled: boolean;
  setEnabled(enabled: boolean): void;
};

export type AnimationFiltersModel = {
  readonly liteReady: boolean;
  readonly summary: string;
  readonly directionOptions: readonly DirectionFilterOptionModel[];
  readonly options: readonly AnimationFilterOptionModel[];
  readonly incompatibleCount: number;
  removeIncompatible(): number;
};

const DIRECTION_LABEL_KEYS = {
  up: "direction.up",
  left: "direction.left",
  down: "direction.down",
  right: "direction.right",
} as const satisfies Record<DirectionKey, MessageKey>;

function incompatibleSelectionKeys(
  catalog: CatalogReader,
  state: State,
): string[] {
  return Object.entries(state.selections)
    .filter(
      ([, selection]) =>
        !isItemAnimationCompatible(catalog, state, selection.itemId),
    )
    .map(([key]) => key);
}

export const animationFiltersModelFactory = {
  create(catalog: CatalogReader, state: State): AnimationFiltersModel {
    const enabledCount = Object.values(state.enabledAnimations).filter(
      Boolean,
    ).length;
    const incompatibleCount = incompatibleSelectionKeys(catalog, state).length;

    return {
      liteReady: catalog.isLiteReady(),
      summary:
        enabledCount > 0
          ? t("filters.animationSummary", {
              enabled: enabledCount,
              total: ANIMATIONS.length,
            })
          : t("filters.all"),
      directionOptions: DIRECTIONS.map((direction) => ({
        key: direction,
        label: t(DIRECTION_LABEL_KEYS[direction]),
        enabled: Boolean(state.enabledDirections[direction]),
        setEnabled(enabled) {
          state.enabledDirections[direction] = enabled;
        },
      })),
      options: ANIMATIONS.map((animation) => ({
        value: animation.value,
        label: animationLabel(animation.value, animation.label),
        enabled: Boolean(state.enabledAnimations[animation.value]),
        setEnabled(enabled) {
          state.enabledAnimations[animation.value] = enabled;
        },
      })),
      incompatibleCount,
      removeIncompatible() {
        const keys = incompatibleSelectionKeys(catalog, state);
        for (const key of keys) delete state.selections[key];
        return keys.length;
      },
    };
  },
};

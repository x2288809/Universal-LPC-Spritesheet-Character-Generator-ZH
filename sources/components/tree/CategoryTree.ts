import m from "mithril";
import type { CategoryTreeModel } from "../../models/category-tree.ts";
import { BodyTypeSelector } from "./BodyTypeSelector.ts";
import { TreeNode } from "./TreeNode.ts";
import { t } from "../../i18n/locale.ts";

function renderLoadingHost() {
  return m("div.box.has-background-light.category-tree-panel", [
    m("div.category-tree-loading-host", [
      m(
        "div.category-tree-loading-overlay",
        { "aria-busy": "true", "aria-live": "polite" },
        m("span.loading", { "aria-label": t("loading.categoryAria") }),
      ),
      m("h3.title.is-5.mb-3", t("items.title")),
      m("p.has-text-grey.is-size-7", t("loading.category")),
    ]),
  ]);
}

export const CategoryTree: m.Component<{
  createModel: () => CategoryTreeModel;
}> = {
  view(vnode) {
    const model = vnode.attrs.createModel();
    if (model.isLoading) return renderLoadingHost();

    return m("div.box.has-background-light.category-tree-panel", [
      m(
        "div.is-flex.is-justify-content-space-between.is-align-items-center.mb-3",
        [
          m("h3.title.is-5.mb-0", t("items.title")),
          m("div.buttons.mb-0", [
            m(
              "button.button.is-danger.is-small",
              { onclick: model.reset },
              t("items.reset"),
            ),
            m(
              "button.button.is-small",
              { onclick: model.collapseAll },
              t("items.collapse"),
            ),
            m(
              "button.button.is-small",
              {
                disabled: !model.liteReady,
                title: model.liteReady ? undefined : t("loading.itemList"),
                onclick: model.expandSelected,
              },
              t("items.expand"),
            ),
            m(
              "button.button.is-small",
              {
                class: model.compactDisplay ? "is-link" : "",
                onclick: model.toggleCompactDisplay,
              },
              t("items.compact"),
            ),
            m(
              "button.button.is-small.is-primary",
              {
                disabled: !model.liteReady,
                title: model.liteReady ? undefined : t("loading.itemList"),
                onclick: model.randomizeOutfit,
              },
              t("items.random"),
            ),
          ]),
        ],
      ),
      m("div.mb-3", [
        m(
          "label.checkbox",
          {
            title: t("items.matchTitle"),
          },
          [
            m("input[type=checkbox]", {
              id: "match-body-color-checkbox",
              "aria-describedby": "match-body-color-label",
              checked: model.matchBodyColorEnabled,
              onchange: (event: Event) => {
                model.setMatchBodyColor(
                  (event.target as HTMLInputElement).checked,
                );
              },
            }),
            t("items.match"),
          ],
        ),
        m(
          "p.is-size-7.has-text-grey.mt-1.ml-4",
          { id: "match-body-color-label" },
          t("items.matchHelp"),
        ),
      ]),
      m("div", [
        m(BodyTypeSelector, { model: model.bodyTypes }),
        model.roots.map((root) =>
          m(TreeNode, {
            key: root.key,
            createModel: root.createModel,
          }),
        ),
      ]),
    ]);
  },
};

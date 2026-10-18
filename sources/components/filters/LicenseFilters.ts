// License Filters component
import m from "mithril";
import type { LicenseFiltersModel } from "../../models/license-filters.ts";
import { countPhrase, t } from "../../i18n/locale.ts";

type LicenseFiltersState = { isExpanded: boolean };

export const LicenseFilters: m.Component<
  { createModel: () => LicenseFiltersModel },
  LicenseFiltersState
> = {
  oninit(vnode) {
    vnode.state.isExpanded = false;
  },
  view(vnode) {
    const model = vnode.attrs.createModel();

    const removeIncompatibleItems = () => {
      const removedCount = model.removeIncompatible();
      if (removedCount > 0) {
        alert(t("incompatible.removed", { count: removedCount }));
      } else {
        alert(t("incompatible.none"));
      }
    };

    const hasIncompatibleItems = model.incompatibleCount > 0;

    return m("div.box.mb-4.has-background-light", [
      m(
        "div.tree-label",
        {
          onclick: () => {
            vnode.state.isExpanded = !vnode.state.isExpanded;
          },
        },
        [
          m("span.tree-arrow", {
            class: vnode.state.isExpanded ? "expanded" : "collapsed",
          }),
          m("span.title.is-6.is-inline", t("license.title")),
          m("span.is-size-7.has-text-grey.ml-2", model.summary),
        ],
      ),
      vnode.state.isExpanded
        ? m("div.content.mt-3", [
            !model.liteReady
              ? m("p.is-size-7.has-text-grey.mb-3", t("loading.itemList"))
              : null,
            !model.creditsReady
              ? m("p.is-size-7.has-text-grey.mb-3", t("loading.licenses"))
              : null,
            m(
              "ul.tree-list",
              model.options.map((license) =>
                m("li", { key: license.key, class: "mb-2" }, [
                  m("label.checkbox", [
                    m("input[type=checkbox]", {
                      checked: license.enabled,
                      disabled: !model.liteReady,
                      onchange: (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        license.setEnabled(target.checked);
                      },
                    }),
                    ` ${license.label} `,
                    m(
                      "a.is-size-7",
                      {
                        href: license.url,
                        target: "_blank",
                        rel: "noopener noreferrer",
                      },
                      license.urlLabel
                        ? t("showLicenseVersion", { version: license.urlLabel })
                        : t("showLicense"),
                    ),
                  ]),
                ]),
              ),
            ),
            hasIncompatibleItems
              ? [
                  m("div.notification.is-warning.is-light.p-3.mt-2", [
                    m("p.is-size-7", [
                      m(
                        "strong",
                        countPhrase(
                          model.incompatibleCount,
                          "incompatible.one",
                          "incompatible.many",
                        ),
                      ),
                      t("incompatible.withLicense"),
                      m("span.has-text-grey", t("incompatible.marked")),
                    ]),
                  ]),
                  m(
                    "button.button.is-small.is-warning.mt-2",
                    {
                      onclick: removeIncompatibleItems,
                      title: countPhrase(
                        model.incompatibleCount,
                        "incompatible.removeTitleOne",
                        "incompatible.removeTitleMany",
                      ),
                    },
                    countPhrase(
                      model.incompatibleCount,
                      "incompatible.removeOne",
                      "incompatible.removeMany",
                    ),
                  ),
                ]
              : null,
          ])
        : null,
    ]);
  },
};

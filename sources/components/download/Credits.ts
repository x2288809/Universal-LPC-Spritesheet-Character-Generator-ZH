import m from "mithril";
import type { CreditsModel } from "../../models/credits.ts";
import { t } from "../../i18n/locale.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";

const CreditsContent: m.Component<{
  createModel: () => CreditsModel;
}> = {
  view(vnode) {
    const model = vnode.attrs.createModel();
    if (model.kind === "loading") {
      return m(
        "div.loading-shell-credits",
        m("p.has-text-grey", t("loading.selections")),
      );
    }
    if (model.kind === "empty") {
      return m("p.has-text-grey", t("credits.empty"));
    }

    return [
      m(
        "div.content.has-background-light.p-3",
        model.credits.map((credit) =>
          m("div.mb-3", { key: credit.key }, [
            m("strong.is-size-6", credit.fileName),
            credit.notes ? m("p.is-size-7", credit.notes) : null,
            m("p.is-size-7", [
              m("strong", t("credits.licenses")),
              credit.licenses.join(", "),
            ]),
            m("p.is-size-7", [
              m("strong", t("credits.authors")),
              credit.authors.join(", "),
            ]),
          ]),
        ),
      ),
      m("div.buttons.mt-3", [
        m(
          "button.button.is-small",
          { onclick: model.downloadTxt },
          t("credits.downloadTxt"),
        ),
        m(
          "button.button.is-small",
          { onclick: model.downloadCsv },
          t("credits.downloadCsv"),
        ),
      ]),
    ];
  },
};

export const Credits: m.Component<{
  createModel: () => CreditsModel;
}> = {
  view(vnode) {
    return m(
      CollapsibleSection,
      {
        title: t("credits.title"),
        defaultOpen: true,
        boxClass: "box",
        id: "credits-section",
      },
      [
        m("p.is-size-7.mb-2", [
          t("credits.must"),
          m(
            "a",
            {
              href: "https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/blob/master/README.md",
              target: "_blank",
            },
            t("credits.instructions"),
          ),
        ]),
        m("p.is-size-7.mb-3", [
          t("credits.all"),
          m(
            "a",
            {
              href: "https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator/raw/refs/heads/master/CREDITS.csv",
              target: "_blank",
            },
            t("credits.here"),
          ),
        ]),
        m(CreditsContent, { createModel: vnode.attrs.createModel }),
      ],
    );
  },
};

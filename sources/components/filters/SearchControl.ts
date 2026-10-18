// Search control component
import m from "mithril";
import type { SearchControlModel } from "../../models/search-control.ts";
import { t } from "../../i18n/locale.ts";

export const SearchControl: m.Component<{
  createModel: () => SearchControlModel;
}> = {
  view(vnode) {
    const model = vnode.attrs.createModel();
    return m("div.field", [
      m("label.label", t("search.label")),
      m("input.input[type=search]", {
        placeholder: t("search.placeholder"),
        value: model.value,
        disabled: model.disabled,
        title: model.title,
        oninput: (e: Event) => {
          model.setValue((e.target as HTMLInputElement).value);
        },
      }),
    ]);
  },
};

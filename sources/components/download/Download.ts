import m from "mithril";
import type {
  ClipboardCommandResult,
  DownloadModel,
} from "../../models/download.ts";
import { t } from "../../i18n/locale.ts";
import { CollapsibleSection } from "../CollapsibleSection.ts";

function reportClipboardResult(
  result: ClipboardCommandResult,
  successMessage: string,
  errorLogMessage: string,
  failureMessage: string,
): void {
  if (result.kind === "success") {
    alert(successMessage);
  } else if (result.kind === "failure") {
    console.error(errorLogMessage, result.error);
    alert(failureMessage);
  }
}

const DownloadContent: m.Component<{
  createModel: () => DownloadModel;
}> = {
  view(vnode) {
    const model = vnode.attrs.createModel();
    return m(
      "div.buttons.is-flex.is-flex-wrap-wrap",
      { id: "download-buttons" },
      [
        m(
          "button.button.is-small.is-primary",
          { onclick: model.saveSpritesheet },
          t("download.png"),
        ),
        m(
          "button.button.is-small",
          { onclick: model.downloadCreditsTxt },
          t("download.creditsTxt"),
        ),
        m(
          "button.button.is-small",
          { onclick: model.downloadCreditsCsv },
          t("download.creditsCsv"),
        ),
        m(
          "button.button.is-small.is-info",
          {
            disabled: model.zipDisabled,
            title: model.zipTitle,
            onclick: model.exportZipByAnimation,
          },
          t("download.zipAnimation"),
        ),
        model.zipByAnimationRunning ? m("span.loading") : null,
        m(
          "button.button.is-small.is-info",
          {
            disabled: model.zipDisabled,
            title: model.zipTitle,
            onclick: model.exportZipByItem,
          },
          t("download.zipItem"),
        ),
        model.zipByItemRunning ? m("span.loading") : null,
        m(
          "button.button.is-small.is-info",
          {
            disabled: model.zipDisabled,
            title: model.zipTitle,
            onclick: model.exportZipByAnimationAndItem,
          },
          t("download.zipAnimationItem"),
        ),
        model.zipByAnimationAndItemRunning ? m("span.loading") : null,
        m(
          "button.button.is-small.is-info",
          {
            disabled: model.zipDisabled,
            title: model.zipTitle,
            onclick: model.exportZipByAnimationAndFrame,
          },
          t("download.zipFrames"),
        ),
        model.zipIndividualFramesRunning ? m("span.loading") : null,
        m(
          "button.button.is-small.is-link",
          {
            onclick: async () =>
              reportClipboardResult(
                await model.exportJsonToClipboard(),
                t("download.exported"),
                t("download.exportFailedLog"),
                t("download.exportFailed"),
              ),
          },
          t("download.exportClipboard"),
        ),
        m(
          "button.button.is-small.is-link",
          {
            onclick: async () =>
              reportClipboardResult(
                await model.importJsonFromClipboard(),
                t("download.imported"),
                t("download.importFailedLog"),
                t("download.importFailed"),
              ),
          },
          t("download.importClipboard"),
        ),
      ],
    );
  },
};

export const Download: m.Component<{
  createModel: () => DownloadModel;
}> = {
  view(vnode) {
    return m(
      CollapsibleSection,
      { title: t("download.title"), defaultOpen: true },
      m(DownloadContent, { createModel: vnode.attrs.createModel }),
    );
  },
};

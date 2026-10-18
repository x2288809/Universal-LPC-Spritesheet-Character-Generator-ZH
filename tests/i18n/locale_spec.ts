import { expect } from "chai";
import sinon from "sinon";
import { afterEach, describe, it } from "mocha-globals";
import { formatItemTooltip } from "../../sources/i18n/item-tooltip.ts";
import {
  animationLabel,
  bodyTypeLabel,
  categoryLabel,
  countPhrase,
  getLocale,
  installLanguageToggle,
  itemLabel,
  paletteOptionLabel,
  readStoredLocale,
  setLocale,
  t,
  variantLabel,
} from "../../sources/i18n/locale.ts";

function expectEqual(actual: unknown, expected: unknown): void {
  expect(actual).to.equal(expected);
}

function expectInclude(actual: string, expected: string): void {
  expect(actual).to.include(expected);
}

describe("locale", function () {
  afterEach(function () {
    document.getElementById("language-toggle-spec")?.remove();
    setLocale("en");
  });

  it("translates the active locale and leaves unknown placeholders", function () {
    setLocale("zh");
    expectEqual(getLocale(), "zh");
    expectEqual(t("download.title"), "下载");
    expectEqual(t("preview.zoom", { percent: 150 }), "缩放：150%");
    expectEqual(t("export.failed", {}), "导出失败：{message}");
    expectEqual(animationLabel("walk", "Walk"), "行走");
    expectEqual(animationLabel("wheelchair", "Wheelchair"), "Wheelchair");
    expectEqual(bodyTypeLabel("female", "Female"), "女性");
    expectEqual(bodyTypeLabel("dragon", "Dragon"), "Dragon");
    expectEqual(
      countPhrase(1, "incompatible.one", "incompatible.many"),
      "有 1 个已选物品不兼容",
    );
    expectEqual(
      countPhrase(2, "incompatible.removeOne", "incompatible.removeMany"),
      "移除 2 个不兼容素材",
    );

    setLocale("en");
    expectEqual(t("download.title"), "Download");
    expectEqual(t("preview.zoom", { percent: 80 }), "Zoom: 80%");
    expectEqual(animationLabel("combat", "Combat Idle"), "Combat Idle");
    expectEqual(bodyTypeLabel("male", "Male"), "Male");
  });

  it("translates catalog category, item, and variant labels", function () {
    setLocale("zh");
    expectEqual(
      categoryLabel("head/heads/human", "human", "Human Heads"),
      "人类头型",
    );
    expectEqual(
      categoryLabel("feet/accessory", "accessory", "Shoe / Boots Accessory"),
      "鞋靴配件",
    );
    expectEqual(itemLabel("heads_human_male", "Human Male"), "人类男性");
    expectEqual(itemLabel("arms_armour", "Armour"), "盔甲");
    expectEqual(variantLabel("all.lpcr.blue", "All.lpcr.blue"), "蓝色");
    expectEqual(paletteOptionLabel("Eye Color"), "眼睛颜色");
    expectEqual(itemLabel("missing_item", "Fallback"), "Fallback");

    setLocale("en");
    expectEqual(
      categoryLabel("head/heads/human", "human", "Human Heads"),
      "Human Heads",
    );
    expectEqual(itemLabel("heads_human_male", "Human Male"), "Human Male");
    expectEqual(variantLabel("all.lpcr.blue", "Blue"), "Blue");
    expectEqual(paletteOptionLabel("Eye Color"), "Eye Color");
  });

  it("formats item tooltips in both languages", function () {
    setLocale("en");
    expectEqual(
      formatItemTooltip({
        creditsReady: false,
        licenses: [],
        animations: ["walk"],
        licenseCompatible: false,
        animationCompatible: false,
      }),
      "⚠️ Incompatible with selected licenses and animations\nLicense info loading…\nAnimations: Walk",
    );
    expectEqual(
      formatItemTooltip({
        creditsReady: true,
        licenses: [],
        animations: [],
        licenseCompatible: true,
        animationCompatible: true,
      }),
      "No license info\nNo animation info",
    );

    setLocale("zh");
    expectInclude(
      formatItemTooltip({
        creditsReady: true,
        licenses: ["CC0"],
        animations: ["idle"],
        licenseCompatible: true,
        animationCompatible: true,
      }),
      "许可：CC0",
    );
  });

  it("reads stored locales and ignores storage failures", function () {
    localStorage.removeItem("lpc-locale");
    expectEqual(readStoredLocale(), null);
    localStorage.setItem("lpc-locale", "zh");
    expectEqual(readStoredLocale(), "zh");
    localStorage.setItem("lpc-locale", "fr");
    expectEqual(readStoredLocale(), null);

    const getItem = sinon.stub(localStorage, "getItem").throws(new Error("no"));
    try {
      expectEqual(readStoredLocale(), null);
    } finally {
      getItem.restore();
    }

    const setItem = sinon.stub(localStorage, "setItem").throws(new Error("no"));
    try {
      setLocale("zh");
      expectEqual(getLocale(), "zh");
    } finally {
      setItem.restore();
    }
  });

  it("updates static copy and switches from the header control", function () {
    const host = document.createElement("div");
    host.id = "language-toggle-spec";
    host.innerHTML = [
      '<span data-i18n="download.title">下载</span>',
      '<span data-i18n="missing-key">keep</span>',
      '<span data-i18n-aria="shell.loadingFilters"></span>',
      '<img data-i18n-alt="header.githubAlt" alt="">',
      '<img data-i18n-alt="missing-alt" alt="stay">',
      '<div id="language-toggle" role="group">',
      '<button type="button" data-locale="zh">中文</button>',
      '<button type="button" data-locale="en">EN</button>',
      '<button type="button" data-locale="fr">FR</button>',
      "</div>",
    ].join("");
    installLanguageToggle();
    document.body.appendChild(host);
    installLanguageToggle();
    const missing = host.querySelector("[data-i18n=missing-key]");
    expectEqual(missing?.textContent, "keep");

    const zh = host.querySelector(
      "[data-locale=zh]",
    ) as HTMLButtonElement | null;
    const en = host.querySelector(
      "[data-locale=en]",
    ) as HTMLButtonElement | null;
    const fr = host.querySelector(
      "[data-locale=fr]",
    ) as HTMLButtonElement | null;
    expect(zh).to.not.equal(null);
    expect(en).to.not.equal(null);
    expect(fr).to.not.equal(null);

    document.getElementById("language-toggle")?.click();
    fr?.click();
    expectEqual(getLocale(), "en");

    zh?.click();
    expectEqual(document.documentElement.lang, "zh-CN");
    expectEqual(document.title, "通用 LPC 精灵图表生成器");
    expectEqual(
      host.querySelector("[data-i18n='download.title']")?.textContent,
      "下载",
    );
    expectEqual(
      host
        .querySelector("[data-i18n-aria='shell.loadingFilters']")
        ?.getAttribute("aria-label"),
      "正在加载筛选",
    );
    expectEqual(
      host
        .querySelector("[data-i18n-alt='header.githubAlt']")
        ?.getAttribute("alt"),
      "在 GitHub 上查看",
    );
    expectEqual(
      host.querySelector("[data-i18n-alt='missing-alt']")?.getAttribute("alt"),
      "stay",
    );
    expectEqual(zh?.getAttribute("aria-pressed"), "true");
    expectEqual(en?.getAttribute("aria-pressed"), "false");

    en?.click();
    expectEqual(document.documentElement.lang, "en");
    expectEqual(
      host.querySelector("[data-i18n='download.title']")?.textContent,
      "Download",
    );
    expectEqual(en?.classList.contains("is-active"), true);
  });
});

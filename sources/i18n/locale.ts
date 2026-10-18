import m from "mithril";
import {
  categoryZhByKey,
  categoryZhByPath,
  itemZhById,
  paletteLabelZh,
  variantZhById,
} from "./catalog-zh.ts";
import {
  animationMessageKey,
  bodyMessageKey,
  isMessageKey,
  messages,
  type MessageKey,
} from "./messages.ts";

export type Locale = "zh" | "en";

const STORAGE_KEY = "lpc-locale";

export function readStoredLocale(): Locale | null {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (value === "zh" || value === "en") return value;
  } catch {
    return null;
  }
  return null;
}

let locale: Locale = readStoredLocale() ?? "zh";
let toggleInstalled = false;

export function getLocale(): Locale {
  return locale;
}

export function t(
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = messages[locale][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function animationLabel(value: string, fallback: string): string {
  const key = animationMessageKey(value);
  return key ? t(key) : fallback;
}

export function bodyTypeLabel(value: string, fallback: string): string {
  const key = bodyMessageKey(value);
  return key ? t(key) : fallback;
}

/** Category folder display; `path` uses `/` (e.g. head/heads/human). */
export function categoryLabel(
  path: string,
  key: string,
  fallback: string,
): string {
  if (locale === "en") return fallback;
  return categoryZhByPath[path] ?? categoryZhByKey[key] ?? fallback;
}

export function itemLabel(itemId: string, fallback: string): string {
  if (locale === "en") return fallback;
  return itemZhById[itemId] ?? fallback;
}

export function variantLabel(variantId: string, fallback: string): string {
  if (locale === "en") return fallback;
  return variantZhById[variantId] ?? fallback;
}

export function paletteOptionLabel(
  label: string | undefined,
  fallback = "",
): string {
  if (!label) return fallback;
  if (locale === "en") return label;
  return paletteLabelZh[label] ?? label;
}

export function countPhrase(
  count: number,
  one: MessageKey,
  many: MessageKey,
): string {
  return t(count > 1 ? many : one, { count });
}

function applyKeyedAttribute(
  selector: string,
  attribute: "aria-label" | "alt",
): void {
  for (const node of document.querySelectorAll(selector)) {
    if (!(node instanceof Element)) continue;
    const key = node.getAttribute(
      attribute === "alt" ? "data-i18n-alt" : "data-i18n-aria",
    );
    if (!key || !isMessageKey(key)) continue;
    node.setAttribute(attribute, t(key));
  }
}

function syncLanguageToggle(): void {
  const root = document.getElementById("language-toggle");
  if (!root) return;
  root.setAttribute("aria-label", t("language.group"));
  for (const button of root.querySelectorAll("[data-locale]")) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const active = button.getAttribute("data-locale") === locale;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  }
}

export function applyStaticCopy(): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.title = t("meta.title");
  for (const node of document.querySelectorAll("[data-i18n]")) {
    const key = node.getAttribute("data-i18n");
    if (!key || !isMessageKey(key)) continue;
    node.textContent = t(key);
  }
  applyKeyedAttribute("[data-i18n-aria]", "aria-label");
  applyKeyedAttribute("[data-i18n-alt]", "alt");
  syncLanguageToggle();
}

export function setLocale(next: Locale): void {
  locale = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    /* Private mode or a full quota should still switch the visible language. */
  }
  applyStaticCopy();
  m.redraw();
}

export function installLanguageToggle(): void {
  applyStaticCopy();
  if (toggleInstalled || typeof document === "undefined") return;
  const root = document.getElementById("language-toggle");
  if (!root) return;
  toggleInstalled = true;
  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest("[data-locale]");
    if (!(button instanceof HTMLButtonElement)) return;
    const next = button.getAttribute("data-locale");
    if (next === "zh" || next === "en") setLocale(next);
  });
}

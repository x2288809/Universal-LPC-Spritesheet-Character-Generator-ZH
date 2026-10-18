import "chai";
import "../sources/vendor-globals.ts";
import { setLocale } from "../sources/i18n/locale.ts";

setLocale("en");

window.__TEST_DEBUG_LOCKED__ = true;
window.DEBUG = import.meta.env.VITEST_DEBUG === "true";

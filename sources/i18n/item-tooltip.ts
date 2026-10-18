import { animationLabel, t } from "./locale.ts";

export function formatItemTooltip(options: {
  creditsReady: boolean;
  licenses: readonly string[];
  animations: readonly string[];
  licenseCompatible: boolean;
  animationCompatible: boolean;
}): string {
  const licensesText = !options.creditsReady
    ? t("tooltip.licenseLoading")
    : options.licenses.length > 0
      ? t("tooltip.licenses", { list: options.licenses.join(", ") })
      : t("tooltip.noLicense");
  const animationList = options.animations
    .map((anim) => animationLabel(anim, anim))
    .join(", ");
  const animationsText =
    options.animations.length > 0
      ? t("tooltip.animations", { list: animationList })
      : t("tooltip.noAnimation");
  const issues = [
    options.licenseCompatible ? null : t("tooltip.licensesWord"),
    options.animationCompatible ? null : t("tooltip.animationsWord"),
  ].filter((issue): issue is string => issue !== null);
  const warning =
    issues.length > 0
      ? `${t("tooltip.incompatible", { issues: issues.join(t("tooltip.and")) })}\n`
      : "";
  return `${warning}${licensesText}\n${animationsText}`;
}

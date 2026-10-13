export type LegacyEmailLoginMode = "transition" | "exceptions" | "off";

const MODES: LegacyEmailLoginMode[] = ["transition", "exceptions", "off"];

// "existing" members (allowed to keep the magic link during the transition) are
// the ones whose fiche was created before this date.
const parseDate = (value: string | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

export const getLegacyEmailLoginConfig = () => {
  const rawMode = process.env.LEGACY_EMAIL_LOGIN_MODE;
  const mode: LegacyEmailLoginMode = MODES.includes(
    rawMode as LegacyEmailLoginMode,
  )
    ? (rawMode as LegacyEmailLoginMode)
    : "off";
  const cutoffDate = parseDate(process.env.LEGACY_EMAIL_LOGIN_CUTOFF_DATE);
  const endDate = parseDate(process.env.LEGACY_EMAIL_LOGIN_END_DATE);
  if (mode === "transition" && !cutoffDate) {
    console.error(
      "LEGACY_EMAIL_LOGIN_MODE=transition requires LEGACY_EMAIL_LOGIN_CUTOFF_DATE: email login disabled",
    );
    return { mode: "off" as const, cutoffDate, endDate };
  }
  return { mode, cutoffDate, endDate };
};

export const isLegacyEmailLoginEnabled = () =>
  getLegacyEmailLoginConfig().mode !== "off";

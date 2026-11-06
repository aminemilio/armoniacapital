/** Cookie and storage consent. Used by the banner now, and by any analytics or ad script added later. */
export type Consent = "all" | "essential";
const KEY = "armonia-consent";

export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "all" || v === "essential" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: Consent): void {
  try {
    window.localStorage.setItem(KEY, value);
    window.dispatchEvent(new Event("armonia-consent"));
  } catch {
    /* storage blocked: the banner will simply show again */
  }
}

/** Load analytics or advertising scripts only when this returns true. */
export function allowsOptional(): boolean {
  return getConsent() === "all";
}

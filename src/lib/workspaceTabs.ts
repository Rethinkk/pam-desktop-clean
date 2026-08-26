export type PamWorkspaceTab =
  | "dashboard"
  | "assets"
  | "asset-register"
  | "docs"
  | "doc-register"
  | "people"
  | "consents"
  | "audit"
  | "reporting"
  | "about"
  | "security";

export const PAM_ACTIVE_TAB_STORAGE_KEY = "pam-active-tab";

export const PAM_ALLOWED_TABS: PamWorkspaceTab[] = [
  "dashboard",
  "assets",
  "asset-register",
  "docs",
  "doc-register",
  "people",
  "consents",
  "audit",
  "reporting",
  "about",
  "security",
];

export function openPamTab(tab: PamWorkspaceTab) {
  try {
    localStorage.setItem(PAM_ACTIVE_TAB_STORAGE_KEY, tab);
  } catch {}

  window.dispatchEvent(
    new CustomEvent("pam:set-tab", {
      detail: { tab },
    }),
  );
}

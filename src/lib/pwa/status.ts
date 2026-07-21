export type ConnectivityState = "online" | "offline" | "reconnecting";

export function connectivityAfterEvent(
  current: ConnectivityState,
  event: "online" | "offline" | "sync-complete" | "sync-failed",
): ConnectivityState {
  if (event === "offline" || event === "sync-failed") return "offline";
  if (event === "online") return current === "online" ? "online" : "reconnecting";
  return "online";
}

export function formatSyncAge(
  timestamp: number | null,
  now = Date.now(),
): string {
  if (!timestamp || !Number.isFinite(timestamp)) return "Not synced yet";

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 45) return "Updated just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

interface InstallContext {
  standalone: boolean;
  installPromptAvailable: boolean;
  ios: boolean;
  serviceWorkerSupported: boolean;
}

export type InstallExperience =
  | "installed"
  | "prompt"
  | "ios-instructions"
  | "unsupported";

export function getInstallExperience({
  standalone,
  installPromptAvailable,
  ios,
  serviceWorkerSupported,
}: InstallContext): InstallExperience {
  if (standalone) return "installed";
  if (installPromptAvailable) return "prompt";
  if (ios && serviceWorkerSupported) return "ios-instructions";
  return "unsupported";
}

export function shouldUseDocumentNavigation(
  href: string,
  currentOrigin: string,
  offline: boolean,
): boolean {
  if (!offline) return false;
  const url = new URL(href, currentOrigin);
  return url.origin === currentOrigin && url.protocol.startsWith("http");
}

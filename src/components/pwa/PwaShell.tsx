"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { registerBeastServiceWorker } from "@/lib/pwa/registration";
import {
  connectivityAfterEvent,
  formatSyncAge,
  getInstallExperience,
  shouldUseDocumentNavigation,
  type ConnectivityState,
} from "@/lib/pwa/status";

const LAST_SYNC_KEY = "beast-travel:last-sync";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function readLastSync(): number | null {
  try {
    const value = Number(window.localStorage.getItem(LAST_SYNC_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function storeLastSync(value: number) {
  try {
    window.localStorage.setItem(LAST_SYNC_KEY, String(value));
  } catch {
    // Cache availability does not depend on localStorage availability.
  }
}

export default function PwaShell() {
  const router = useRouter();
  const [connectivity, setConnectivity] = useState<ConnectivityState>("online");
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [clock, setClock] = useState(() => Date.now());
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [serviceWorkerSupported, setServiceWorkerSupported] = useState(false);

  const requestSync = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    (registration.active ?? navigator.serviceWorker.controller)?.postMessage({
      type: "BEAST_SYNC_TRAVEL_DATA",
    });
  }, []);

  useEffect(() => {
    const initializeTimer = window.setTimeout(() => {
      setConnectivity(navigator.onLine ? "online" : "offline");
      setLastSync(readLastSync());
      setStandalone(isStandalone());
      setIos(isIosDevice());
      setServiceWorkerSupported("serviceWorker" in navigator);
    }, 0);

    const online = () => {
      setConnectivity((current) => connectivityAfterEvent(current, "online"));
      void requestSync();
    };
    const offline = () => {
      setConnectivity((current) => connectivityAfterEvent(current, "offline"));
    };
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const installed = () => {
      setStandalone(true);
      setInstallPrompt(null);
    };
    const serviceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "BEAST_SYNC_COMPLETE") {
        const updatedAt = Number(event.data.updatedAt) || Date.now();
        storeLastSync(updatedAt);
        setLastSync(updatedAt);
        setClock(Date.now());
        setConnectivity((current) => connectivityAfterEvent(current, "sync-complete"));
        router.refresh();
      } else if (event.data?.type === "BEAST_SYNC_FAILED") {
        setConnectivity((current) => connectivityAfterEvent(current, "sync-failed"));
      }
    };

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    navigator.serviceWorker?.addEventListener("message", serviceWorkerMessage);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void registerBeastServiceWorker(navigator.serviceWorker)
        .then(() => {
          if (navigator.onLine) void requestSync();
        })
        .catch(() => {
          if (!navigator.onLine) setConnectivity("offline");
        });
    }

    return () => {
      window.clearTimeout(initializeTimer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
      navigator.serviceWorker?.removeEventListener("message", serviceWorkerMessage);
    };
  }, [requestSync, router]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const interceptOfflineLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (!shouldUseDocumentNavigation(anchor.href, window.location.origin, connectivity !== "online")) return;
      const next = new URL(anchor.href);
      if (next.pathname === window.location.pathname && next.search === window.location.search) return;
      event.preventDefault();
      window.location.assign(anchor.href);
    };
    document.addEventListener("click", interceptOfflineLink, true);
    return () => document.removeEventListener("click", interceptOfflineLink, true);
  }, [connectivity]);

  const installExperience = getInstallExperience({
    standalone,
    installPromptAvailable: installPrompt !== null,
    ios,
    serviceWorkerSupported,
  });

  const syncLabel = useMemo(() => formatSyncAge(lastSync, clock), [lastSync, clock]);
  const status = {
    online: { label: "Online", detail: syncLabel, color: "bg-emerald-400" },
    offline: { label: "Offline", detail: "Using your saved travel pack", color: "bg-amber-300" },
    reconnecting: { label: "Reconnecting", detail: "Refreshing trip data…", color: "bg-cyan-300" },
  }[connectivity];

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome !== "accepted") setInstallPrompt(null);
  };

  return (
    <aside
      className="pwa-status fixed inset-x-0 top-3 z-[1000] mx-auto flex w-[min(94vw,46rem)] flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-neutral-950/95 px-4 py-3 text-white shadow-2xl shadow-black/40 backdrop-blur-xl print:hidden"
      aria-label="Connection, synchronization, and installation status"
    >
      <div className="flex min-w-0 items-center gap-3" role="status" aria-live="polite" aria-atomic="true">
        <span className={`size-2.5 shrink-0 rounded-full ${status.color} ${connectivity === "reconnecting" ? "animate-pulse" : ""}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em]">{status.label}</p>
          <p className="truncate text-xs text-neutral-400">{status.detail}</p>
        </div>
      </div>

      {installExperience === "prompt" ? (
        <button
          type="button"
          onClick={install}
          className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-neutral-950 transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          aria-label="Install BEAST Travel on this device"
        >
          Install app
        </button>
      ) : installExperience === "installed" ? (
        <span className="text-xs font-bold text-emerald-200" aria-label="BEAST Travel is installed">
          Installed
        </span>
      ) : installExperience === "ios-instructions" ? (
        <details className="text-right text-xs">
          <summary className="cursor-pointer font-bold text-cyan-200">Install help</summary>
          <p className="absolute right-3 mt-3 max-w-xs rounded-xl border border-white/10 bg-neutral-900 p-4 text-left leading-5 text-neutral-200 shadow-xl">
            On iPhone or iPad, open the Share menu in Safari, then choose Add to Home Screen.
          </p>
        </details>
      ) : null}
    </aside>
  );
}

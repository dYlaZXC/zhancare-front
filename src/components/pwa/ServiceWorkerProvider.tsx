"use client";

import { useEffect, useRef } from "react";
import { SerwistProvider, useSerwist } from "@serwist/next/react";
import { toast } from "react-toastify";

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Watches for a new service worker that has finished installing and is
 * sitting in the "waiting" state (i.e. a new release is available), and
 * lets the user trigger the update on their own terms instead of forcing
 * it — important because a forced reload mid-visit would drop an active
 * video consultation (LiveKit/WebSocket). See src/sw.ts: skipWaiting is
 * deliberately false, so the new worker only activates once this
 * component posts SKIP_WAITING to it.
 */
function UpdatePrompt() {
  const { serwist } = useSerwist();
  const hasReloadedRef = useRef(false);
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!serwist) return;

    const promptUpdate = () => {
      if (toastShownRef.current) return;
      toastShownRef.current = true;
      toast.info(
        // skipWaiting() activates the new worker for every open tab in this
        // scope at once, not just the one that confirms — including a tab
        // mid-consultation. There's no way to scope it to "this tab only",
        // so for this first version the toast just says so and lets the
        // person decide when it's safe, rather than updating silently.
        "📲 Доступна новая версия приложения. Обновление применится во всех открытых вкладках — если где-то идёт консультация, лучше обновить после её завершения. Обновить сейчас?",
        {
          autoClose: false,
          closeOnClick: false,
          onClick: () => {
            serwist.messageSkipWaiting();
          },
        }
      );
    };

    const handleWaiting = () => {
      // Fires whether the update was discovered in this tab or another
      // tab/page already has one waiting — either way it's a real update
      // to offer.
      promptUpdate();
    };

    const handleControlling = () => {
      // Fires once the new worker takes over after messageSkipWaiting().
      // Reload exactly once to pick up the new JS/CSS — never on the very
      // first install (no previous controller to replace).
      if (hasReloadedRef.current) return;
      hasReloadedRef.current = true;
      window.location.reload();
    };

    serwist.addEventListener("waiting", handleWaiting);
    serwist.addEventListener("controlling", handleControlling);
    return () => {
      serwist.removeEventListener("waiting", handleWaiting);
      serwist.removeEventListener("controlling", handleControlling);
    };
  }, [serwist]);

  return null;
}

export default function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={!IS_PROD}
      register
      cacheOnNavigation={false}
      reloadOnOnline={false}
    >
      <UpdatePrompt />
      {children}
    </SerwistProvider>
  );
}

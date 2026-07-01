"use client";

declare global {
  interface Window {
    tiptop?: {
      Widget: new () => TipTopWidget;
    };
  }
}

interface TipTopWidget {
  oncomplete: (result: { status?: string; type?: string }) => void;
  start: (options: TipTopStartOptions) => Promise<void>;
}

export interface TipTopStartOptions {
  publicTerminalId: string;
  description: string;
  amount: number;
  currency?: string;
  paymentSchema?: string;
  externalId?: string;
  userInfo?: { accountId?: string; email?: string };
  culture?: string;
}

const WIDGET_SRC = "https://widget.tiptoppay.kz/bundles/widget.js";

let loadPromise: Promise<void> | null = null;

export function loadTipTopPayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.tiptop) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WIDGET_SRC}"]`);
    if (existing) {
      const check = setInterval(() => {
        if (window.tiptop) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); reject(new Error("Timeout")); }, 10000);
      return;
    }
    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Не удалось загрузить виджет оплаты TipTop Pay"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function openTipTopPayWidget(
  publicTerminalId: string,
  options: Omit<TipTopStartOptions, "publicTerminalId">
): Promise<void> {
  await loadTipTopPayScript();
  if (!window.tiptop) throw new Error("Виджет TipTop Pay недоступен");

  return new Promise((resolve, reject) => {
    const widget = new window.tiptop!.Widget();
    widget.oncomplete = (result) => {
      if (result.status === "success") resolve();
      else reject(new Error("Оплата не завершена"));
    };
    widget.start({
      publicTerminalId,
      currency: "KZT",
      paymentSchema: "Single",
      culture: "ru-RU",
      ...options,
    }).catch(reject);
  });
}

import React, { useEffect } from "react";
import Icon from "@/components/graamam/Icon";

/**
 * SlideOver — right-side drawer for forms (e.g., New Batch).
 */
export default function SlideOver({ open, onClose, title, subtitle, children, footer, width = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-inverse-surface/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={() => onClose && onClose()}
      />
      <aside
        className={`absolute right-0 top-0 bottom-0 w-full ${width} bg-surface-container-lowest dark:bg-[#121212] border-l border-surface-variant dark:border-white/10 shadow-warm-lg flex flex-col animate-[slideUp_260ms_ease-out]`}
        style={{ animation: "fadeIn 220ms ease-out both" }}
      >
        <header className="flex items-start justify-between px-6 py-5 border-b border-surface-variant/70 dark:border-white/10">
          <div>
            <h3 className="font-headline font-bold text-headline-sm text-primary-container dark:text-primary-fixed-dim">{title}</h3>
            {subtitle ? (
              <p className="text-body-sm text-on-surface-variant dark:text-outline-variant mt-1">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onClose && onClose()}
            aria-label="Close drawer"
            className="text-outline hover:text-primary-container dark:hover:text-white p-2 -m-2 rounded-full"
          >
            <Icon name="close" className="text-[22px]" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? (
          <footer className="px-6 py-4 border-t border-surface-variant/70 dark:border-white/10 flex items-center justify-end gap-3 bg-surface-container-lowest dark:bg-[#121212]">{footer}</footer>
        ) : null}
      </aside>
    </div>
  );
}

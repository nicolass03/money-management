import { useEffect, useEffectEvent, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TerminalModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function TerminalModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
}: TerminalModalProps) {
  const { t } = useTranslation("common");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Callers pass inline `onClose` functions. As an effect event it stays out of the effect's deps,
  // so a parent re-render (e.g. typing in a field) never re-runs the effect and steals focus.
  const onEscape = useEffectEvent(onClose);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onEscape();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={t("closeModalAria")}
        className="animate-fade-in absolute inset-0 bg-bg/80 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "animate-scale-in relative z-10 flex w-full max-w-lg flex-col border border-border bg-surface shadow-[0_0_24px_var(--glow-color)]",
          "max-h-[min(85vh,640px)]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p
              id={titleId}
              className="truncate font-mono text-sm text-accent-glow"
            >
              ~/{title}
            </p>
            {subtitle && (
              <p className="mt-1 font-mono text-xs text-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-border px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-accent/50 hover:text-text"
          >
            {t("escClose")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

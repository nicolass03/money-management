"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  label?: string;
  variant?: "inline" | "page";
  className?: string;
}

export function TerminalSpinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-3 shrink-0 border border-accent/50 border-t-accent-glow animate-spin",
        className,
      )}
      aria-hidden
    />
  );
}

export function LoadingIndicator({
  label,
  variant = "page",
  className,
}: LoadingIndicatorProps) {
  const { t } = useTranslation("common");
  const resolvedLabel = label ?? t("loading");

  if (variant === "inline") {
    return (
      <span
        className={cn("inline-flex items-center gap-2", className)}
        role="status"
        aria-live="polite"
      >
        <TerminalSpinner />
        <span>{resolvedLabel}</span>
        <span className="animate-blink text-accent" aria-hidden>
          _
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-6",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={resolvedLabel}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="font-mono text-sm"
      >
        <span className="text-accent">{"> "}</span>
        <span className="text-muted">{resolvedLabel}</span>
        <span className="animate-blink text-accent-glow">_</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="w-56 border border-border bg-surface p-3"
      >
        <div className="relative h-1 overflow-hidden bg-border/50">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-accent/80 to-transparent"
            animate={{ left: ["-33%", "100%"] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-muted">
          {t("pleaseWait")}
        </p>
      </motion.div>
    </div>
  );
}

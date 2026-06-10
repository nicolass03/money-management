import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "danger";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-mono text-xs",
        variant === "default" && "border-border bg-surface-elevated text-muted",
        variant === "accent" &&
          "border-accent/50 bg-accent/10 text-accent-glow",
        variant === "success" &&
          "border-success/50 bg-success/10 text-success",
        variant === "danger" && "border-danger/50 bg-danger/10 text-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}

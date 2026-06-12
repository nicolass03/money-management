import { TerminalSpinner } from "@/components/ui/loading-indicator";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-mono transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        variant === "primary" &&
          "border border-accent bg-accent/10 text-text hover:bg-accent/20 hover:shadow-[0_0_12px_var(--glow-color)]",
        variant === "ghost" &&
          "border border-border bg-transparent text-muted hover:text-text hover:border-accent/50",
        variant === "danger" &&
          "border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20",
        className,
      )}
      {...props}
    >
      {loading && <TerminalSpinner className="mr-2" />}
      {children}
    </button>
  );
}

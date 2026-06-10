import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text placeholder:text-muted outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_rgba(255,255,255,0.1)]",
        className,
      )}
      {...props}
    />
  );
}

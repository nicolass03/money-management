import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h2 className="terminal-prompt font-mono text-lg text-text">{title}</h2>
      {subtitle && (
        <p className="mt-1 font-mono text-xs text-muted">{subtitle}</p>
      )}
    </div>
  );
}

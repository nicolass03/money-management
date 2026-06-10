import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "border border-border bg-surface p-4 transition-colors hover:border-accent/30",
        className,
      )}
    >
      {children}
    </div>
  );
}

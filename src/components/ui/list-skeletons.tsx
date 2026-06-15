import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardListSkeletonProps {
  count?: number;
  className?: string;
  label?: string;
}

export function CardListSkeleton({
  count = 3,
  className,
  label,
}: CardListSkeletonProps) {
  const { t } = useTranslation("common");
  const resolvedLabel = label ?? t("loading");

  return (
    <div
      className={cn("space-y-4", className)}
      aria-busy="true"
      aria-label={resolvedLabel}
    >
      {Array.from({ length: count }, (_, index) => (
        <Card key={index}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </Card>
      ))}
    </div>
  );
}

interface ProjectionsTableSkeletonProps {
  rows?: number;
}

export function ProjectionsTableSkeleton({ rows = 6 }: ProjectionsTableSkeletonProps) {
  const { t } = useTranslation("common");

  return (
    <Card
      className="overflow-hidden p-0"
      aria-busy="true"
      aria-label={t("loadingProjections")}
    >
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border px-4 py-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12 justify-self-end" />
        <Skeleton className="h-3 w-20 justify-self-end" />
        <Skeleton className="h-3 w-10 justify-self-end" />
        <Skeleton className="h-3 w-20 justify-self-end" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-4 w-16 self-center justify-self-end" />
            <Skeleton className="h-4 w-16 self-center justify-self-end" />
            <Skeleton className="h-4 w-16 self-center justify-self-end" />
            <Skeleton className="h-4 w-16 self-center justify-self-end" />
          </div>
        ))}
      </div>
    </Card>
  );
}

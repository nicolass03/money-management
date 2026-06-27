"use client";

import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReportLoadingSkeleton() {
  const { t } = useTranslation("common");

  return (
    <div aria-busy="true" aria-label={t("loading")}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <Skeleton className="mb-2 h-3 w-32" />
            <Skeleton className="h-[200px] w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

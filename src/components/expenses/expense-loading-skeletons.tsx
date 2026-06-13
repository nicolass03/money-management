import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ExpensePeriodHeroSkeleton() {
  return (
    <div className="mb-4 space-y-4" aria-busy="true" aria-label="loading period hero">
      <Card>
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="h-9 w-40" />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-7 w-28" />
        </Card>
        <Card>
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </Card>
      </div>
    </div>
  );
}

export function ExpenseChartsSkeleton() {
  return (
    <section aria-busy="true" aria-label="loading charts">
      <div className="mb-4">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="mx-auto h-[180px] w-[140px] rounded-full" />
        </Card>
        <Card className="md:col-span-2">
          <Skeleton className="mb-2 h-3 w-14" />
          <div className="flex h-[180px] items-end gap-3">
            <Skeleton className="h-[40%] flex-1" />
            <Skeleton className="h-[65%] flex-1" />
            <Skeleton className="h-[55%] flex-1" />
            <Skeleton className="h-[80%] flex-1" />
            <Skeleton className="h-[45%] flex-1" />
          </div>
        </Card>
      </div>
    </section>
  );
}

export function ExpensePeriodListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="loading period">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function EarlyPaymentPanelSkeleton() {
  return (
    <Card className="mt-4 overflow-hidden p-0" aria-busy="true" aria-label="loading upcoming payments">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-5 w-6" />
      </div>
    </Card>
  );
}

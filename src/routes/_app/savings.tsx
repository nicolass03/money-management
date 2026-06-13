import { createFileRoute } from "@tanstack/react-router";
import { SavingsPlaceholder } from "@/components/savings/savings-placeholder";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useMoneyContext, useSavings } from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/savings")({
  component: SavingsPage,
});

function SavingsPage() {
  const entries = useSavings();
  const money = useMoneyContext();

  if (entries.isLoading || money.isLoading || !money.data) {
    return <LoadingIndicator label="fetching data" />;
  }

  return (
    <SavingsPlaceholder
      entries={entries.data ?? []}
      displayCurrency={money.data.displayCurrency}
      rates={money.data.rates}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { IncomeDashboard } from "@/components/income/income-dashboard";
import {
  useIncome,
  useIncomeSchedules,
  useMoneyContext,
} from "@/hooks/use-queries";
import type { ExchangeRates } from "@/lib/currency/convert";
import type { CurrencyCode } from "@/lib/types/constants";

export const Route = createFileRoute("/_app/income")({
  component: IncomePage,
});

function IncomePage() {
  const entries = useIncome();
  const schedules = useIncomeSchedules();
  const money = useMoneyContext();

  const displayCurrency: CurrencyCode = money.data?.displayCurrency ?? "usd";
  const rates: ExchangeRates =
    money.data?.rates ?? { base: "USD", rates: {}, fetchedAt: "" };

  return (
    <IncomeDashboard
      entries={entries.data ?? []}
      schedules={schedules.data ?? []}
      entriesLoading={entries.isLoading || money.isLoading}
      schedulesLoading={schedules.isLoading || money.isLoading}
      displayCurrency={displayCurrency}
      rates={rates}
    />
  );
}

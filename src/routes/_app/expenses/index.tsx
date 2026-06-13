import { createFileRoute } from "@tanstack/react-router";
import { ExpenseDashboard } from "@/components/expenses/expense-dashboard";
import { useMoneyContext, useSettings } from "@/hooks/use-queries";
import type { ExchangeRates } from "@/lib/currency/convert";
import type { CurrencyCode } from "@/lib/types/constants";

export const Route = createFileRoute("/_app/expenses/")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const settings = useSettings();
  const money = useMoneyContext();

  const displayCurrency: CurrencyCode =
    money.data?.displayCurrency ??
    settings.data?.displayCurrency ??
    "usd";
  const rates: ExchangeRates =
    money.data?.rates ?? { base: "USD", rates: {}, fetchedAt: "" };

  return (
    <ExpenseDashboard
      primarySchedule={settings.data?.primarySchedule ?? null}
      displayCurrency={displayCurrency}
      rates={rates}
    />
  );
}

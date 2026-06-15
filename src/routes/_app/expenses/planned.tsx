import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PlannedExpenses } from "@/components/expenses/planned-expenses";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useMoneyContext, usePlannedExpenses } from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/expenses/planned")({
  component: PlannedExpensesPage,
});

function PlannedExpensesPage() {
  const { t } = useTranslation(["expenses", "common"]);
  const planned = usePlannedExpenses();
  const money = useMoneyContext();

  if (planned.isLoading || money.isLoading || !money.data) {
    return <LoadingIndicator label={t("common:fetchingData")} />;
  }

  return (
    <div>
      <Link
        to="/expenses"
        className="mb-6 inline-block font-mono text-sm text-accent hover:text-accent-glow"
      >
        {t("expenses:backToExpenses")}
      </Link>

      <PlannedExpenses
        plannedExpenses={planned.data ?? []}
        displayCurrency={money.data.displayCurrency}
        rates={money.data.rates}
      />
    </div>
  );
}

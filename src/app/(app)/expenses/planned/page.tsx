export const dynamic = "force-dynamic";

import Link from "next/link";
import { PlannedExpenses } from "@/components/expenses/planned-expenses";
import { getMoneyContext, getPlannedExpensesWithTags } from "@/lib/db/queries";

export default async function PlannedExpensesPage() {
  const [plannedExpenses, money] = await Promise.all([
    getPlannedExpensesWithTags(),
    getMoneyContext(),
  ]);

  return (
    <div>
      <Link
        href="/expenses"
        className="mb-6 inline-block font-mono text-sm text-accent hover:text-accent-glow"
      >
        {"< back to ~/expenses"}
      </Link>

      <PlannedExpenses
        plannedExpenses={plannedExpenses}
        displayCurrency={money.displayCurrency}
        rates={money.rates}
      />
    </div>
  );
}

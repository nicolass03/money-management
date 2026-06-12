export const dynamic = "force-dynamic";

import Link from "next/link";
import { PlannedExpenses } from "@/components/expenses/planned-expenses";
import { getMoneyContext } from "@/lib/api/money-context";
import { getPlannedExpenses } from "@/lib/api/planned-expenses";

export default async function PlannedExpensesPage() {
  const [plannedExpenses, money] = await Promise.all([
    getPlannedExpenses(),
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

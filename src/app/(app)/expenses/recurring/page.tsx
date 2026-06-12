export const dynamic = "force-dynamic";

import Link from "next/link";
import { RecurringExpenses } from "@/components/expenses/recurring-expenses";
import { getMoneyContext } from "@/lib/api/money-context";
import { getRecurringExpenses } from "@/lib/api/recurring-expenses";
import { getAllTagNames } from "@/lib/api/tags";

export default async function RecurringExpensesPage() {
  const [recurringExpenses, allTags, money] = await Promise.all([
    getRecurringExpenses(),
    getAllTagNames(),
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

      <RecurringExpenses
        recurringExpenses={recurringExpenses}
        allTags={allTags}
        displayCurrency={money.displayCurrency}
        rates={money.rates}
      />
    </div>
  );
}

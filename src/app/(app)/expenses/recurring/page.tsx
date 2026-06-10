export const dynamic = "force-dynamic";

import Link from "next/link";
import { RecurringExpenses } from "@/components/expenses/recurring-expenses";
import {
  getAllTagNames,
  getMoneyContext,
  getRecurringExpensesWithTags,
} from "@/lib/db/queries";

export default async function RecurringExpensesPage() {
  const [recurringExpenses, allTags, money] = await Promise.all([
    getRecurringExpensesWithTags(),
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

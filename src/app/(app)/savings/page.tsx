export const dynamic = "force-dynamic";

import { SavingsPlaceholder } from "@/components/savings/savings-placeholder";
import { getMoneyContext, getSavings } from "@/lib/db/queries";

export default async function SavingsPage() {
  const [entries, money] = await Promise.all([getSavings(), getMoneyContext()]);

  return (
    <SavingsPlaceholder
      entries={entries}
      displayCurrency={money.displayCurrency}
      rates={money.rates}
    />
  );
}

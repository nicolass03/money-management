import "./load-env";
import { chargeDueExpensesForDate } from "../src/lib/expenses/charge-due-expenses";

async function main() {
  const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
  const result = await chargeDueExpensesForDate(date);
  console.log(`Charged ${result.created} recurring expense(s) for ${date}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

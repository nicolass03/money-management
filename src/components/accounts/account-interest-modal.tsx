import { useTranslation } from "react-i18next";
import { TerminalModal } from "@/components/ui/terminal-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyText } from "@/components/layout/privacy-mode";
import { useAccountInterest } from "@/hooks/use-queries";
import { formatInterestRate } from "@/lib/accounts/interest";
import { formatMoney } from "@/lib/currency/format";
import type { Account, InterestCredit } from "@/lib/types/domain";
import { formatDate, formatMonth } from "@/lib/utils";

interface AccountInterestModalProps {
  account: Account;
  name: string;
  open: boolean;
  onClose: () => void;
}

interface MonthGroup {
  month: string;
  total: number;
  credits: InterestCredit[];
}

/** Credits (newest first) grouped by `YYYY-MM`, keeping that order. */
function groupByMonth(credits: InterestCredit[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const credit of credits) {
    const month = credit.date.slice(0, 7);
    let group = groups.get(month);
    if (!group) {
      group = { month, total: 0, credits: [] };
      groups.set(month, group);
    }
    group.total += credit.amount;
    group.credits.push(credit);
  }
  return [...groups.values()];
}

/** The account's daily interest credits, kept out of the income list so they don't crowd it. */
export function AccountInterestModal({
  account,
  name,
  open,
  onClose,
}: AccountInterestModalProps) {
  const { t } = useTranslation("accounts");
  const { data: credits = [], isLoading } = useAccountInterest(account.id, open);
  const total = credits.reduce((sum, credit) => sum + credit.amount, 0);
  const money = (amount: number) => formatMoney(amount, account.currency);

  return (
    <TerminalModal
      open={open}
      onClose={onClose}
      title={t("interestTitle")}
      subtitle={`${name} · ${formatInterestRate(account.interestRateBps, account.interestRateType)}`}
    >
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      ) : credits.length === 0 ? (
        <p className="font-mono text-xs text-muted">{t("interestEmpty")}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between font-mono text-sm">
            <span className="text-muted">{t("interestTotal")}</span>
            <span className="text-success">
              +<MoneyText value={money(total)} />
            </span>
          </div>
          {groupByMonth(credits).map((group) => (
            <section key={group.month}>
              <div className="flex items-center justify-between border-b border-border pb-1 font-mono text-xs text-muted">
                <span>{formatMonth(`${group.month}-01`)}</span>
                <span>
                  +<MoneyText value={money(group.total)} />
                </span>
              </div>
              <ul className="mt-1">
                {group.credits.map((credit) => (
                  <li
                    key={credit.date}
                    className="flex items-center justify-between py-0.5 font-mono text-xs"
                  >
                    <span className="text-muted">{formatDate(credit.date)}</span>
                    <span className="text-text">
                      +<MoneyText value={money(credit.amount)} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </TerminalModal>
  );
}

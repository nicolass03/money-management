import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/types/domain";

export function accountLabel(account: Account, unnamed: string): string {
  const name = account.name?.trim() || unnamed;
  return `${name} · ${account.currency.toUpperCase()}`;
}

interface AccountSelectProps {
  id: string;
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => void;
}

/**
 * Account picker for the entry forms. Currency follows the selected account, so forms derive
 * their currency from the chosen account rather than offering a separate currency picker.
 */
export function AccountSelect({ id, accounts, value, onChange }: AccountSelectProps) {
  const { t } = useTranslation(["accounts", "common"]);

  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-xs text-muted">
        {t("accounts:labelAccount")}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full border border-border bg-surface px-3 py-2 font-mono text-sm text-text outline-none transition-colors focus:border-accent focus:shadow-[0_0_8px_var(--glow-color)]",
        )}
        disabled={accounts.length === 0}
      >
        {accounts.length === 0 && (
          <option value="">{t("accounts:noAccounts")}</option>
        )}
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {accountLabel(account, t("accounts:unnamed"))}
          </option>
        ))}
      </select>
    </div>
  );
}

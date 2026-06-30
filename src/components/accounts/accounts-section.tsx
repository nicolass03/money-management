import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { toDisplayAmount, type MoneyDisplayContext } from "@/lib/currency/display";
import type { Account } from "@/lib/types/domain";
import { AccountForm } from "./account-form";
import { AccountList } from "./account-list";

interface AccountsSectionProps extends MoneyDisplayContext {
  accounts: Account[];
  loading?: boolean;
}

export function AccountsSection({
  accounts,
  loading = false,
  displayCurrency,
  rates,
}: AccountsSectionProps) {
  const { t } = useTranslation(["accounts", "common"]);
  const [showAdd, setShowAdd] = useState(false);
  const ctx = { displayCurrency, rates };

  // Net worth: every account's current balance summed into the display currency.
  const netWorth = accounts.reduce(
    (sum, account) => sum + toDisplayAmount(account.balance, account.currency, ctx),
    0,
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={t("accounts:title")}
          subtitle={t("accounts:subtitle")}
          className="mb-0"
        />
        <div className="flex shrink-0 items-center gap-3">
          {loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            accounts.length > 0 && (
              <Badge variant="accent">
                <MoneyText
                  value={formatMoney(netWorth, displayCurrency, displayCurrency, rates)}
                />
                {t("accounts:badgeNetWorth")}
              </Badge>
            )
          )}
          {!loading && (
            <Button
              size="sm"
              variant={showAdd ? "ghost" : "primary"}
              onClick={() => setShowAdd((open) => !open)}
            >
              {showAdd ? t("common:cancel") : t("accounts:addAccount")}
            </Button>
          )}
        </div>
      </div>

      {showAdd && !loading && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">{t("accounts:formHint")}</p>
          <AccountForm
            onCancel={() => setShowAdd(false)}
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      <AccountList accounts={accounts} loading={loading} />
    </section>
  );
}

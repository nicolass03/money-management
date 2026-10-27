import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardListSkeleton } from "@/components/ui/list-skeletons";
import { MoneyText } from "@/components/layout/privacy-mode";
import { useRowDelete } from "@/hooks/use-row-delete";
import { formatMoney } from "@/lib/currency/format";
import { useDeleteAccount } from "@/lib/mutations/accounts";
import { formatInterestRate } from "@/lib/accounts/interest";
import type { Account } from "@/lib/types/domain";
import { AccountForm } from "./account-form";
import { AccountInterestModal } from "./account-interest-modal";

interface AccountListProps {
  accounts: Account[];
  loading?: boolean;
}

export function AccountList({ accounts, loading = false }: AccountListProps) {
  const { t } = useTranslation(["accounts", "common"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [interestId, setInterestId] = useState<string | null>(null);
  const deleteAccount = useDeleteAccount();
  // e.g. the API refuses to archive the last active account — surface that instead of a no-op.
  const rowArchive = useRowDelete(
    (id) => deleteAccount.mutateAsync(id),
    t("accounts:confirmArchive"),
  );

  if (loading) {
    return <CardListSkeleton count={3} />;
  }

  if (accounts.length === 0) {
    return <p className="font-mono text-xs text-muted">{t("accounts:empty")}</p>;
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const name = account.name?.trim() || t("accounts:unnamed");
        if (editingId === account.id) {
          return (
            <Card key={account.id}>
              <AccountForm
                account={account}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            </Card>
          );
        }
        return (
          <Card key={account.id}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm text-text">
                  {name}{" "}
                  <span className="text-muted">· {account.currency.toUpperCase()}</span>
                  {account.excludeFromProjections && (
                    <span className="text-muted"> · {t("accounts:excludedBadge")}</span>
                  )}
                  {account.interestRateBps > 0 && (
                    <span className="text-muted">
                      {" "}
                      · {formatInterestRate(account.interestRateBps, account.interestRateType)}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-xs text-muted">{t("accounts:balance")}</p>
                  <p className="font-mono text-sm text-accent-glow">
                    <MoneyText value={formatMoney(account.balance, account.currency)} />
                  </p>
                </div>
                {account.interestRateBps > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setInterestId(account.id)}>
                    {t("accounts:interest")}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setEditingId(account.id)}>
                  {t("common:edit")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={rowArchive.isPending(account.id)}
                  onClick={() => void rowArchive.remove(account.id)}
                >
                  {t("accounts:archive")}
                </Button>
              </div>
            </div>
            {rowArchive.errorFor(account.id) && (
              <p className="mt-2 font-mono text-xs text-danger">
                {rowArchive.errorFor(account.id)}
              </p>
            )}
            {interestId === account.id && (
              <AccountInterestModal
                account={account}
                name={name}
                open
                onClose={() => setInterestId(null)}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}

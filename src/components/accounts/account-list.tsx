import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardListSkeleton } from "@/components/ui/list-skeletons";
import { MoneyText } from "@/components/layout/privacy-mode";
import { formatMoney } from "@/lib/currency/format";
import { useDeleteAccount } from "@/lib/mutations/accounts";
import type { Account } from "@/lib/types/domain";
import { AccountForm } from "./account-form";

interface AccountListProps {
  accounts: Account[];
  loading?: boolean;
}

export function AccountList({ accounts, loading = false }: AccountListProps) {
  const { t } = useTranslation(["accounts", "common"]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const deleteAccount = useDeleteAccount();

  if (loading) {
    return <CardListSkeleton count={3} />;
  }

  if (accounts.length === 0) {
    return <p className="font-mono text-xs text-muted">{t("accounts:empty")}</p>;
  }

  async function handleArchive(id: string) {
    if (!window.confirm(t("accounts:confirmArchive"))) return;
    await deleteAccount.mutateAsync(id);
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
          <Card key={account.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-mono text-sm text-text">
                {name}{" "}
                <span className="text-muted">· {account.currency.toUpperCase()}</span>
              </p>
              <p className="mt-1 font-mono text-xs text-muted">
                {t("accounts:initial")}:{" "}
                <MoneyText value={formatMoney(account.initialAmount, account.currency)} />
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="font-mono text-xs text-muted">{t("accounts:balance")}</p>
                <p className="font-mono text-sm text-accent-glow">
                  <MoneyText value={formatMoney(account.balance, account.currency)} />
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(account.id)}>
                {t("common:edit")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => void handleArchive(account.id)}
              >
                {t("accounts:archive")}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

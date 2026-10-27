import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardListSkeleton } from "@/components/ui/list-skeletons";
import { SectionHeader } from "@/components/ui/section-header";
import { MoneyText } from "@/components/layout/privacy-mode";
import { useRecurringTransfers, useTransfers } from "@/hooks/use-queries";
import { useRowDelete } from "@/hooks/use-row-delete";
import { formatMoney } from "@/lib/currency/format";
import { formatFrequency, getUpcomingOccurrences } from "@/lib/income/pay-periods";
import { useDeleteRecurringTransfer, useDeleteTransfer } from "@/lib/mutations/transfers";
import type { Account, CurrencyCode } from "@/lib/types/domain";
import { formatDate } from "@/lib/utils";
import { TransferForm } from "./transfer-form";

interface TransfersSectionProps {
  /** Active accounts (an id missing here belongs to an archived account). */
  accounts: Account[];
}

export function TransfersSection({ accounts }: TransfersSectionProps) {
  const { t } = useTranslation(["accounts", "common"]);
  const transfers = useTransfers();
  const recurring = useRecurringTransfers();
  const [showAdd, setShowAdd] = useState(false);
  // Transfer and recurring-transfer ids are both UUIDs, so one editing id covers both lists.
  const [editingId, setEditingId] = useState<string | null>(null);
  const deleteTransfer = useDeleteTransfer();
  const deleteRecurring = useDeleteRecurringTransfer();
  const transferDelete = useRowDelete(
    (id) => deleteTransfer.mutateAsync(id),
    t("accounts:confirmDeleteTransfer"),
  );
  const recurringDelete = useRowDelete(
    (id) => deleteRecurring.mutateAsync(id),
    t("accounts:confirmDeleteRecurringTransfer"),
  );

  const isActive = (id: string) => accounts.some((a) => a.id === id);
  const accountName = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    if (!account) return t("accounts:archivedAccount");
    return account.name?.trim() || t("accounts:unnamed");
  };
  const route = (row: { fromAccountId: string; toAccountId: string }) =>
    `${accountName(row.fromAccountId)} → ${accountName(row.toAccountId)}`;
  const title = (name: string | null) => name?.trim() || t("accounts:unnamedTransfer");
  const closeForm = () => setEditingId(null);

  const recurringRows = recurring.data ?? [];
  const transferRows = transfers.data ?? [];
  const loading = transfers.isLoading || recurring.isLoading;

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <SectionHeader
          title={t("accounts:transfersTitle")}
          subtitle={t("accounts:transfersSubtitle")}
          className="mb-0"
        />
        <Button
          size="sm"
          variant={showAdd ? "ghost" : "primary"}
          disabled={accounts.length < 2}
          onClick={() => setShowAdd((open) => !open)}
        >
          {showAdd ? t("common:cancel") : t("accounts:newTransfer")}
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-4">
          <p className="mb-4 font-mono text-xs text-muted">{t("accounts:transferHint")}</p>
          <TransferForm
            accounts={accounts}
            onCancel={() => setShowAdd(false)}
            onSuccess={() => setShowAdd(false)}
          />
        </Card>
      )}

      {loading ? (
        <CardListSkeleton count={2} />
      ) : recurringRows.length === 0 && transferRows.length === 0 ? (
        <p className="font-mono text-xs text-muted">{t("accounts:transfersEmpty")}</p>
      ) : (
        <div className="space-y-3">
          {recurringRows.map((row) => {
            if (editingId === row.id) {
              return (
                <Card key={row.id}>
                  <TransferForm
                    accounts={accounts}
                    recurring={row}
                    onCancel={closeForm}
                    onSuccess={closeForm}
                  />
                </Card>
              );
            }
            // The daily job skips a template whose account was archived.
            const paused = !isActive(row.fromAccountId) || !isActive(row.toAccountId);
            const next = getUpcomingOccurrences(row, 1)[0];
            const status = paused
              ? t("accounts:pausedTransfer")
              : t("accounts:nextTransfer", { date: formatDate(next) });
            return (
              <TransferCard
                key={row.id}
                title={title(row.name)}
                meta={`${route(row)} // ${formatFrequency(row.frequency)} // ${status}`}
                badge={t("accounts:recurringBadge")}
                amount={row.amount}
                currency={row.currency}
                onEdit={() => setEditingId(row.id)}
                onDelete={() => void recurringDelete.remove(row.id)}
                deleting={recurringDelete.isPending(row.id)}
                error={recurringDelete.errorFor(row.id)}
              />
            );
          })}

          {transferRows.map((row) => {
            if (editingId === row.id) {
              return (
                <Card key={row.id}>
                  <TransferForm
                    accounts={accounts}
                    transfer={row}
                    onCancel={closeForm}
                    onSuccess={closeForm}
                  />
                </Card>
              );
            }
            return (
              <TransferCard
                key={row.id}
                title={title(row.name)}
                meta={`${formatDate(row.date)} // ${route(row)}`}
                badge={row.recurringTransferId ? t("accounts:recurringBadge") : undefined}
                amount={row.amount}
                currency={row.currency}
                onEdit={() => setEditingId(row.id)}
                onDelete={() => void transferDelete.remove(row.id)}
                deleting={transferDelete.isPending(row.id)}
                error={transferDelete.errorFor(row.id)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

interface TransferCardProps {
  title: string;
  meta: string;
  badge?: string;
  amount: number;
  currency: CurrencyCode;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  error: string | null;
}

function TransferCard({
  title,
  meta,
  badge,
  amount,
  currency,
  onEdit,
  onDelete,
  deleting,
  error,
}: TransferCardProps) {
  const { t } = useTranslation("common");
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm text-text">
            {title} {badge && <Badge>{badge}</Badge>}
          </p>
          <p className="mt-1 truncate font-mono text-xs text-muted">{meta}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="font-mono text-sm text-accent-glow">
            <MoneyText value={formatMoney(amount, currency)} />
          </p>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            {t("edit")}
          </Button>
          <Button size="sm" variant="danger" loading={deleting} onClick={onDelete}>
            {deleting ? t("deleting") : t("delete")}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 font-mono text-xs text-danger">{error}</p>}
    </Card>
  );
}

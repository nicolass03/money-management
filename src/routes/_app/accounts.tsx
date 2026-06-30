import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AccountsSection } from "@/components/accounts/accounts-section";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useAccounts, useMoneyContext } from "@/hooks/use-queries";

export const Route = createFileRoute("/_app/accounts")({
  component: AccountsPage,
});

function AccountsPage() {
  const { t } = useTranslation("common");
  const accounts = useAccounts();
  const money = useMoneyContext();

  if (accounts.isLoading || money.isLoading || !money.data) {
    return <LoadingIndicator label={t("fetchingData")} />;
  }

  return (
    <AccountsSection
      accounts={accounts.data ?? []}
      loading={accounts.isLoading}
      displayCurrency={money.data.displayCurrency}
      rates={money.data.rates}
    />
  );
}

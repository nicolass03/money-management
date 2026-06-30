import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import accountsEn from "@/locales/en/accounts.json";
import authEn from "@/locales/en/auth.json";
import budgetsEn from "@/locales/en/budgets.json";
import commonEn from "@/locales/en/common.json";
import errorsEn from "@/locales/en/errors.json";
import expensesEn from "@/locales/en/expenses.json";
import incomeEn from "@/locales/en/income.json";
import projectionsEn from "@/locales/en/projections.json";
import reportsEn from "@/locales/en/reports.json";
import savingsEn from "@/locales/en/savings.json";
import settingsEn from "@/locales/en/settings.json";
import authEs from "@/locales/es/auth.json";
import budgetsEs from "@/locales/es/budgets.json";
import commonEs from "@/locales/es/common.json";
import errorsEs from "@/locales/es/errors.json";
import expensesEs from "@/locales/es/expenses.json";
import incomeEs from "@/locales/es/income.json";
import projectionsEs from "@/locales/es/projections.json";
import reportsEs from "@/locales/es/reports.json";
import savingsEs from "@/locales/es/savings.json";
import settingsEs from "@/locales/es/settings.json";
import accountsEs from "@/locales/es/accounts.json";

export const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    accounts: accountsEn,
    settings: settingsEn,
    errors: errorsEn,
    expenses: expensesEn,
    budgets: budgetsEn,
    income: incomeEn,
    projections: projectionsEn,
    reports: reportsEn,
    savings: savingsEn,
  },
  es: {
    common: commonEs,
    auth: authEs,
    accounts: accountsEs,
    settings: settingsEs,
    errors: errorsEs,
    expenses: expensesEs,
    budgets: budgetsEs,
    income: incomeEs,
    projections: projectionsEs,
    reports: reportsEs,
    savings: savingsEs,
  },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;

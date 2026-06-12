export const payFrequencies = ["weekly", "biweekly", "monthly", "yearly"] as const;
export type PayFrequency = (typeof payFrequencies)[number];

export const currencies = ["eur", "usd", "cop"] as const;
export type CurrencyCode = (typeof currencies)[number];

export const incomeSources = ["scheduled", "manual"] as const;
export type IncomeSource = (typeof incomeSources)[number];

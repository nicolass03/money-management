export const payFrequencies = ["weekly", "biweekly", "monthly", "yearly"] as const;
export type PayFrequency = (typeof payFrequencies)[number];

export const currencies = ["eur", "usd", "cop"] as const;
export type CurrencyCode = (typeof currencies)[number];

/**
 * How a bank quotes an account's interest rate: APY/AER, TAE (Spain) and E.A. (Colombia) are
 * effective annual; TIN (Spain) is nominal annual; N.A.M.V. is nominal annual compounded monthly
 * and E.M. effective monthly (Colombia). The API converts each to a daily rate.
 */
export const interestRateTypes = ["apy", "tae", "tin", "ea", "namv", "em"] as const;
export type InterestRateType = (typeof interestRateTypes)[number];

export const incomeSources = ["scheduled", "manual"] as const;
export type IncomeSource = (typeof incomeSources)[number];

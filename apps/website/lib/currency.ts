export const USD_TO_GHS = 11.45

export function formatGHS(usd: number): string {
  return (usd * USD_TO_GHS).toLocaleString("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  })
}

export function formatUSD(usd: number): string {
  return usd.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

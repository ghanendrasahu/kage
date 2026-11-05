/**
 * Percent change between the first and last thirds of a short window.
 * Used for the KPI "momentum" pill: it compares the start of the window with
 * the most recent activity, so a quiet week reads as 0 rather than inventing
 * a number.
 */
export function momentum(series: number[] | undefined): number | null {
  if (!series || series.length < 3) return null;
  const windowSize = Math.max(1, Math.floor(series.length / 3));
  const start = series.slice(0, windowSize).reduce((sum, value) => sum + value, 0);
  const end = series.slice(-windowSize).reduce((sum, value) => sum + value, 0);

  if (start === 0 && end === 0) return 0;
  if (start === 0) return 100;
  return Math.round(((end - start) / start) * 100);
}

/** Sum a numeric series. */
export function total(series: number[] | undefined): number {
  return (series ?? []).reduce((sum, value) => sum + value, 0);
}

import { DataPoint } from "./types";

interface IrdPoint {
  date: string;
  differential: number;
}

export function generateIrdTimeline(
  baseData: DataPoint[],
  quoteData: DataPoint[],
  direction: "BUY" | "SELL",
): IrdPoint[] {
  const quoteMap = new Map<string, number>(
    quoteData.map((p) => [p.date.substring(0, 7), p.rate]),
  );

  return baseData.reduce<IrdPoint[]>((acc, point) => {
    const yearMonth = point.date.substring(0, 7);
    const quoteRate = quoteMap.get(yearMonth);

    if (quoteRate !== undefined) {
      const raw =
        direction === "BUY" ? point.rate - quoteRate : quoteRate - point.rate;
      acc.push({
        date: yearMonth,
        differential: Math.round(raw * 100) / 100,
      });
    }

    return acc;
  }, []);
}

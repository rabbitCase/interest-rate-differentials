import { FredApiResponse, DataPoint } from "./types";

export async function getCentralBankRate(
  seriesId: string,
): Promise<DataPoint[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error("Missing FRED_API_KEY in environment variables");
  }

  const baseUrl = "https://api.stlouisfed.org/fred/series/observations";
  const url = `${baseUrl}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=asc&observation_start=2021-01-01`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch FRED series ${seriesId}: ${response.statusText}`,
    );
  }

  const data: FredApiResponse = await response.json();

  return data.observations
    .filter((obs) => obs.value !== ".")
    .map((obs) => ({
      date: obs.date,
      rate: parseFloat(obs.value),
    }));
}

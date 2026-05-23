import { NextRequest, NextResponse } from "next/server";
import { getCentralBankRate } from "../../../lib/fred";

const FRED_SERIES: Record<string, string> = {
  EUR: "ECBDFR",
  USD: "DFEDTARU",
  GBP: "IRSTCI01GBM156N",
  AUD: "IRSTCI01AUM156N",
  JPY: "IRSTCB01JPM156N",
  NZD: "IRSTCI01NZM156N",
  CHF: "IRSTCI01CHM156N",
};

export async function GET(req: NextRequest) {
  const currency = req.nextUrl.searchParams.get("currency");
  if (!currency || !FRED_SERIES[currency]) {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }
  const data = await getCentralBankRate(FRED_SERIES[currency]);
  return NextResponse.json(data);
}

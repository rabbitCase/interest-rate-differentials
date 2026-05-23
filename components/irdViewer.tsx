"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { generateIrdTimeline } from "../lib/calculateIrd";
import { DataPoint } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const CURRENCIES = ["EUR", "USD", "GBP", "AUD", "JPY", "NZD", "CHF"];

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type TimeRange = "3M" | "6M" | "1Y" | "ALL";

const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "3M", value: "3M" },
  { label: "6M", value: "6M" },
  { label: "1Y", value: "1Y" },
  { label: "All", value: "ALL" },
];

function formatAxisDate(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${MONTH_ABBR[parseInt(month, 10) - 1]} '${year.slice(2)}`;
}

function formatTooltipDate(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return `${MONTH_ABBR[parseInt(month, 10) - 1]} ${year}`;
}

function sliceByTimeRange(
  data: { date: string; differential: number }[],
  range: TimeRange,
): { date: string; differential: number }[] {
  if (range === "ALL" || data.length === 0) return data;

  const monthsToSubtract = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  const latestDate = new Date(data[data.length - 1].date);

  const cutoffDate = new Date(latestDate);
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToSubtract);

  return data.filter((d) => new Date(d.date) >= cutoffDate);
}

function computeTickInterval(dataLength: number): number {
  if (dataLength <= 6) return 0;
  if (dataLength <= 12) return 1;
  if (dataLength <= 24) return 2;
  return Math.floor(dataLength / 10);
}

async function fetchCurrencyRate(currency: string): Promise<DataPoint[]> {
  const res = await fetch(`/api/rates?currency=${currency}`);
  if (!res.ok) throw new Error(`Failed to fetch ${currency}`);
  return res.json();
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value as number;
  const isPos = value >= 0;
  return (
    <div className="rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-muted-foreground mb-1">
        {formatTooltipDate(label)}
      </p>
      <p
        className={`text-sm font-semibold tabular-nums ${isPos ? "text-green-500" : "text-red-500"}`}
      >
        {value > 0 ? `+${value}` : value}%
      </p>
    </div>
  );
}

export default function IrdViewer() {
  const [base, setBase] = useState("EUR");
  const [quote, setQuote] = useState("USD");
  const [allIrdData, setAllIrdData] = useState<
    { date: string; differential: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDirection, setActiveDirection] = useState<"BUY" | "SELL" | null>(
    null,
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  async function handleTrade(direction: "BUY" | "SELL") {
    setLoading(true);
    setError(null);
    try {
      const baseData = await fetchCurrencyRate(base);
      const quoteData = await fetchCurrencyRate(quote);
      const result = generateIrdTimeline(baseData, quoteData, direction);
      setAllIrdData(result);
      setActiveDirection(direction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }

  const irdData = useMemo(
    () => sliceByTimeRange(allIrdData, timeRange),
    [allIrdData, timeRange],
  );

  const latestIrd = allIrdData.at(-1)?.differential ?? 0;
  const isPositive = latestIrd >= 0;
  const themeColor = isPositive ? "#22c55e" : "#ef4444"; // Adjusted for dark mode visibility
  const tickInterval = computeTickInterval(irdData.length);

  const yValues = irdData.map((d) => d.differential);
  const yMin = yValues.length ? Math.min(...yValues) : -1;
  const yMax = yValues.length ? Math.max(...yValues) : 1;
  const yPad = Math.max((yMax - yMin) * 0.15, 0.1);
  const yDomain = [
    Math.floor((yMin - yPad) * 10) / 10,
    Math.ceil((yMax + yPad) * 10) / 10,
  ];

  return (
    <div className="dark w-full border-2 border-blue-500 rounded-lg  max-w-4xl">
      <Card className="w-full bg-background text-foreground border-border">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Interest Rate Differential Viewer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <Label>Base Currency</Label>
              <Select value={base} onValueChange={setBase}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c} disabled={c === quote}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Quote Currency</Label>
              <Select value={quote} onValueChange={setQuote}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c} disabled={c === base}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <Label>Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={activeDirection === "BUY" ? "default" : "outline"}
                  onClick={() => handleTrade("BUY")}
                  disabled={loading}
                  className={
                    activeDirection === "BUY"
                      ? "bg-green-600 hover:bg-green-700 text-white border-transparent"
                      : ""
                  }
                >
                  BUY {base}/{quote}
                </Button>
                <Button
                  variant={activeDirection === "SELL" ? "default" : "outline"}
                  onClick={() => handleTrade("SELL")}
                  disabled={loading}
                  className={
                    activeDirection === "SELL"
                      ? "bg-red-600 hover:bg-red-700 text-white border-transparent"
                      : ""
                  }
                >
                  SELL {base}/{quote}
                </Button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Fetching rates…
            </p>
          )}

          {!loading && irdData.length > 0 && activeDirection && (
            <div className="space-y-4">
              <Card className="shadow-none border-muted bg-card/50">
                <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Current Net Carry Yield
                    </p>
                    <p
                      className={`text-3xl md:text-4xl font-black tabular-nums ${isPositive ? "text-green-500" : "text-red-500"}`}
                    >
                      {latestIrd > 0 ? `+${latestIrd}` : latestIrd}%
                    </p>
                  </div>
                  <div className="text-left space-y-1.5 w-full sm:w-auto">
                    <p className="text-xs text-muted-foreground">Formula</p>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs w-full sm:w-auto justify-center sm:justify-start"
                    >
                      {activeDirection === "BUY"
                        ? `${base} Rate − ${quote} Rate`
                        : `${quote} Rate − ${base} Rate`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-muted bg-card/50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Historical Yield Differential
                    </p>
                    <div className="flex flex-wrap gap-1 w-full sm:w-auto bg-muted/50 p-1 rounded-md">
                      {TIME_RANGE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setTimeRange(opt.value)}
                          className={`flex-1 sm:flex-none px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                            timeRange === opt.value
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-full md:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        key={timeRange}
                        data={irdData}
                        margin={{ top: 8, right: 9, left: -2, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="irdGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor={themeColor}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor={themeColor}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="2 4"
                          vertical={false}
                          stroke="#3f3f46" /* zinc-700 fallback */
                          strokeOpacity={0.4}
                        />
                        <XAxis
                          dataKey="date"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: "#a1a1aa",
                          }} /* zinc-400 explicit fill */
                          tickFormatter={formatAxisDate}
                          interval={tickInterval}
                          minTickGap={20}
                          dy={8}
                        />
                        <YAxis
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fill: "#a1a1aa",
                          }} /* zinc-400 explicit fill */
                          tickFormatter={(v) => `${v}%`}
                          domain={yDomain}
                          tickCount={6}
                          width={45}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{
                            stroke: "#52525b" /* zinc-600 fallback */,
                            strokeWidth: 1,
                            strokeDasharray: "4 4",
                          }}
                        />
                        <ReferenceLine
                          y={0}
                          stroke="#a1a1aa"
                          strokeDasharray="3 4"
                          strokeOpacity={0.5}
                          strokeWidth={1}
                        />
                        <Area
                          type="monotoneX"
                          dataKey="differential"
                          stroke={themeColor}
                          strokeWidth={2.5}
                          fill="url(#irdGradient)"
                          isAnimationActive={true}
                          animationDuration={400}
                          animationEasing="ease-out"
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0, fill: themeColor }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

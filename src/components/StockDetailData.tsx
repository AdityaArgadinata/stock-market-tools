import { useState, useEffect } from "react";

interface StockDetailDataProps {
  symbol: string;
  token: string;
}

interface StockDetailResponse {
  data: {
    change: number;
    close: number;
    country: string;
    domestic: string;
    down: string;
    exchange: string;
    fbuy: number;
    fnet: number;
    foreign: string;
    frequency: number;
    fsell: number;
    high: number;
    id: string;
    lastprice: number;
    low: number;
    open?: number;
    up?: string;
    unchanged?: string;
    value?: number;
    volume?: number;
    [key: string]: any;
  };
}

const StockDetailData = ({ symbol, token }: StockDetailDataProps) => {
  const [data, setData] = useState<StockDetailResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `https://exodus.stockbit.com/company-price-feed/v2/orderbook/companies/${symbol}?with_full_price_tick=false`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: StockDetailResponse = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Polling every 1 second
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, [symbol, token]);

  const formatNumber = (num: number | string | undefined): string => {
    if (num === undefined) return "0";
    const value = typeof num === "string" ? parseFloat(num) : num;
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const formatCurrency = (num: number | string | undefined): string => {
    if (num === undefined) return "0";
    const value = typeof num === "string" ? parseFloat(num) : num;
    const absValue = Math.abs(value);
    const isNegative = value < 0;

    let formatted: string;
    if (absValue >= 1000000000000) {
      formatted = (absValue / 1000000000000).toFixed(2) + "T";
    } else if (absValue >= 1000000000) {
      formatted = (absValue / 1000000000).toFixed(2) + "B";
    } else if (absValue >= 1000000) {
      formatted = (absValue / 1000000).toFixed(2) + "M";
    } else if (absValue >= 1000) {
      formatted = (absValue / 1000).toFixed(2) + "K";
    } else {
      formatted = absValue.toLocaleString("id-ID");
    }

    return isNegative ? `-${formatted}` : formatted;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-lg dark:text-slate-300">Loading stock details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-lg text-red-500 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-lg dark:text-slate-300">No data available</div>
      </div>
    );
  }

  const changePercent = data.close > 0 ? ((data.change / data.close) * 100).toFixed(2) : "0.00";
  const lotFormatted = data.volume ? formatCurrency(data.volume / 100) : "-";

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-2">
      {/* Header with stock name and price */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-slate-700">
        <div className="bg-gray-900 dark:bg-slate-700 text-white px-1.5 py-0.5 rounded font-bold text-xs">
          {symbol}
        </div>
        <div className="text-lg font-bold text-gray-900 dark:text-slate-100">
          {formatNumber(data.lastprice)}
        </div>
        <div
          className={`text-xs font-semibold ${
            data.change > 0
              ? "text-green-600 dark:text-emerald-400"
              : data.change < 0
              ? "text-red-600 dark:text-red-400"
              : "text-gray-600 dark:text-slate-400"
          }`}
        >
          {data.change > 0 ? "+" : ""}
          {formatNumber(data.change)} ({data.change > 0 ? "+" : ""}
          {changePercent}%)
        </div>
      </div>

      {/* Compact info grid */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
        {/* Left column */}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">Open</span>
          <span className="font-semibold text-green-600 dark:text-emerald-400">
            {data.open ? formatNumber(data.open) : formatNumber(data.close)}
          </span>
        </div>
        
        {/* Middle column */}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">Prev</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">
            {formatNumber(data.close)}
          </span>
        </div>
        
        {/* Right column */}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">Lot</span>
          <span className="font-semibold text-green-600 dark:text-emerald-400">{lotFormatted}</span>
        </div>

        {/* Row 2 */}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">High</span>
          <span className="font-semibold text-green-600 dark:text-emerald-400">
            {formatNumber(data.high)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">Freq</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">
            {formatNumber(data.frequency)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">Val</span>
          <span className="font-semibold text-green-600 dark:text-emerald-400">
            {data.value ? formatCurrency(data.value) : "-"}
          </span>
        </div>

        {/* Row 3 */}
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">Low</span>
          <span className="font-semibold text-red-600 dark:text-red-400">
            {formatNumber(data.low)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">F.Net</span>
          <span
            className={`font-semibold ${
              data.fnet > 0
                ? "text-green-600 dark:text-emerald-400"
                : data.fnet < 0
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-slate-400"
            }`}
          >
            {formatCurrency(data.fnet)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-slate-400">Avg</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">
            {data.average ? formatNumber(data.average) : formatNumber(data.lastprice)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StockDetailData;

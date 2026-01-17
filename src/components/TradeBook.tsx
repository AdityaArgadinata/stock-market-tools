import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TradeBookProps {
  symbol: string;
  token: string;
}

interface TradeItem {
  price: string;
  buy: {
    lot: string;
    frequency: string;
    percentage: string;
  };
  sell: {
    lot: string;
    frequency: string;
    percentage: string;
  };
  time: string;
  pre_open: {
    lot: string;
    frequency: string;
    percentage: string;
  };
  post_close: {
    lot: string;
    frequency: string;
    percentage: string;
  };
  total: {
    lot: string;
    frequency: string;
    percentage: string;
  };
}

interface BookTotal {
  buy_frequency: string;
  sell_frequency: string;
  buy_lot: string;
  sell_lot: string;
  buy_percentage: string;
  sell_percentage: string;
  total_frequency: string;
  total_lot: string;
  pre_lot: string;
  post_lot: string;
  pre_frequency: string;
  post_frequency: string;
}

interface TradeBookData {
  message: string;
  data: {
    book: TradeItem[];
    market_hour_steps: string[];
    book_total: BookTotal;
    is_show_pre_post: boolean;
    is_fca_stock: boolean;
  };
}

const TradeBook = ({ symbol, token }: TradeBookProps) => {
  const [data, setData] = useState<TradeBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"chart" | "price" | "time">("time");
  const [timeInterval, setTimeInterval] = useState("10m");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const groupByParam =
          viewMode === "price" ? "GROUP_BY_PRICE" : "GROUP_BY_TIME";
        let url = `https://exodus.stockbit.com/order-trade/trade-book?symbol=${symbol}&group_by=${groupByParam}&time_interval=${timeInterval}`;

        // Add date parameter if selected
        if (selectedDate) {
          url += `&date=${selectedDate}`;
        }

        console.log("Fetching URL:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API Response:", result);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, token, timeInterval, viewMode, selectedDate]);

  const parsePercentage = (percentage: string): number => {
    const num = parseInt(percentage.replace("%", ""));
    return isNaN(num) ? 0 : num;
  };

  const parseLot = (lot: string): number => {
    if (lot === "-" || !lot) return 0;
    return parseInt(lot.replace(/,/g, "")) || 0;
  };

  const handlePrevDate = () => {
    const currentDate = selectedDate ? new Date(selectedDate) : new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const handleNextDate = () => {
    const currentDate = selectedDate ? new Date(selectedDate) : new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const prepareChartData = () => {
    if (!data || !data.data.book) return [];

    let cumulativeBuy = 0;
    let cumulativeSell = 0;

    return data.data.book.map((item) => {
      const buyLot = parseLot(item.buy.lot);
      const sellLot = parseLot(item.sell.lot);

      cumulativeBuy += buyLot;
      cumulativeSell += sellLot;

      return {
        time: item.time,
        Buy: cumulativeBuy,
        Sell: cumulativeSell,
      };
    });
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)} K`;
    }
    return value.toString();
  };

  return (
    <div className="w-full trade-book bg-white dark:bg-slate-800 p-4 rounded-md shadow-md border border-gray-200 dark:border-slate-700 relative">
      {loading && (
        <div className="absolute inset-0 bg-slate-800 rounded-md flex justify-center items-center opacity-90 z-10">
          <div className="text-slate-300">Memuat data</div>
        </div>
      )}

      <div className="trade-book-header mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Trade Book
        </h2>

        <div className="filter-group flex gap-2 flex-wrap mb-4">
          <div className="button-group flex gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded ${
                viewMode === "chart"
                  ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setViewMode("chart")}
            >
              Chart
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded ${
                viewMode === "price"
                  ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setViewMode("price")}
            >
              Price
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded ${
                viewMode === "time"
                  ? "bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100"
                  : "text-slate-600 dark:text-slate-300"
              }`}
              onClick={() => setViewMode("time")}
            >
              Time
            </button>
          </div>
        </div>
        <div className="date-picker-group flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDate}
            className="px-3 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md border border-gray-300 dark:border-slate-600"
            title="Previous day"
          >
            ←
          </button>
          <input
            type="date"
            id="trade-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleNextDate}
            className="px-3 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md border border-gray-300 dark:border-slate-600"
            title="Next day"
          >
            →
          </button>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate("")}
              className="date-nav-button p-2 text-sm font-medium border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!data || data.data.book.length === 0 ? (
        <div className="w-full flex justify-center items-center mt-52">
          <div className="dark:text-slate-300">
            {error ? error : "Tidak ada data tersedia"}
          </div>
        </div>
      ) : (
        <>
          {viewMode === "chart" && (
            <div className="chart-container mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={prepareChartData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#94a3b8"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    stroke="#94a3b8"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: "6px",
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number | undefined) =>
                      value ? value.toLocaleString("id-ID") : "0"
                    }
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="Buy"
                    stroke="#14b8a6"
                    strokeWidth={3}
                    dot={false}
                    name="Buy"
                  />
                  <Line
                    type="monotone"
                    dataKey="Sell"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={false}
                    name="Sell"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {viewMode === "price" && (
            <div className="table-container overflow-x-auto">
              <table className="trade-book-table w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="p-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Price
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      T.Lot
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
                      T.Freq
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-teal-600 dark:text-teal-400">
                      B.Lot
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-teal-600 dark:text-teal-400">
                      B.Freq
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      S.Lot
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      S.Freq
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.book.map((item, index) => {
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <td className="p-2 text-sm text-teal-600 dark:text-teal-400 font-semibold">
                          {item.price || "-"}
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-slate-300">
                          {item.total.lot}
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-violet-400">
                          {item.total.frequency}
                        </td>
                        <td className="p-2 text-sm text-right text-teal-600 dark:text-teal-400 font-medium">
                          {item.buy.lot}
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-violet-400">
                          {item.buy.frequency}
                        </td>
                        <td className="p-2 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                          {item.sell.lot}
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-slate-300">
                          {item.sell.frequency}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Row */}
                  {data.data.book_total && (
                    <tr className="border-t-2 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 font-bold">
                      <td className="p-2 text-sm text-slate-800 dark:text-slate-300">
                        Total
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.total_lot}
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.total_frequency}
                      </td>
                      <td className="p-2 text-sm text-right text-teal-600 dark:text-teal-400">
                        {data.data.book_total.buy_lot}
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.buy_frequency}
                      </td>
                      <td className="p-2 text-sm text-right text-red-600 dark:text-red-400">
                        {data.data.book_total.sell_lot}
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.sell_frequency}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "time" && (
            <div className="table-container overflow-x-auto">
              <table className="trade-book-table w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-700">
                    <th className="p-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Time
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-teal-600 dark:text-teal-400">
                      Buy Lot
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-teal-600 dark:text-teal-400">
                      B.Freq
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-teal-600 dark:text-teal-400">
                      %Buy
                    </th>
                    <th className="p-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Chart
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      %Sell
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      S.Freq
                    </th>
                    <th className="p-2 text-right text-sm font-semibold text-red-600 dark:text-red-400">
                      Sell Lot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.book.map((item, index) => {
                    const buyPercent = parsePercentage(item.buy.percentage);
                    const sellPercent = parsePercentage(item.sell.percentage);

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <td className="p-2 text-sm text-slate-800 dark:text-slate-300">
                          {item.time}
                        </td>
                        <td className="p-2 text-sm text-right text-teal-600 dark:text-teal-400 font-medium">
                          {item.buy.lot}
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-violet-400">
                          {item.buy.frequency}
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-slate-300 font-bold">
                          {item.buy.percentage}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1 w-full">
                            {buyPercent > 0 && (
                              <div
                                className="h-4 bg-teal-500 rounded-l"
                                style={{ width: `${buyPercent}%` }}
                              ></div>
                            )}
                            {sellPercent > 0 && (
                              <div
                                className="h-4 bg-red-500 rounded-r"
                                style={{ width: `${sellPercent}%` }}
                              ></div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-slate-300 font-bold">
                          {item.sell.percentage}
                        </td>
                        <td className="p-2 text-sm text-right text-slate-700 dark:text-violet-400">
                          {item.sell.frequency}
                        </td>
                        <td className="p-2 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                          {item.sell.lot}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Row */}
                  {data.data.book_total && (
                    <tr className="border-t-2 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 font-bold">
                      <td className="p-2 text-sm text-slate-800 dark:text-slate-300">
                        Total
                      </td>
                      <td className="p-2 text-sm text-right text-teal-600 dark:text-teal-400">
                        {data.data.book_total.buy_lot}
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.buy_frequency}
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.buy_percentage}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1 w-full">
                          {parsePercentage(
                            data.data.book_total.buy_percentage
                          ) > 0 && (
                            <div
                              className="h-4 bg-teal-500 rounded-l"
                              style={{
                                width: `${parsePercentage(
                                  data.data.book_total.buy_percentage
                                )}%`,
                              }}
                            ></div>
                          )}
                          {parsePercentage(
                            data.data.book_total.sell_percentage
                          ) > 0 && (
                            <div
                              className="h-4 bg-red-500 rounded-r"
                              style={{
                                width: `${parsePercentage(
                                  data.data.book_total.sell_percentage
                                )}%`,
                              }}
                            ></div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.sell_percentage}
                      </td>
                      <td className="p-2 text-sm text-right text-slate-800 dark:text-slate-300">
                        {data.data.book_total.sell_frequency}
                      </td>
                      <td className="p-2 text-sm text-right text-red-600 dark:text-red-400">
                        {data.data.book_total.sell_lot}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TradeBook;

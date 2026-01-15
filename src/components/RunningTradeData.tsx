import { useState, useEffect, useRef } from "react";

interface RunningTradeDataProps {
  symbol: string;
  token: string;
}

const POLLING_INTERVAL = 1000;

const RunningTradeData = ({ symbol, token }: RunningTradeDataProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastTradeRef = useRef<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `https://exodus.stockbit.com/order-trade/running-trade?sort=DESC&limit=50&order_by=RUNNING_TRADE_ORDER_BY_TIME&symbols[]=${symbol}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(response.statusText);

      const result = await response.json();
      const newData = result?.data?.running_trade;

      if (!Array.isArray(newData) || newData.length === 0) return;

      const newestTime = newData[0].time;

      if (lastTradeRef.current === newestTime) return;

      lastTradeRef.current = newestTime;

      setData((prev) => {
        const merged = [...newData, ...prev];
        const unique = Array.from(
          new Map(merged.map((item) => [item.time, item])).values()
        );
        return unique.slice(0, 50);
      });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [symbol, token]);

  if (loading) return <div className="flex items-center justify-center p-6"><div className="text-lg dark:text-slate-300">Loading...</div></div>;
  if (error) return <div className="flex items-center justify-center p-6"><div className="text-lg text-red-500 dark:text-red-400">Error: {error}</div></div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold mb-2 dark:text-slate-100">Running Trade</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr className="text-center">
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Time</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Action</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Code</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Price</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Change</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Lot</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Market</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Buyer</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">Seller</th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {data.map((item) => (
              <tr
                key={item.time}
                className="text-center hover:bg-gray-50 dark:hover:bg-slate-700/30"
              >
                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 dark:text-slate-300">{item.time}</td>

                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded font-semibold uppercase ${
                      item.action === "buy" 
                        ? "bg-green-100 text-green-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {item.action}
                  </span>
                </td>

                <td
                  className={`px-2 py-1.5 whitespace-nowrap text-xs font-semibold ${
                    item.action === "buy" ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {item.code}
                </td>

                <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium dark:text-slate-200">{item.price}</td>

                <td className="px-2 py-1.5 whitespace-nowrap text-xs dark:text-slate-300">{item.change}</td>

                <td
                  className={`px-2 py-1.5 whitespace-nowrap text-xs font-semibold ${
                    item.action === "buy" ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {item.lot}
                </td>

                <td className="px-2 py-1.5 whitespace-nowrap">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                      item.market_board === "RG"
                        ? "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {item.market_board}
                  </span>
                </td>

                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 dark:text-slate-300">{item.buyer}</td>

                <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-700 dark:text-slate-300">{item.seller}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RunningTradeData;

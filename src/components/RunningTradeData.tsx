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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-full mx-auto">
      <table className="w-full border border-gray-200">
        <thead className="bg-gray-100 text-xs">
          <tr>
            <th className="px-4 py-2 border-b border-gray-200">Time</th>
            <th className="px-4 py-2 border-b border-gray-200">Action</th>
            <th className="px-4 py-2 border-b border-gray-200">Code</th>
            <th className="px-4 py-2 border-b border-gray-200">Price</th>
            <th className="px-4 py-2 border-b border-gray-200">Change</th>
            <th className="px-4 py-2 border-b border-gray-200">Lot</th>
            <th className="px-4 py-2 border-b border-gray-200">Market</th>
            <th className="px-4 py-2 border-b border-gray-200">Buyer</th>
            <th className="px-4 py-2 border-b border-gray-200">Seller</th>
          </tr>
        </thead>

        <tbody className="text-xs font-medium text-center">
          {data.map((item, index) => (
            <tr
              key={item.time}
              className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
            >
              <td className="border-b border-gray-200">{item.time}</td>

              <td
                className={`font-bold uppercase border-b border-gray-200 ${
                  item.action === "buy" ? "text-[#34a853]" : "text-[#ea4335]"
                }`}
              >
                {item.action}
              </td>

              <td
                className={`font-bold border-b border-gray-200 ${
                  item.action === "buy" ? "text-[#34a853]" : "text-[#ea4335]"
                }`}
              >
                {item.code}
              </td>

              <td className=" border-b border-gray-200">{item.price}</td>

              <td className=" border-b border-gray-200">{item.change}</td>

              <td
                className={`font-bold border-b border-gray-200 ${
                  item.action === "buy" ? "text-[#34a853]" : "text-[#ea4335]"
                }`}
              >
                {item.lot}
              </td>

              <td
                className={`py-1 border-b border-gray-200 ${
                  item.market_board === "RG"
                    ? "text-[#3a3a3a]"
                    : "text-yellow-500"
                }`}
              >
                {item.market_board}
              </td>

              <td className="py-1 border-b border-gray-200">{item.buyer}</td>

              <td className="py-1 border-b border-gray-200">{item.seller}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RunningTradeData;

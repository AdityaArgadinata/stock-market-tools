import { useState, useEffect } from 'react';

interface RunningTradeDataProps {
  symbol: string;
  token: string;
}

const RunningTradeData = ({ symbol, token }: RunningTradeDataProps) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://exodus.stockbit.com/order-trade/running-trade?sort=DESC&limit=50&order_by=RUNNING_TRADE_ORDER_BY_TIME&symbols[]=${symbol}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result && result.data && result.data.running_trade && Array.isArray(result.data.running_trade)) {
          setData(result.data.running_trade);
        } else {
          setError('Invalid response data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-full mx-auto">
      <h2 className="text-sm font-bold mb-4">Running Trade Data for {symbol}</h2>
      <table className="w-full border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-1 border-b border-gray-200">Time</th>
            <th className="px-4 py-1 border-b border-gray-200">Action</th>
            <th className="px-4 py-1 border-b border-gray-200">Code</th>
            <th className="px-4 py-1 border-b border-gray-200">Price</th>
            <th className="px-4 py-1 border-b border-gray-200">Change</th>
            <th className="px-4 py-1 border-b border-gray-200">Lot</th>
            <th className="px-4 py-1 border-b border-gray-200">Buyer</th>
            <th className="px-4 py-1 border-b border-gray-200">Seller</th>
          </tr>
        </thead>
        <tbody className='text-sm font-medium text-center'>
          {data.map((item: any, index: number) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-4 py-1 border-b border-gray-200">{item.time}</td>
              <td className={`px-4 py-1 border-b border-gray-200 ${item.action === 'buy' ? 'text-[#34a853]' : 'text-[#ea4335]'}`}>
                {item.action}
              </td>
              <td className={`px-4 py-1 border-b border-gray-200 ${item.action === 'buy' ? 'text-[#34a853]' : 'text-red-500'}`}>
                {item.code}
              </td>
              <td className="px-4 py-1 border-b border-gray-200">{item.price}</td>
              <td className="px-4 py-1 border-b border-gray-200">{item.change}</td>
              <td className="px-4 py-1 border-b border-gray-200">{item.lot}</td>
              <td className="px-4 py-1 border-b border-gray-200">{item.buyer}</td>
              <td className="px-4 py-1 border-b border-gray-200">{item.seller}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RunningTradeData;


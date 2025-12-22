import StockData from "../components/StockData";
import RunningTradeData from "../components/RunningTradeData";
import { useStockSymbol } from "../context/StockSymbolContext";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function Home() {
  const { symbol } = useStockSymbol();

  return (
    <div className="max-w-7xl mx-auto pt-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h1 className="text-2xl font-bold">
          Stock Summary — {symbol}
        </h1>
      </div>

      <div className="flex gap-6">
        <StockData symbol={symbol} token={BEARER_TOKEN} />
        <RunningTradeData symbol={symbol} token={BEARER_TOKEN} />
      </div>
    </div>
  );
}

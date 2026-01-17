import RunningTradeData from "../components/RunningTradeData";
import StockDetailData from "../components/StockDetailData";
import TradeBook from "../components/TradeBook";
import { useStockSymbol } from "../context/StockSymbolContext";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function Volume() {
  const { symbol } = useStockSymbol();

  return (
    <div className="pt-8 px-4">
      <div className="flex gap-3 items-start">
        <div className="space-y-3">
          <StockDetailData symbol={symbol} token={BEARER_TOKEN} />
          <RunningTradeData symbol={symbol} token={BEARER_TOKEN} />
        </div>
        <TradeBook symbol={symbol} token={BEARER_TOKEN} />
      </div>
    </div>
  );
}

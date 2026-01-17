import StockData from "../components/StockData";
import TradingViewWidget from "../components/TradingViewChart";
import { useStockSymbol } from "../context/StockSymbolContext";
import StockDetailData from "../components/StockDetailData";
import TradeBook from "../components/TradeBook";
import InsiderActivity from "../components/InsiderActivity";
const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function Home() {
  const { symbol } = useStockSymbol();
  return (
    <div className="pt-8 px-4 overflow-x-auto">
      <div className="flex gap-6">
        <div
          className="shrink-0 overflow-y-auto"
          style={{ width: "600px", height: "800px" }}
        >
          <div className="mb-6">
            <StockDetailData symbol={symbol} token={BEARER_TOKEN} />
            <StockData symbol={symbol} token={BEARER_TOKEN} />
          </div>
        </div>
        <div className="shrink-0" style={{ width: "800px", height: "800px" }}>
          <TradingViewWidget symbol={symbol} />
        </div>
        <div
          className="shrink-0 overflow-y-auto"
          style={{ width: "600px", height: "800px" }}
        >
          <TradeBook symbol={symbol} token={BEARER_TOKEN} />
        </div>
        <div
          className="shrink-0 overflow-y-auto"
          style={{ width: "900px", height: "800px" }}
        >
          <InsiderActivity symbol={symbol} token={BEARER_TOKEN} />
        </div>
      </div>
    </div>
  );
}

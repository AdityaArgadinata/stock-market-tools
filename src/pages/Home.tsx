import StockData from "../components/StockData";
import TradingViewWidget from "../components/TradingViewChart";
import { useStockSymbol } from "../context/StockSymbolContext";
import StockDetailData from "../components/StockDetailData";
const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function Home() {
  const { symbol } = useStockSymbol();
  return (
    <div className="pt-8 px-4">
      <div className="flex gap-6">
        <div>
          <div className="mb-6">
            <StockDetailData symbol={symbol} token={BEARER_TOKEN} />
          </div>
          <StockData symbol={symbol} token={BEARER_TOKEN} />
        </div>
        <div style={{ height: "800px", width: "100%" }}>
          <TradingViewWidget symbol={symbol} />
        </div>
      </div>
    </div>
  );
}

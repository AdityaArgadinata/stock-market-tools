import StockDetailData from "../components/StockDetailData";
import { useStockSymbol } from "../context/StockSymbolContext";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function Volume() {
  const { symbol } = useStockSymbol();

  return (
    <div className="pt-8 px-4">
      <StockDetailData symbol={symbol} token={BEARER_TOKEN} />
    </div>
  );
}
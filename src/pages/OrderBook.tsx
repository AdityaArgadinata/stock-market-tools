import OrderBookData from "../components/OrderBookData";
import { useStockSymbol } from "../context/StockSymbolContext";
import StockDetailData from "../components/StockDetailData";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function OrderBook() {
  const { symbol } = useStockSymbol();

  return (
    <div className="pt-8 px-4">
      <StockDetailData symbol={symbol} token={BEARER_TOKEN} />
      <OrderBookData symbol={symbol} token={BEARER_TOKEN} />
    </div>
  );
}

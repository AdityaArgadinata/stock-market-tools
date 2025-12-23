import OrderBookData from "../components/OrderBookData";
import { useStockSymbol } from "../context/StockSymbolContext";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function OrderBook() {
  const { symbol } = useStockSymbol();

  return (
    <div className="pt-8 px-4">
      <OrderBookData symbol={symbol} token={BEARER_TOKEN} />
    </div>
  );
}

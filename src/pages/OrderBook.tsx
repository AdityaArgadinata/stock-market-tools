import OrderBookData from "../components/OrderBookData";
import { useStockSymbol } from "../context/StockSymbolContext";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

export default function OrderBook() {
  const { symbol } = useStockSymbol();

  return (
    <div>
      <p>teest - {symbol}</p>
      <OrderBookData symbol={symbol} token={BEARER_TOKEN} />
    </div>
  );
}

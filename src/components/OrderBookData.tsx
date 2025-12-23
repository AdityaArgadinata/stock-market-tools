import { useEffect, useMemo, useState, Fragment } from "react";
import RunningTradeData from "./RunningTradeData";

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN;

/* ================= TYPES ================= */
interface OrderBookItem {
  price: number;
  que_num: string;
  volume: number;
}

interface OrderBookQueueItem {
  id: string;
  queue_number: string;
  action_type: "ACTION_TYPE_BUY" | "ACTION_TYPE_SELL";
  price: number;
  lot: number;
  open: number;
  queue_lot: number;
  status: string;
}

interface OrderBookDataType {
  average: number;
  open: number;
  bid: OrderBookItem[];
  offer: OrderBookItem[];
}

interface OrderBookResponse {
  data: OrderBookDataType;
}

interface OrderBookRow {
  bid: OrderBookItem | null;
  offer: OrderBookItem | null;
}

interface OrderBookProps {
  symbol: string;
  token: string;
}

/* ================= MAIN ================= */
export default function OrderBookData({ symbol, token }: OrderBookProps) {
  const [data, setData] = useState<OrderBookDataType | null>(null);
  const [queueMap, setQueueMap] = useState<Record<string, OrderBookQueueItem[]>>({});
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ORDERBOOK (1s) ================= */
  useEffect(() => {
    let alive = true;

    const fetchOrderBook = async () => {
      try {
        const res = await fetch(
          `https://exodus.stockbit.com/company-price-feed/v2/orderbook/companies/${symbol}?with_full_price_tick=false`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json: OrderBookResponse = await res.json();
        if (alive) {
          setData(json.data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching order book:", error);
      }
    };

    fetchOrderBook();
    const intervalId = setInterval(fetchOrderBook, 1000);

    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, [symbol, token]);

  /* ================= NORMALIZE ROWS ================= */
  const rows: OrderBookRow[] = useMemo(() => {
    if (!data) return [];
    const maxLength = Math.max(data.bid.length, data.offer.length);
    return Array.from({ length: maxLength }, (_, index) => ({
      bid: data.bid[index] ?? null,
      offer: data.offer[index] ?? null,
    }));
  }, [data]);

  /* ================= FETCH QUEUE (TOP 3 ONLY | 1s) ================= */
  useEffect(() => {
    if (!data || rows.length === 0) return;
    let alive = true;

    const targets: { price: number; side: "BUY" | "SELL" }[] = [];
    rows.slice(0, 3).forEach((row) => {
      if (row.bid?.price) targets.push({ price: row.bid.price, side: "BUY" });
      if (row.offer?.price) targets.push({ price: row.offer.price, side: "SELL" });
    });

    const fetchQueues = async () => {
      const newMap: Record<string, OrderBookQueueItem[]> = {};
      await Promise.all(
        targets.map(async ({ price, side }) => {
          try {
            const res = await fetch(
              `https://exodus.stockbit.com/order-trade/order-queue?stock_code=${symbol}&action_type=${
                side === "BUY" ? "ACTION_TYPE_BUY" : "ACTION_TYPE_SELL"
              }&board_type=BOARD_TYPE_REGULAR&order_status=ORDER_STATUS_OPEN&limit=50&price=${price}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const json = await res.json();
            newMap[`${side}-${price}`] = (json?.data?.orders ?? [])
              .sort((a: OrderBookQueueItem, b: OrderBookQueueItem) => b.lot - a.lot)
              .slice(0, 5);
          } catch (error) {
            console.error(`Error fetching queue for ${side}-${price}:`, error);
          }
        })
      );
      if (alive) setQueueMap(newMap);
    };

    fetchQueues();
    const intervalId = setInterval(fetchQueues, 1000);

    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, [rows, data, symbol, token]);

  if (loading || !data) return <p>Loading...</p>;

  /* ================= RENDER ================= */
  return (
    <div className="p-4">
      <h2 className="font-bold mb-3">
        Order Book — {symbol} | Open {data.open}
      </h2>
      <div className="">
        <div className="flex gap-4">
          {/* ================= LEFT: ORDER BOOK FULL (Independent) ================= */}
          <div className="orderbook-left">
            <table className="text-sm border border-gray-300 w-sm table-fixed">
              <thead>
                <tr className="bg-gray-100 text-center font-semibold">
                  <th className="w-8 px-0.5 py-0.5">Freq</th>
                  <th className="w-12 px-0.5 py-0.5">Lot</th>
                  <th className="w-12 px-0.5 py-0.5">Bid</th>
                  <th className="w-12 px-0.5 py-0.5">Offer</th>
                  <th className="w-12 px-0.5 py-0.5">Lot</th>
                  <th className="w-8 px-0.5 py-0.5">Freq</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {rows.map((row, index) => (
                  <OrderBookRowItem key={index} row={row} open={data.open} />
                ))}
              </tbody>
            </table>
          </div>

          {/* ================= RIGHT: TOP 3 + QUEUE TREE (Independent) ================= */}
          <div className="orderbook-right">
            <table className="text-sm border border-gray-300 w-lg">
              <thead>
                <tr className="bg-gray-100 text-center font-semibold">
                  <th colSpan={8} className="px-0.5 py-0.5">TOP 3 PRICE + ORDER QUEUE</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {rows.slice(0, 3).map((row, index) => {
                  const bidQueue = queueMap[`BUY-${row.bid?.price}`] ?? [];
                  const offerQueue = queueMap[`SELL-${row.offer?.price}`] ?? [];
                  const maxQueueLength = Math.max(bidQueue.length, offerQueue.length);

                  return (
                    <Fragment key={index}>
                      {/* ===== PRICE ROW (with adjusted colspan for 8 columns) ===== */}
                      <tr className="border font-semibold text-center bg-gray-50">
                        <td className="px-0.5 py-0.5">{row.bid?.que_num ?? "-"}</td>
                        <td className="px-0.5 py-0.5">{row.bid ? (row.bid.volume / 100).toLocaleString() : "-"}</td>
                        <td colSpan={2} className="px-0.5 py-0.5">{row.bid?.price ?? "-"}</td>
                        <td colSpan={2} className="px-0.5 py-0.5">{row.offer?.price ?? "-"}</td>
                        <td className="px-0.5 py-0.5">{row.offer ? (row.offer.volume / 100).toLocaleString() : "-"}</td>
                        <td className="px-0.5 py-0.5">{row.offer?.que_num ?? "-"}</td>
                      </tr>

                      {/* ===== PRICE LABEL ===== */}
                      <tr className="text-center font-semibold bg-gray-100">
                        <td colSpan={4} className="text-green-600 px-0.5 py-0.5">
                          BID @ {row.bid?.price ?? "-"}
                        </td>
                        <td colSpan={4} className="text-red-600 px-0.5 py-0.5">
                          OFFER @ {row.offer?.price ?? "-"}
                        </td>
                      </tr>

                      {/* ===== QUEUE HEADER ===== */}
                      <tr className="bg-gray-100 text-center font-semibold">
                        <th className="w-8 px-0.5 py-0.5">#</th>
                        <th className="w-12 px-0.5 py-0.5">Lot</th>
                        <th className="w-12 px-0.5 py-0.5">Sisa</th>
                        <th className="w-16 px-0.5 py-0.5">Status</th>
                        <th className="w-8 px-0.5 py-0.5">#</th>
                        <th className="w-12 px-0.5 py-0.5">Lot</th>
                        <th className="w-12 px-0.5 py-0.5">Sisa</th>
                        <th className="w-16 px-0.5 py-0.5">Status</th>
                      </tr>

                      {/* ===== QUEUE ROWS (LEFT RIGHT) ===== */}
                      {Array.from({ length: maxQueueLength }).map((_, queueIndex) => {
                        const bidItem = bidQueue[queueIndex];
                        const offerItem = offerQueue[queueIndex];

                        return (
                          <tr key={queueIndex} className="text-center border-b">
                            {/* ===== BID ===== */}
                            <td className="bg-green-50 px-0.5 py-0.5">
                              {bidItem ? `#${bidItem.queue_number}` : "-"}
                            </td>
                            <td className="bg-green-50 px-0.5 py-0.5">
                              {bidItem ? bidItem.lot.toLocaleString() : "-"}
                            </td>
                            <td className="bg-green-50 px-0.5 py-0.5">
                              {bidItem ? (bidItem.open).toLocaleString() : "-"}
                            </td>
                            <td className="bg-green-50 px-0.5 py-0.5 lowercase">
                              {bidItem ? bidItem.status.replace("ORDER_STATUS_", "") : "-"}
                            </td>
                            {/* ===== OFFER ===== */}
                            <td className="bg-red-50 px-0.5 py-0.5">
                              {offerItem ? `#${offerItem.queue_number}` : "-"}
                            </td>
                            <td className="bg-red-50 px-0.5 py-0.5">
                              {offerItem ? offerItem.lot.toLocaleString() : "-"}
                            </td>
                            <td className="bg-red-50 px-0.5 py-0.5">
                              {offerItem ? (offerItem.open).toLocaleString() : "-"}
                            </td>
                            <td className="bg-red-50 px-0.5 py-0.5 lowercase">
                              {offerItem ? offerItem.status.replace("ORDER_STATUS_", "") : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
                           <RunningTradeData symbol={symbol} token={BEARER_TOKEN} />
        </div>
      </div>
    </div>
  );
}

/* ================= ROW COMPONENTS ================= */
function OrderBookRowItem({ row, open }: { row: OrderBookRow; open: number }) {
  const getColor = (price?: number) => {
    if (!price) return "text-gray-400";
    if (price === open) return "text-yellow-500";
    return price < open ? "text-red-500" : "text-green-600";
  };

  return (
    <tr className="border text-center">
      <td className="px-0.5 py-0.5">{row.bid?.que_num ?? "-"}</td>
      <td className="px-0.5 py-0.5">{row.bid ? (row.bid.volume / 100).toLocaleString() : "-"}</td>
      <td className={`${getColor(row.bid?.price)} px-0.5 py-0.5`}>{row.bid?.price ?? "-"}</td>
      <td className={`${getColor(row.offer?.price)} px-0.5 py-0.5`}>{row.offer?.price ?? "-"}</td>
      <td className="px-0.5 py-0.5">{row.offer ? (row.offer.volume / 100).toLocaleString() : "-"}</td>
      <td className="px-0.5 py-0.5">{row.offer?.que_num ?? "-"}</td>
    </tr>
  );
}
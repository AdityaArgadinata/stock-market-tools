import { useEffect, useMemo, useState } from "react";
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
  const [queueMap, setQueueMap] = useState<
    Record<string, OrderBookQueueItem[]>
  >({});
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
      if (row.offer?.price)
        targets.push({ price: row.offer.price, side: "SELL" });
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
              .sort(
                (a: OrderBookQueueItem, b: OrderBookQueueItem) => b.lot - a.lot
              )
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
    <div className="container mx-auto mt-5">
      <div className="">
        <div className="flex gap-4">
          {/* ================= LEFT: ORDER BOOK FULL (Independent) ================= */}
          <div className="orderbook-left bg-white rounded-lg shadow-md p-3">
            <h3 className="text-sm font-semibold mb-2">Full Order Book</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="text-center">
                    <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Freq
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Lot
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Bid
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Offer
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Lot
                    </th>
                    <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Freq
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row, index) => (
                    <OrderBookRowItem key={index} row={row} open={data.open} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= RIGHT: TOP 3 + QUEUE TREE (Independent) ================= */}
          <div className="orderbook-right flex flex-col gap-4">
            {/* ===== TABLE 1: PRICE OVERVIEW (6 columns, clean) ===== */}
            <div className="bg-white rounded-lg shadow-md p-3">
              <h3 className="text-sm font-semibold mb-2">
                Top 3 Price Overview
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr className="text-center">
                      <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Bid Freq
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">
                        Bid Lot
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Bid Price
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Offer Price
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">
                        Offer Lot
                      </th>
                      <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                        Offer Freq
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.slice(0, 3).map((row, index) => {
                      const getPriceColor = (price?: number) => {
                        if (!price) return "text-gray-500";
                        const open = data?.open ?? 0;
                        if (price === open) return "text-yellow-600";
                        return price < open ? "text-red-600" : "text-green-600";
                      };

                      return (
                        <tr
                          key={index}
                          className="text-center hover:bg-gray-50"
                        >
                          <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                            {row.bid?.que_num ?? "-"}
                          </td>
                          <td className="px-2 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                            {row.bid
                              ? (row.bid.volume / 100).toLocaleString()
                              : "-"}
                          </td>
                          <td
                            className={`px-2 py-1.5 whitespace-nowrap text-xs font-semibold ${getPriceColor(
                              row.bid?.price
                            )}`}
                          >
                            {row.bid?.price ?? "-"}
                          </td>
                          <td
                            className={`px-2 py-1.5 whitespace-nowrap text-xs font-semibold ${getPriceColor(
                              row.offer?.price
                            )}`}
                          >
                            {row.offer?.price ?? "-"}
                          </td>
                          <td className="px-2 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                            {row.offer
                              ? (row.offer.volume / 100).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                            {row.offer?.que_num ?? "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== TABLE 2: ORDER QUEUE DETAIL (8 columns, side-by-side) ===== */}
            <div className="bg-white rounded-lg shadow-md p-3">
              <h3 className="text-sm font-semibold mb-2">
                Order Queue Detail (Top 5 per Price)
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {rows.slice(0, 3).map((row, index) => {
                  const bidQueue = queueMap[`BUY-${row.bid?.price}`] ?? [];
                  const offerQueue = queueMap[`SELL-${row.offer?.price}`] ?? [];
                  const maxQueueLength = Math.max(
                    bidQueue.length,
                    offerQueue.length
                  );

                  if (maxQueueLength === 0) return null;

                  return (
                    <div
                      key={index}
                      className={index > 0 ? "border-t-2 border-gray-300" : ""}
                    >
                      {/* Price Label */}
                      <div className="flex bg-gray-50">
                        <div className="flex-1 text-center py-1.5 font-semibold text-xs text-green-700 border-r border-gray-200">
                          BID @ {row.bid?.price ?? "-"}
                        </div>
                        <div className="flex-1 text-center py-1.5 font-semibold text-xs text-red-700">
                          OFFER @ {row.offer?.price ?? "-"}
                        </div>
                      </div>

                      {/* Queue Table */}
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr className="text-center">
                            <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">
                              Lot
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">
                              Sisa
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-2 py-1.5 border-l border-gray-200 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">
                              Lot
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">
                              Sisa
                            </th>
                            <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.from({ length: maxQueueLength }).map(
                            (_, queueIndex) => {
                              const bidItem = bidQueue[queueIndex];
                              const offerItem = offerQueue[queueIndex];

                              return (
                                <tr
                                  key={queueIndex}
                                  className="text-center hover:bg-gray-50"
                                >
                                  {/* ===== BID ===== */}
                                  <td className="bg-green-50/40 px-2 py-1.5 whitespace-nowrap text-xs">
                                    {bidItem ? `#${bidItem.queue_number}` : "-"}
                                  </td>
                                  <td className="bg-green-50/40 px-2 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                                    {bidItem
                                      ? bidItem.lot.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="bg-green-50/40 px-2 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                                    {bidItem
                                      ? bidItem.open.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="bg-green-50/40 px-2 py-1.5 whitespace-nowrap">
                                    {bidItem ? (
                                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-800">
                                        {bidItem.status.replace(
                                          "ORDER_STATUS_",
                                          ""
                                        )}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  {/* ===== OFFER ===== */}
                                  <td className="bg-red-50/40 px-2 py-1.5 whitespace-nowrap border-l border-gray-200 text-xs">
                                    {offerItem
                                      ? `#${offerItem.queue_number}`
                                      : "-"}
                                  </td>
                                  <td className="bg-red-50/40 px-2 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                                    {offerItem
                                      ? offerItem.lot.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="bg-red-50/40 px-2 py-1.5 whitespace-nowrap text-right text-xs font-medium">
                                    {offerItem
                                      ? offerItem.open.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="bg-red-50/40 px-2 py-1.5 whitespace-nowrap">
                                    {offerItem ? (
                                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-100 text-red-800">
                                        {offerItem.status.replace(
                                          "ORDER_STATUS_",
                                          ""
                                        )}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
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
    if (price === open) return "text-yellow-600";
    return price < open ? "text-red-600" : "text-green-600";
  };

  return (
    <tr className="text-center hover:bg-gray-50">
      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
        {row.bid?.que_num ?? "-"}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium">
        {row.bid ? (row.bid.volume / 100).toLocaleString() : "-"}
      </td>
      <td
        className={`${getColor(
          row.bid?.price
        )} px-2 py-1.5 whitespace-nowrap text-xs font-semibold`}
      >
        {row.bid?.price ?? "-"}
      </td>
      <td
        className={`${getColor(
          row.offer?.price
        )} px-2 py-1.5 whitespace-nowrap text-xs font-semibold`}
      >
        {row.offer?.price ?? "-"}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium">
        {row.offer ? (row.offer.volume / 100).toLocaleString() : "-"}
      </td>
      <td className="px-2 py-1.5 whitespace-nowrap text-xs">
        {row.offer?.que_num ?? "-"}
      </td>
    </tr>
  );
}

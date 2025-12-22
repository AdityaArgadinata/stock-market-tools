import { useEffect, useMemo, useState } from "react";

/* ================= TYPES ================= */
interface OrderBookItem {
  price: number;
  que_num: string;
  volume: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchOrderBook = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://exodus.stockbit.com/company-price-feed/v2/orderbook/companies/${symbol}?with_full_price_tick=false`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const result: OrderBookResponse = await response.json();
        setData(result.data);
      } catch {
        setError("Gagal mengambil data order book");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderBook();
  }, [symbol, token]);

  /* ================= ROW NORMALIZE ================= */
  const rows: OrderBookRow[] = useMemo(() => {
    if (!data) return [];
    const max = Math.max(data.bid.length, data.offer.length);

    return Array.from({ length: max }, (_, i) => ({
      bid: data.bid[i] ?? null,
      offer: data.offer[i] ?? null,
    }));
  }, [data]);

  /* ================= TOTAL ================= */
  const totalBidLot =
    data?.bid.reduce((sum, i) => sum + Number(i.volume) / 100, 0) ?? 0;

  const totalOfferLot =
    data?.offer.reduce((sum, i) => sum + Number(i.volume) / 100, 0) ?? 0;

  const totalBidFreq =
    data?.bid.reduce((sum, i) => sum + Number(i.que_num), 0) ?? 0;

  const totalOfferFreq =
    data?.offer.reduce((sum, i) => sum + Number(i.que_num), 0) ?? 0;

  if (loading) return <p>Loading order book...</p>;
  if (error || !data) return <p className="text-red-500">{error}</p>;

  /* ================= RENDER ================= */
  return (
    <div className="bg-white rounded-lg shadow p-4 max-w-md">
      <h2 className="font-bold mb-1">Order Book — {symbol}</h2>

      <p className="text-sm text-gray-500 mb-3">
        Average: <b>{data.average}</b> | Open:{" "}
        <b className="text-yellow-500">{data.open}</b>
      </p>

      <table className="w-full text-sm border border-gray-200">
        <thead>
          <tr className="h-8 bg-gray-100 text-center font-semibold">
            <th>Freq</th>
            <th>Lot</th>
            <th>Bid</th>
            <th>Offer</th>
            <th>Lot</th>
            <th>Freq</th>
          </tr>
        </thead>

        <tbody className="text-xs">
          {rows.map((row, i) => (
            <OrderBookRowItem key={i} row={row} open={data.open} />
          ))}

          {/* TOTAL */}
          <tr className="border-t bg-gray-50 font-semibold text-center">
            <td className="p-1 border border-gray-300">
              {totalBidFreq.toLocaleString()}
            </td>
            <td className="p-1 border border-gray-300">
              {totalBidLot.toLocaleString()}
            </td>
            <td className="p-1 border border-gray-300">TOTAL</td>
            <td className="p-1 border border-gray-300">TOTAL</td>
            <td className="p-1 border border-gray-300">
              {totalOfferLot.toLocaleString()}
            </td>
            <td className="p-1 border border-gray-300">
              {totalOfferFreq.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ================= ROW ================= */
function OrderBookRowItem({ row, open }: { row: OrderBookRow; open: number }) {
  const bidPrice = row.bid?.price;
  const offerPrice = row.offer?.price;

  const getPriceColor = (price?: number, open?: number) => {
    if (price == null || open == null) return "text-gray-400";
    if (price == open) return "text-yellow-500";
    if (price < open) return "text-red-500";
    return "text-green-600";
  };

  return (
    <tr className="text-xs border border-gray-300 text-center">
      <td className="border border-gray-300 p-[0.5px] text-blue-500">{row.bid?.que_num ?? "-"}</td>

      <td className="border border-gray-300 p-[0.5px]">
        {row.bid ? (row.bid.volume / 100).toLocaleString() : "-"}
      </td>

      <td
        className={`border border-gray-300 p-[0.5px] font-semibold ${getPriceColor(bidPrice, open)}`}
      >
        {bidPrice ?? "-"}
      </td>

      <td
        className={`border border-gray-300 p-[0.5px] font-semibold ${getPriceColor(offerPrice, open)}`}
      >
        {offerPrice ?? "-"}
      </td>

      <td className="border border-gray-300 p-[0.5px]">
        {row.offer ? (row.offer.volume / 100).toLocaleString() : "-"}
      </td>

      <td className="border border-gray-300 p-[0.5px] text-blue-500">{row.offer?.que_num ?? "-"}</td>
    </tr>
  );
}

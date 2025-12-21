import { useState, useEffect } from "react";

interface StockDataProps {
  symbol: string;
  token: string;
}

interface BrokerItem {
  netbs_broker_code?: string;
  bval?: string | number;
  blot?: string | number;
  netbs_buy_avg_price?: string | number;
  sval?: string | number;
  slot?: string | number;
  netbs_sell_avg_price?: string | number;
  [key: string]: any;
}

interface BrokerSummary {
  brokers_buy?: BrokerItem[];
  brokers_sell?: BrokerItem[];
  [key: string]: any;
}

interface MarketData {
  message?: string;
  data?: {
    broker_summary?: BrokerSummary;
    bandar_detector?: any;
    [key: string]: any;
  };
  broker_summary?: BrokerSummary;
  [key: string]: any;
}

interface TableRow {
  buyerCode: string;
  buyerValue: number;
  buyerLot: number;
  buyerAvg: number;
  sellerCode: string;
  sellerValue: number;
  sellerLot: number;
  sellerAvg: number;
  buyerItem?: BrokerItem;
  sellerItem?: BrokerItem;
}

const StockData = ({ symbol, token }: StockDataProps) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investorType, setInvestorType] = useState("INVESTOR_TYPE_ALL");
  const [transactionType, setTransactionType] = useState(
    "TRANSACTION_TYPE_NET"
  );
  const [sortBy, setSortBy] = useState<"buyValue" | "sellValue" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Date state - default to today
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };
  const [dateFrom, setDateFrom] = useState(getTodayDate());
  const [dateTo, setDateTo] = useState(getTodayDate());

  // Date navigation functions
  const handleDatePrev = () => {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    fromDate.setDate(fromDate.getDate() - 1);
    toDate.setDate(toDate.getDate() - 1);

    setDateFrom(fromDate.toISOString().split("T")[0]);
    setDateTo(toDate.toISOString().split("T")[0]);
  };

  const handleDateNext = () => {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    fromDate.setDate(fromDate.getDate() + 1);
    toDate.setDate(toDate.getDate() + 1);

    setDateFrom(fromDate.toISOString().split("T")[0]);
    setDateTo(toDate.toISOString().split("T")[0]);
  };

  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build URL with date range and filter parameters
        const url = `https://exodus.stockbit.com/marketdetectors/${symbol}?from=${dateFrom}&to=${dateTo}&transaction_type=${transactionType}&market_board=MARKET_BOARD_REGULER&investor_type=${investorType}&limit=25`;

        console.log("Fetching URL:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("API Response:", result);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, token, investorType, transactionType, dateFrom, dateTo]);

  const formatNumber = (num: number): string => {
    if (num === 0) return "0";

    const isNegative = num < 0;
    const absNum = Math.abs(num);

    let formatted: string;

    if (absNum >= 1000000000) {
      const value = absNum / 1000000000;
      formatted =
        value % 1 === 0 ? value.toFixed(0) + "B" : value.toFixed(1) + "B";
    } else if (absNum >= 1000000) {
      const value = absNum / 1000000;
      formatted =
        value % 1 === 0 ? value.toFixed(0) + "M" : value.toFixed(1) + "M";
    } else if (absNum >= 1000) {
      const value = absNum / 1000;
      formatted =
        value % 1 === 0 ? value.toFixed(0) + "K" : value.toFixed(1) + "K";
    } else {
      formatted = absNum.toLocaleString("id-ID");
    }

    return isNegative ? "" + formatted : formatted;
  };

  const formatCurrency = (num: number): string => {
    const rounded = Math.round(num);
    return rounded.toLocaleString("id-ID");
  };

  const getSymbolColor = (
    brokerItem: BrokerItem | undefined,
    type: "buy" | "sell"
  ): string => {
    if (!brokerItem) return type === "buy" ? "green" : "red";

    const investorType = brokerItem.type;

    if (investorType === "Asing") {
      return "red";
    } else if (investorType === "Lokal") {
      return "purple";
    } else if (investorType === "Pemerintah") {
      return "green";
    }

    return type === "buy" ? "green" : "red";
  };

  const parseScientificNotation = (val: string | number): number => {
    if (typeof val === "number") return val;
    if (typeof val !== "string") return 0;
    if (val.includes("e+") || val.includes("e-")) {
      return parseFloat(val);
    }
    return parseFloat(val) || 0;
  };

  const processData = (): TableRow[] => {
    if (!data) {
      return [];
    }

    const brokerSummary = data?.data?.broker_summary || data?.broker_summary;

    if (!brokerSummary) {
      console.log("No broker_summary found in data");
      return [];
    }

    const brokersBuy = brokerSummary.brokers_buy || [];
    const brokersSell = brokerSummary.brokers_sell || [];

    console.log("Brokers Buy:", brokersBuy.length, brokersBuy.slice(0, 2));
    console.log("Brokers Sell:", brokersSell.length, brokersSell.slice(0, 2));

    const rows: TableRow[] = [];
    const maxRows = Math.max(brokersBuy.length, brokersSell.length);

    for (let i = 0; i < maxRows; i++) {
      const buyer = brokersBuy[i];
      const seller = brokersSell[i];

      const buyerCode = buyer?.netbs_broker_code || "";
      const buyerValue = buyer?.bval ? parseScientificNotation(buyer.bval) : 0;
      const buyerLot = buyer?.blot ? parseScientificNotation(buyer.blot) : 0;
      const buyerAvg = buyer?.netbs_buy_avg_price
        ? parseFloat(String(buyer.netbs_buy_avg_price))
        : 0;

      const sellerCode = seller?.netbs_broker_code || "";
      const sellerValue = seller?.sval
        ? parseScientificNotation(seller.sval)
        : 0;
      const sellerLot = seller?.slot ? parseScientificNotation(seller.slot) : 0;
      const sellerAvg = seller?.netbs_sell_avg_price
        ? parseFloat(String(seller.netbs_sell_avg_price))
        : 0;

      if (buyerCode || sellerCode) {
        rows.push({
          buyerCode: buyerCode,
          buyerValue: buyerValue,
          buyerLot: buyerLot,
          buyerAvg: buyerAvg,
          sellerCode: sellerCode,
          sellerValue: sellerValue,
          sellerLot: sellerLot,
          sellerAvg: sellerAvg,
          buyerItem: buyer,
          sellerItem: seller,
        });
      }
    }

    if (sortBy) {
      rows.sort((a, b) => {
        const aVal = sortBy === "buyValue" ? a.buyerValue : a.sellerValue;
        const bVal = sortBy === "buyValue" ? b.buyerValue : b.sellerValue;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return rows;
  };

  const handleSort = (column: "buyValue" | "sellValue") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const tableRows = processData();

  if (loading) {
    return (
      <div className="loading flex justify-center items-center h-screen">
        <div>Memuat data</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error flex justify-center items-center h-screen">
        <div className="error-icon">⚠️</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="stock-data bg-white p-4 rounded-md shadow-md border border-gray-200">
      <div className="stock-data-filters flex flex-col gap-2 mb-4">
        <div className="date-picker-group flex justify-start items-center gap-2">
          <div className="date-input-group flex flex-col gap-1">
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="date-input p-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <span className="text-lg">→</span>
          <div className="date-input-group flex flex-col gap-1">
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="date-input p-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="date-navigation flex gap-2 justify-start">
          <button
            type="button"
            onClick={handleDatePrev}
            className="date-nav-button p-2 text-sm font-medium border border-gray-300 rounded-md"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={handleDateNext}
            className="date-nav-button p-2 text-sm font-medium border border-gray-300 rounded-md"
          >
            Next →
          </button>
        </div>

        <div className="filter-group flex gap-2 flex-wrap">
          <select
            value={investorType}
            onChange={(e) => setInvestorType(e.target.value)}
            className="filter-select p-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="INVESTOR_TYPE_ALL">All Investor</option>
            <option value="INVESTOR_TYPE_FOREIGN">Asing</option>
            <option value="INVESTOR_TYPE_DOMESTIC">Lokal</option>
          </select>

          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="filter-select p-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="TRANSACTION_TYPE_NET">Net</option>
            <option value="TRANSACTION_TYPE_BUY">Buy</option>
            <option value="TRANSACTION_TYPE_SELL">Sell</option>
          </select>
        </div>
      </div>

      {tableRows.length === 0 ? (
        <div className="empty-state flex justify-center items-center h-screen">
          <div>Tidak ada data tersedia</div>
        </div>
      ) : (
        <div className="table-container overflow-x-auto">
          <table className="stock-table w-full border-collapse">
            <thead>
              <tr>
                <th>BY</th>
                <th
                  className="sortable cursor-pointer"
                  onClick={() => handleSort("buyValue")}
                >
                  B.val
                  {sortBy === "buyValue" && (
                    <span className="sort-arrow ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th>B.lot</th>
                <th>B.avg</th>
                <th>SL</th>
                <th
                  className="sortable cursor-pointer"
                  onClick={() => handleSort("sellValue")}
                >
                  S.val
                  {sortBy === "sellValue" && (
                    <span className="sort-arrow ml-1">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </th>
                <th>S.lot</th>
                <th>S.avg</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <span
                      className={`symbol-code ${getSymbolColor(
                        row.buyerItem,
                        "buy"
                      )}`}
                    >
                      {row.buyerCode}
                    </span>
                  </td>
                  <td className="buy-value">{formatNumber(row.buyerValue)}</td>
                  <td className="buy-value">{formatNumber(row.buyerLot)}</td>
                  <td className="buy-value">{formatCurrency(row.buyerAvg)}</td>
                  <td>
                    <span
                      className={`symbol-code ${getSymbolColor(
                        row.sellerItem,
                        "sell"
                      )}`}
                    >
                      {row.sellerCode}
                    </span>
                  </td>
                  <td className="sell-value">
                    {formatNumber(row.sellerValue)}
                  </td>
                  <td className="sell-value">{formatNumber(row.sellerLot)}</td>
                  <td className="sell-value">
                    {formatCurrency(row.sellerAvg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockData;

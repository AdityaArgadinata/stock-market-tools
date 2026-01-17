import { useState, useEffect } from "react";

interface InsiderActivityProps {
  symbol: string;
  token: string;
}

interface Movement {
  id: string;
  name: string;
  symbol: string;
  date: string;
  previous: {
    value: string;
    percentage: string;
  };
  current: {
    value: string;
    percentage: string;
  };
  changes: {
    value: string;
    percentage: string;
    formatted_value: string;
  };
  action_type: string;
  price_formatted: string;
  nationality: string;
  badges: string[];
  broker_detail?: {
    code: string;
    group: string;
  };
  data_source: {
    label: string;
    type: string;
  };
}

interface InsiderData {
  message?: string;
  data?: {
    is_more: boolean;
    movement: Movement[];
  };
}

const InsiderActivity = ({ symbol, token }: InsiderActivityProps) => {
  const [data, setData] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isMore, setIsMore] = useState(false);
  const [actionTypeFilter, setActionTypeFilter] = useState(
    "ACTION_TYPE_UNSPECIFIED"
  );

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(
          "https://exodus.stockbit.com/insider/company/majorholder"
        );
        url.searchParams.append("symbols", symbol);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", "50");
        url.searchParams.append("action_type", actionTypeFilter);
        url.searchParams.append("source_type", "SOURCE_TYPE_UNSPECIFIED");

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch insider data");

        const result: InsiderData = await response.json();
        if (result.data) {
          setData(result.data.movement || []);
          setIsMore(result.data.is_more || false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, token, page, actionTypeFilter]);

  const parseNumberString = (val: string): number => {
    return parseInt(val.replace(/,/g, ""), 10) || 0;
  };

  const formatNumber = (num: number | string): string => {
    let numValue = typeof num === "string" ? parseNumberString(num) : num;

    if (numValue === 0) return "0";

    const absNum = Math.abs(numValue);
    const isNegative = numValue < 0;
    let formatted = "";

    if (absNum >= 1000000) {
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

  const getActionColor = (action: string): string => {
    if (action.includes("BUY")) return "green";
    if (action.includes("SELL")) return "red";
    return "gray";
  };

  const getNationalityColor = (nationality: string): string => {
    if (nationality === "NATIONALITY_TYPE_LOCAL") return "purple";
    if (nationality === "NATIONALITY_TYPE_FOREIGN") return "red";
    return "gray";
  };

  return (
    <div className="h-full flex flex-col gap-4 dark:bg-slate-800 p-4 rounded-md dark:border-slate-700 border">
      <div className="header">
        <h3 className="font-bold text-lg dark:text-slate-100">
          Insider Activity - {symbol}
        </h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Major Holder Movements
        </p>
      </div>

      <div className="filter-group flex gap-2 flex-wrap">
        <select
          value={actionTypeFilter}
          onChange={(e) => {
            setActionTypeFilter(e.target.value);
            setPage(1);
          }}
          className="filter-select p-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-slate-100"
        >
          <option value="ACTION_TYPE_UNSPECIFIED">All Actions</option>
          <option value="ACTION_TYPE_BUY">Buy</option>
          <option value="ACTION_TYPE_SELL">Sell</option>
        </select>
      </div>

      {loading ? (
        <div className="flex h-full justify-center items-center">
          <span className="dark:text-slate-300">Loading...</span>
        </div>
      ) : error ? (
        <div className="flex h-full justify-center items-center">
          <span className="dark:text-red-400">{error}</span>
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full justify-center items-center">
          <span className="dark:text-slate-300">No data available</span>
        </div>
      ) : (
        <div className="table-container flex-1 overflow-y-auto">
          <table className="insider-table w-full border-collapse">
            <thead className="sticky top-0 dark:bg-slate-700">
              <tr>
                <th className="text-xs p-2 text-left border-b border-gray-300 dark:border-slate-600">
                  Name
                </th>
                <th className="text-xs p-2 text-left border-b border-gray-300 dark:border-slate-600">
                  Badge
                </th>
                <th className="text-xs p-2 text-left border-b border-gray-300 dark:border-slate-600">
                  Broker
                </th>
                <th className="text-xs p-2 text-right border-b border-gray-300 dark:border-slate-600">
                  Date
                </th>
                <th className="text-xs p-2 text-right border-b border-gray-300 dark:border-slate-600">
                  Price
                </th>
                <th className="text-xs p-2 text-right border-b border-gray-300 dark:border-slate-600">
                  Previous
                </th>
                <th className="text-xs p-2 text-right border-b border-gray-300 dark:border-slate-600">
                  Current
                </th>
                <th className="text-xs p-2 text-right border-b border-gray-300 dark:border-slate-600">
                  Changes
                </th>
                <th className="text-xs p-2 text-right border-b border-gray-300 dark:border-slate-600">
                  Action
                </th>
                <th className="text-xs p-2 text-right border-b border-gray-300 dark:border-slate-600">
                  % Change
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-100 dark:hover:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700"
                >
                  <td className="text-xs p-2 text-left dark:text-slate-200">
                    <div className="font-semibold">{item.name}</div>
                  </td>
                  <td className="text-xs p-2 text-left dark:text-slate-200">
                    <div className="flex gap-1 flex-wrap">
                      {item.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] font-semibold rounded-full text-yellow-500"
                        >
                          {badge.replace("SHAREHOLDER_BADGE_", "")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-xs p-2 text-left dark:text-slate-300">
                    {item.broker_detail?.code || "-"}
                  </td>
                  <td className="text-xs p-2 text-left dark:text-slate-300">
                    {item.date}
                  </td>
                  <td className="text-xs p-2 text-right dark:text-slate-300">
                    {item.price_formatted}
                  </td>
                  <td className="text-xs p-2 text-right dark:text-slate-300">
                    <div className="font-semibold">{formatNumber(item.previous.value)}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {item.previous.percentage}%
                    </div>
                  </td>
                  <td className="text-xs p-2 text-right dark:text-slate-300">
                    <div className="font-semibold">{formatNumber(item.current.value)}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {item.current.percentage}%
                    </div>
                  </td>
                  <td className="text-xs p-2 text-right">
                    <span
                      className={`font-semibold ${
                        item.changes.value.includes("+")
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <div>{formatNumber(item.changes.formatted_value)}</div>
                      <div className="text-xs">{item.changes.percentage}%</div>
                    </span>
                  </td>
                  <td className="text-xs p-2 text-right">
                    <span
                      className={`px-2 py-1 rounded font-semibold ${
                        getActionColor(item.action_type) === "green"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : getActionColor(item.action_type) === "red"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {item.action_type.replace("ACTION_TYPE_", "")}
                    </span>
                  </td>
                  <td className="text-xs p-2 text-right">
                    <span
                      className={
                        item.changes.percentage.includes("+")
                          ? "text-green-600 dark:text-green-400 font-semibold"
                          : "text-red-600 dark:text-red-400 font-semibold"
                      }
                    >
                      {item.changes.percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination flex gap-2 justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 text-sm font-medium border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <span className="text-sm dark:text-slate-300">Page {page}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!isMore}
          className="p-2 text-sm font-medium border border-gray-300 dark:border-slate-600 rounded-md dark:bg-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default InsiderActivity;

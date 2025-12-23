import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStockSymbol } from "../context/StockSymbolContext";

import "../App.css";
import {
  BarChart2,
  Bell,
  PieChart,
  LogOut,
  Moon,
  Search,
  ListStart,
  ChartCandlestick,
} from "lucide-react";

export default function MainLayout() {
  const { symbol, setSymbol } = useStockSymbol();
  const [inputSymbol, setInputSymbol] = useState(symbol);

  // Sync input dengan symbol global
  useEffect(() => {
    setInputSymbol(symbol);
  }, [symbol]);

  return (
    <div className="font-mono">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r flex flex-col">
        {/* Profile */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            CL
          </div>
          <div>
            <p className="font-semibold leading-none">Stockcoy</p>
            <span className="text-xs text-gray-500">
              Identifier Market
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!inputSymbol.trim()) return;
              setSymbol(inputSymbol.toUpperCase());
            }}
            className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
          >
            <Search size={16} className="text-gray-400" />
            <input
              value={inputSymbol}
              onChange={(e) =>
                setInputSymbol(e.target.value.toUpperCase())
              }
              placeholder="Search ticker..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </form>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 space-y-1">
          <MenuLink
            to="/"
            icon={<ChartCandlestick size={18} />}
            label="Stock Summary"
          />
          <MenuLink
            to="/volume"
            icon={<BarChart2 size={18} />}
            label="Volume"
          />
          <MenuLink
            to="/orderbook"
            icon={<ListStart size={18} />}
            label="Orderbook & Queue"
          />
          <MenuLink
            to="/notifications"
            icon={<Bell size={18} />}
            label="Notifications"
          />
          <MenuLink
            to="/analytics"
            icon={<PieChart size={18} />}
            label="Analytics"
          />
        </nav>

        {/* Footer */}
        <div className="border-t p-3 space-y-3">
          <button className="flex items-center gap-3 text-gray-600 hover:text-red-500 w-full px-3 py-2">
            <LogOut size={18} />
            Logout
          </button>

          <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Moon size={16} />
              Dark Mode
            </div>
            <input type="checkbox" className="toggle toggle-sm" />
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-64 min-h-screen bg-gray-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}

function MenuLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
        ${
          isActive
            ? "bg-emerald-600 text-white"
            : "text-gray-600 hover:bg-gray-100"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

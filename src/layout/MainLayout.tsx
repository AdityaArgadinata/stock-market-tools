import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useStockSymbol } from "../context/StockSymbolContext";

import "../App.css";
import {
  BarChart2,
  Bell,
  PieChart,
  LogOut,
  Search,
  ListStart,
  ChartCandlestick,
  UserCheck,
} from "lucide-react";

export default function MainLayout() {
  const { symbol, setSymbol } = useStockSymbol();
  const [inputSymbol, setInputSymbol] = useState(symbol);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync input dengan symbol global
  useEffect(() => {
    setInputSymbol(symbol);
  }, [symbol]);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="dark:bg-slate-900 min-h-screen">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 flex flex-col transition-colors">
        {/* Profile */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-bold">
            CL
          </div>
          <div>
            <p className="font-semibold leading-none dark:text-slate-100">Stockcoy</p>
            <span className="text-xs text-gray-500 dark:text-slate-400">
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
              searchInputRef.current?.blur();
            }}
            className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded-lg"
          >
            <Search size={16} className="text-gray-400 dark:text-slate-400" />
            <input
              ref={searchInputRef}
              value={inputSymbol}
              onChange={(e) =>
                setInputSymbol(e.target.value.toUpperCase())
              }
              onFocus={(e) => e.target.select()}
              placeholder="Search ticker..."
              className="bg-transparent outline-none text-sm w-full dark:text-slate-100 dark:placeholder-slate-400"
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
          <MenuLink
            to="/insider"
            icon={<UserCheck size={18} />}
            label="Insider"
          />
        </nav>

        {/* Footer */}
        <div className="border-t dark:border-slate-700 p-3">
          <button className="flex items-center gap-3 text-gray-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 w-full px-3 py-2 transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-64 min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors">
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
            ? "bg-emerald-600 dark:bg-emerald-800 text-white"
            : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

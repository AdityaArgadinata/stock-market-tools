import { createContext, useContext, useEffect, useState } from "react";

interface StockSymbolContextType {
  symbol: string;
  setSymbol: (symbol: string) => void;
}

const StockSymbolContext = createContext<StockSymbolContextType | undefined>(
  undefined
);

export function StockSymbolProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [symbol, setSymbol] = useState<string>(() => {
    return localStorage.getItem("stock_symbol") || "SUPA";
  });

  useEffect(() => {
    localStorage.setItem("stock_symbol", symbol);
  }, [symbol]);

  return (
    <StockSymbolContext.Provider value={{ symbol, setSymbol }}>
      {children}
    </StockSymbolContext.Provider>
  );
}

export function useStockSymbol() {
  const context = useContext(StockSymbolContext);
  if (!context) {
    throw new Error("useStockSymbol must be used inside StockSymbolProvider");
  }
  return context;
}

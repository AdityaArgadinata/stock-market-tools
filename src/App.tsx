import { Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import Home from "./pages/Home";
import OrderBook from "./pages/OrderBook";

import { StockSymbolProvider } from "./context/StockSymbolContext";

export default function App() {
  return (
    <StockSymbolProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/orderbook" element={<OrderBook />} />
        </Route>
      </Routes>
    </StockSymbolProvider>
  );
}

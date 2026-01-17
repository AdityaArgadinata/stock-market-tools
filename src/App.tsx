import { Routes, Route } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import Home from "./pages/Home";
import OrderBook from "./pages/OrderBook";
import Analytics from "./pages/Analytics";
import Volume from "./pages/Volume";
import Notification from "./pages/Notification";
import Insider from "./pages/Insider";

import { StockSymbolProvider } from "./context/StockSymbolContext";

export default function App() {
  return (
    <StockSymbolProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/orderbook" element={<OrderBook />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/volume" element={<Volume />} />
          <Route path="/notifications" element={<Notification />} />
          <Route path="/insider" element={<Insider />} />
        </Route>
      </Routes>
    </StockSymbolProvider>
  );
}

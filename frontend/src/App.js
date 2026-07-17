import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrdersPage from "@/pages/OrdersPage";
import { ThemeProvider } from "@/context/ThemeContext";

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<OrdersPage />} />
            {/* Phase 1: only Orders. Everything else is intentionally not routed. */}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;

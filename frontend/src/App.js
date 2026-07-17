import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import DashboardPage from "@/pages/DashboardPage";
import OrdersPage from "@/pages/OrdersPage";
import InventoryPage from "@/pages/InventoryPage";
import ProducersPage from "@/pages/ProducersPage";
import ProductionPage from "@/pages/ProductionPage";
import ProcurementPage from "@/pages/ProcurementPage";
import WarehousePage from "@/pages/WarehousePage";
import DispatchPage from "@/pages/DispatchPage";
import StorePage from "@/pages/StorePage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import AccountsPage from "@/pages/AccountsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import DiscussionsPage from "@/pages/DiscussionsPage";
import MasterDataPage from "@/pages/MasterDataPage";
import AdminPage from "@/pages/AdminPage";

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/producers" element={<ProducersPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/procurement" element={<ProcurementPage />} />
            <Route path="/warehouse" element={<WarehousePage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/discussions" element={<DiscussionsPage />} />
            <Route path="/master-data" element={<MasterDataPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
}

export default App;

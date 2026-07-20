import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import RequireAuth from "@/components/graamam/RequireAuth";
import LandingPage from "@/pages/LandingPage";
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
import LoginPage from "@/pages/LoginPage";
import InvoicePrintPage from "@/pages/InvoicePrintPage";
import DispatchFormPrintPage from "@/pages/DispatchFormPrintPage";

function Gate({ children }) {
  return <RequireAuth>{children}</RequireAuth>;
}

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/invoice/:invoiceId" element={<Gate><InvoicePrintPage /></Gate>} />
              <Route path="/dispatch-form/:orderId" element={<Gate><DispatchFormPrintPage /></Gate>} />
              <Route path="/dashboard" element={<Gate><DashboardPage /></Gate>} />
              <Route path="/orders" element={<Gate><OrdersPage /></Gate>} />
              <Route path="/inventory" element={<Gate><InventoryPage /></Gate>} />
              <Route path="/producers" element={<Gate><ProducersPage /></Gate>} />
              <Route path="/production" element={<Gate><ProductionPage /></Gate>} />
              <Route path="/procurement" element={<Gate><ProcurementPage /></Gate>} />
              <Route path="/warehouse" element={<Gate><WarehousePage /></Gate>} />
              <Route path="/dispatch" element={<Gate><DispatchPage /></Gate>} />
              <Route path="/store" element={<Gate><StorePage /></Gate>} />
              <Route path="/accounts" element={<Gate><AccountsPage /></Gate>} />
              <Route path="/reports" element={<Gate><ReportsPage /></Gate>} />
              <Route path="/approvals" element={<Gate><ApprovalsPage /></Gate>} />
              <Route path="/discussions" element={<Gate><DiscussionsPage /></Gate>} />
              <Route path="/master-data" element={<Gate><MasterDataPage /></Gate>} />
              <Route path="/admin" element={<Gate><AdminPage /></Gate>} />
              <Route path="/settings" element={<Gate><SettingsPage /></Gate>} />
              <Route path="*" element={<Gate><Navigate to="/dashboard" replace /></Gate>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";

import Navbar from "./components/Navbar";
import PancakeSwapDapp from "./components/PancakeSwapDapp";
import StakingDashboard from "./components/StakingDashboard";
import AdminPanel from "./components/Adminpanel"; // admin panel for adding tokens

// Your staking contract address
const STAKING_ADDRESS = "0x4a969eDba8ffef8e2C22EDaB4135c36BB1Ae9e3f";

function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-gray-100">
          {/* Navbar */}
          <Navbar />

          {/* Pages container */}
          <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-6">
            <Routes>
              <Route path="/" element={<Navigate to="/swap" />} />

              {/* Swap Page */}
              <Route path="/swap" element={<PancakeSwapDapp />} />

              {/* Staking Dashboard */}
              <Route
                path="/staking"
                element={<StakingDashboard STAKING_ADDRESS={STAKING_ADDRESS} />}
              />

              {/* Admin Panel */}
              <Route
                path="/admin"
                element={<AdminPanel STAKING_ADDRESS={STAKING_ADDRESS} />}
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/swap" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </Web3Provider>
  );
}

export default App;

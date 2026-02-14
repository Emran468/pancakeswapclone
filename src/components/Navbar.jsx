import { NavLink } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils/wallet";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import MultiTokenStakingProABI from "../abis/MultiTokenStakingPro.json"; // your compiled ABI

const REQUIRED_CHAIN = "0x61"; // BSC Testnet
const NETWORKS = {
  "0x61": { name: "BSC Testnet", color: "bg-yellow-100 text-yellow-800" },
  "0x38": { name: "BSC Mainnet", color: "bg-green-100 text-green-800" },
};

const CONTRACT_ADDRESS = "0x4a969eDba8ffef8e2C22EDaB4135c36BB1Ae9e3f"; // replace with your deployed contract

const Navbar = () => {
  const { provider, account, isConnected, chainId, connectWallet, switchNetwork } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);

  const isCorrectNetwork = chainId === REQUIRED_CHAIN;
  const network = NETWORKS[chainId];

  // Check if connected account is admin
  useEffect(() => {
    if (!provider || !account) return;

    const contract = new ethers.Contract(CONTRACT_ADDRESS, MultiTokenStakingProABI, provider);

    const checkAdmin = async () => {
      try {
        const owner = await contract.owner();
        setIsAdmin(owner.toLowerCase() === account.toLowerCase());
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [provider, account]);

  return (
    <nav className="bg-gray-900 text-white shadow w-full">
      <div className="w-full mx-auto flex justify-between items-center px-6 py-3">
        {/* Navigation Links */}
        <div className="flex gap-6">
          <NavLink
            to="/swap"
            className={({ isActive }) =>
              isActive ? "text-yellow-400 font-bold" : "hover:text-yellow-300"
            }
          >
            🔁 Swap
          </NavLink>
          <NavLink
            to="/staking"
            className={({ isActive }) =>
              isActive ? "text-yellow-400 font-bold" : "hover:text-yellow-300"
            }
          >
            🏦 Stake
          </NavLink>

          {/* Admin Panel Link */}
          {isConnected && isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? "text-red-400 font-bold" : "hover:text-red-300"
              }
            >
              🛠 Admin Panel
            </NavLink>
          )}
        </div>

        {/* Wallet / Network */}
        <div className="flex items-center gap-3">
          {/* Show current network */}
          {isConnected && network && (
            <span className={`text-xs px-3 py-1 rounded-full ${network.color}`}>
              {network.name}
            </span>
          )}

          {/* Show switch network button if wrong network */}
          {isConnected && !isCorrectNetwork && (
            <button
              onClick={() => switchNetwork(REQUIRED_CHAIN)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-semibold"
            >
              Switch to BSC
            </button>
          )}

          {/* Connect Wallet button */}
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              <Wallet className="w-4 h-4" /> Connect
            </button>
          ) : (
            <div className="bg-gray-800 px-3 py-2 rounded font-mono text-sm">
              {formatAddress(account)}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

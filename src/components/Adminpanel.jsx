import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import ABI from "../abis/MultiTokenStakingPro.json";
import { ERC20_ABI } from "../utils/contracts";
import { useWeb3 } from "../context/Web3Context";

const CONTRACT_ADDRESS = "0x4a969eDba8ffef8e2C22EDaB4135c36BB1Ae9e3f";

export default function AdminPanel() {
  const { signer, account } = useWeb3();
  const [stakingToken, setStakingToken] = useState("");
  const [rewardToken, setRewardToken] = useState("");
  const [rewardRate, setRewardRate] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokensList, setTokensList] = useState([]);
  const [selectedToken, setSelectedToken] = useState("");

  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

  // Load existing tokens from contract
  const loadTokens = async () => {
    try {
      const filter = contract.filters.TokenAdded();
      const events = await contract.queryFilter(filter, 0, 'latest');
      const uniqueTokens = [...new Set(events.map(e => e.args.stakingToken))];
      
      const tokensWithInfo = [];
      for (const addr of uniqueTokens) {
        try {
          const info = await contract.tokenInfo(addr);
          if (info.exists) {
            tokensWithInfo.push({
              address: addr,
              stakingToken: info.stakingToken,
              rewardToken: info.rewardToken,
              rewardRate: info.rewardRatePerBlock.toString(),
              exists: info.exists
            });
          }
        } catch (e) {
          console.warn(`Could not load token ${addr}:`, e.message);
        }
      }
      setTokensList(tokensWithInfo);
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };

  useEffect(() => {
    if (contract && account) {
      loadTokens();
    }
  }, [account]);

  const addToken = async () => {
    if (!stakingToken || !rewardToken || !rewardRate) {
      return alert("সব field পূরণ করো");
    }
    
    try {
      setLoading(true);
      
      // Validate addresses
      if (!ethers.isAddress(stakingToken)) {
        alert("Invalid staking token address");
        return;
      }
      
      if (!ethers.isAddress(rewardToken)) {
        alert("Invalid reward token address");
        return;
      }
      
      // Check if token already exists
      try {
        const existingInfo = await contract.tokenInfo(stakingToken);
        if (existingInfo.exists) {
          alert("এই token ইতিমধ্যেই contract-এ add করা আছে");
          return;
        }
      } catch (e) {
        // Token doesn't exist yet, continue
      }
      
      // Calculate reward rate
      // Example: If you want 0.0001 reward per staking token per block
      // rewardRate should be "0.0001"
      const rateBN = ethers.parseUnits(rewardRate, 18);
      
      console.log("Adding token with:", {
        stakingToken,
        rewardToken,
        rewardRate: rewardRate,
        rateBN: rateBN.toString()
      });
      
      const tx = await contract.addStakingToken(stakingToken, rewardToken, rateBN);
      await tx.wait();
      
      alert("✅ Token successfully added to contract");
      
      // Clear form and reload tokens
      setStakingToken("");
      setRewardToken("");
      setRewardRate("");
      loadTokens();
      
    } catch (err) {
      console.error("Add token error:", err);
      alert(err.reason || err.message || "Error adding token");
    } finally {
      setLoading(false);
    }
  };

  const depositReward = async () => {
    if (!selectedToken || !depositAmount) {
      return alert("Token select করো এবং amount দিন");
    }
    
    try {
      setLoading(true);
      
      // Check if token exists in contract
      const tokenInfo = await contract.tokenInfo(selectedToken);
      if (!tokenInfo.exists) {
        alert("এই token contract-এ add করা নেই। প্রথমে add করো।");
        return;
      }
      
      // Get reward token decimals
      const rewardTokenContract = new ethers.Contract(tokenInfo.rewardToken, ERC20_ABI, signer);
      const decimals = await rewardTokenContract.decimals();
      
      // Parse amount with correct decimals
      const amountBN = ethers.parseUnits(depositAmount, decimals);
      
      // Check allowance first
      const allowance = await rewardTokenContract.allowance(account, CONTRACT_ADDRESS);
      if (allowance < amountBN) {
        // Approve the contract to spend tokens
        const approveTx = await rewardTokenContract.approve(CONTRACT_ADDRESS, amountBN);
        await approveTx.wait();
        alert("✅ Approval successful");
      }
      
      // Deposit reward tokens
      const tx = await contract.depositRewardTokens(selectedToken, amountBN);
      await tx.wait();
      
      alert(`✅ ${depositAmount} reward tokens deposited successfully`);
      
      // Clear form
      setDepositAmount("");
      
    } catch (err) {
      console.error("Deposit error:", err);
      alert(err.reason || err.message || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  const getTokenSymbol = async (address) => {
    try {
      const token = new ethers.Contract(address, ERC20_ABI, signer);
      return await token.symbol();
    } catch {
      return "Unknown";
    }
  };

  if (!signer) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
        <p className="text-red-600">Please connect your wallet first!</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Admin Panel</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Add New Token */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">Add New Staking Token</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staking Token Address
              </label>
              <input
                placeholder="0x..."
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={stakingToken}
                onChange={(e) => setStakingToken(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reward Token Address
              </label>
              <input
                placeholder="0x..."
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={rewardToken}
                onChange={(e) => setRewardToken(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reward Rate Per Block
                <span className="text-xs text-gray-500 ml-2">(Example: 0.0001)</span>
              </label>
              <input
                placeholder="0.0001"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={rewardRate}
                onChange={(e) => setRewardRate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Reward per staking token per block. 0.0001 means 0.0001 reward token per 1 staking token per block.
              </p>
            </div>
            
            <button
              onClick={addToken}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Processing..." : "Add Staking Token"}
            </button>
          </div>
        </div>
        
        {/* Right Column: Deposit Rewards */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">Deposit Reward Tokens</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Staking Token
              </label>
              <select
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="">Select a token...</option>
                {tokensList.map((token, index) => (
                  <option key={index} value={token.address}>
                    {token.address.substring(0, 8)}... ({token.rewardRate} rate)
                  </option>
                ))}
              </select>
              
              {tokensList.length === 0 && (
                <p className="text-sm text-yellow-600 mt-2">
                  No tokens added yet. Add a token first.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Reward Amount
              </label>
              <input
                placeholder="1000"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>
            
            <button
              onClick={depositReward}
              disabled={loading || !selectedToken}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Processing..." : "Deposit Rewards"}
            </button>
          </div>
          
          {/* Existing Tokens List */}
          {tokensList.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Existing Tokens in Contract</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tokensList.map((token, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-mono text-sm break-all">
                      Staking: {token.address}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Reward Rate: {ethers.formatUnits(token.rewardRate, 18)} per block
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Instructions */}
    
    </div>
  );
}
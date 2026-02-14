import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import STAKING_ABI from "../abis/MultiTokenStakingPro";
import { ERC20_ABI } from "../utils/contracts";
import { useWeb3 } from "../context/Web3Context";

const StakingDashboard = ({ STAKING_ADDRESS }) => {
  const { account, signer, provider, chainId } = useWeb3();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputAmounts, setInputAmounts] = useState({});
  const [refresh, setRefresh] = useState(false);
  const [stakingContract, setStakingContract] = useState(null);
  const [transactionPending, setTransactionPending] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (signer && STAKING_ADDRESS) {
      try {
        const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
        setStakingContract(contract);
      } catch (error) {
        console.error("Failed to initialize contract:", error);
        setError("Failed to connect to staking contract");
      }
    }
  }, [signer, STAKING_ADDRESS]);

  // Load tokens from events
  const loadTokens = async () => {
    if (!stakingContract || !account || !provider) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get TokenAdded events
      const filter = stakingContract.filters.TokenAdded();
      const events = await stakingContract.queryFilter(filter, 0, 'latest');
      
      if (events.length === 0) {
        setTokens([]);
        setLoading(false);
        return;
      }

      const tokenAddresses = [...new Set(events.map(e => e.args.stakingToken))];
      const tokenList = [];

      for (const addr of tokenAddresses) {
        try {
          const info = await stakingContract.tokenInfo(addr);
          
          if (!info.exists) continue;

          const stakingToken = new ethers.Contract(info.stakingToken, ERC20_ABI, signer);
          const rewardToken = new ethers.Contract(info.rewardToken, ERC20_ABI, signer);

          // Fetch all data
          const [
            name, 
            symbol, 
            decimals, 
            balanceRaw, 
            allowanceRaw, 
            stakeData, 
            pendingRaw,
            rewardSymbol,
            totalStakedRaw,
            rewardBalanceRaw,
            rewardTokenDecimals
          ] = await Promise.all([
            stakingToken.name(),
            stakingToken.symbol(),
            stakingToken.decimals(),
            stakingToken.balanceOf(account),
            stakingToken.allowance(account, STAKING_ADDRESS),
            stakingContract.stakes(info.stakingToken, account),
            stakingContract.pendingReward(info.stakingToken, account),
            rewardToken.symbol().catch(() => "Unknown"),
            info.totalStaked,
            info.rewardTokenBalance,
            rewardToken.decimals().catch(() => 18)
          ]);

          // Format values
          const balance = ethers.formatUnits(balanceRaw, decimals);
          const staked = ethers.formatUnits(stakeData.amount, decimals);
          const pending = ethers.formatUnits(pendingRaw, info.rewardDecimals);
          const totalStakedFormatted = ethers.formatUnits(totalStakedRaw, decimals);
          const rewardBalance = ethers.formatUnits(rewardBalanceRaw, info.rewardDecimals);

          // Format allowance
          let allowanceDisplay;
          let hasUnlimitedApproval = false;
          if (allowanceRaw === ethers.MaxUint256) {
            allowanceDisplay = "Unlimited";
            hasUnlimitedApproval = true;
          } else {
            allowanceDisplay = ethers.formatUnits(allowanceRaw, decimals);
          }

          // FIXED APR Calculation
          const blocksPerYear = 105120; // 15 second blocks
          // Convert rewardRatePerBlock to proper APR
          // rewardRatePerBlock is in reward tokens per staking token per block
          const rewardRate = Number(ethers.formatUnits(info.rewardRatePerBlock, 18));
          const apr = rewardRate * blocksPerYear * 100; // Convert to percentage

          // Calculate ROI
          const roi = parseFloat(staked) > 0 ? 
            (parseFloat(pending) / parseFloat(staked) * 100).toFixed(2) : "0.00";

          const tokenData = {
            address: info.stakingToken,
            rewardAddress: info.rewardToken,
            name,
            symbol,
            rewardSymbol,
            decimals,
            balance: parseFloat(balance),
            balanceFormatted: parseFloat(balance).toFixed(4),
            balanceRaw,
            allowance: allowanceDisplay,
            hasUnlimitedApproval,
            allowanceRaw,
            staked: parseFloat(staked),
            stakedFormatted: parseFloat(staked).toFixed(4),
            stakedRaw: stakeData.amount,
            pending: parseFloat(pending),
            pendingFormatted: parseFloat(pending).toFixed(4),
            pendingRaw,
            apr: apr.toFixed(2),
            roi: roi,
            totalStaked: parseFloat(totalStakedFormatted),
            rewardBalance: parseFloat(rewardBalance),
            rewardRatePerBlock: info.rewardRatePerBlock.toString(),
            stakingDecimals: info.stakingDecimals,
            rewardDecimals: info.rewardDecimals,
            lastUpdateBlock: stakeData.lastBlock.toString(),
            accumulatedRewards: ethers.formatUnits(stakeData.accumulatedRewards, info.rewardDecimals),
            exists: info.exists,
            // Add reward balance check
            hasSufficientRewards: parseFloat(rewardBalance) > parseFloat(pending)
          };

          tokenList.push(tokenData);
          
        } catch (error) {
          console.error(`Error loading token ${addr}:`, error);
        }
      }

      // Sort tokens by staked amount
      tokenList.sort((a, b) => b.staked - a.staked);
      setTokens(tokenList);

    } catch (error) {
      console.error("Error loading tokens:", error);
      setError("Failed to load tokens. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  useEffect(() => {
    loadTokens();
  }, [stakingContract, account, refresh, provider]);

  // Handle input change
  const handleInput = (addr, value) => {
    if (value === "") {
      setInputAmounts(prev => {
        const newAmounts = { ...prev };
        delete newAmounts[addr];
        return newAmounts;
      });
      return;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    setInputAmounts(prev => ({
      ...prev,
      [addr]: value
    }));
  };

  // Set max amount
  const setMaxAmount = (token, type) => {
    const amount = type === 'balance' ? token.balance : token.staked;
    handleInput(token.address, amount.toString());
  };

  // Stake tokens - FIXED VERSION
  const handleStake = async (token) => {
    if (!stakingContract || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setTransactionPending(true);
      const amount = ethers.parseUnits(inputAmounts[token.address] || "0", token.decimals);
      
      if (amount <= 0n) {
        alert("Please enter a valid amount");
        setTransactionPending(false);
        return;
      }

      // Check if amount exceeds balance
      const balanceRaw = token.balanceRaw || await (new ethers.Contract(token.address, ERC20_ABI, signer)).balanceOf(account);
      if (amount > balanceRaw) {
        alert("Insufficient balance");
        setTransactionPending(false);
        return;
      }

      const stakingToken = new ethers.Contract(token.address, ERC20_ABI, signer);

      // Check allowance
      const allowanceRaw = await stakingToken.allowance(account, STAKING_ADDRESS);
      
      if (allowanceRaw < amount) {
        const shouldApproveMax = window.confirm(
          `Approve unlimited ${token.symbol} for staking? This will save gas for future transactions.`
        );
        
        const approveAmount = shouldApproveMax ? ethers.MaxUint256 : amount;
        console.log("Approving amount:", approveAmount.toString());
        const approveTx = await stakingToken.approve(STAKING_ADDRESS, approveAmount);
        await approveTx.wait();
        alert("Approval successful!");
      }

      // Check reward balance in contract before staking
      try {
        const tokenInfo = await stakingContract.tokenInfo(token.address);
        const rewardBalance = tokenInfo.rewardTokenBalance;
        const rewardBalanceFormatted = ethers.formatUnits(rewardBalance, tokenInfo.rewardDecimals);
        
        if (rewardBalance <= 0n) {
          const shouldContinue = window.confirm(
            `Warning: Contract has no reward tokens (${token.rewardSymbol}) deposited.\n` +
            `You can still stake but won't earn rewards until rewards are deposited.\n\n` +
            `Continue staking?`
          );
          if (!shouldContinue) {
            setTransactionPending(false);
            return;
          }
        }
      } catch (e) {
        console.log("Could not check reward balance:", e);
      }

      console.log("Staking amount:", amount.toString());
      const stakeTx = await stakingContract.stake(token.address, amount);
      await stakeTx.wait();
      
      handleInput(token.address, "");
      setRefresh(!refresh);
      setTransactionPending(false);
      
      alert(`Successfully staked ${ethers.formatUnits(amount, token.decimals)} ${token.symbol}`);
      
    } catch (error) {
      console.error("Stake error details:", error);
      
      // Check for specific error
      if (error.message && error.message.includes("Insufficient reward tokens")) {
        alert(
          `Contract doesn't have enough ${token.rewardSymbol} tokens.\n\n` +
          `Please use the Admin Panel to deposit reward tokens first.\n` +
          `Reward Token: ${token.rewardSymbol}\n` +
          `Reward Token Address: ${token.rewardAddress}`
        );
      } else if (error.reason) {
        alert(`Transaction failed: ${error.reason}`);
      } else if (error.message) {
        alert(`Transaction failed: ${error.message}`);
      } else {
        alert("Transaction failed. Please check console for details.");
      }
      
      setTransactionPending(false);
    }
  };

  // Withdraw tokens
  const handleWithdraw = async (token) => {
    if (!stakingContract || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setTransactionPending(true);
      const amount = ethers.parseUnits(inputAmounts[token.address] || "0", token.decimals);
      
      if (amount <= 0n) {
        alert("Please enter a valid amount");
        setTransactionPending(false);
        return;
      }

      const stakedAmount = token.stakedRaw || await stakingContract.stakes(token.address, account).then(s => s.amount);
      if (amount > stakedAmount) {
        alert("Insufficient staked amount");
        setTransactionPending(false);
        return;
      }

      const withdrawTx = await stakingContract.withdraw(token.address, amount);
      await withdrawTx.wait();
      
      handleInput(token.address, "");
      setRefresh(!refresh);
      setTransactionPending(false);
      
      alert(`Successfully withdrawn ${ethers.formatUnits(amount, token.decimals)} ${token.symbol}`);
      
    } catch (error) {
      console.error("Withdraw error:", error);
      alert(error?.reason || error.message || "Transaction failed");
      setTransactionPending(false);
    }
  };

  // Claim rewards
  const handleClaim = async (token) => {
    if (!stakingContract || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setTransactionPending(true);
      
      if (token.pending <= 0) {
        alert("No rewards to claim");
        setTransactionPending(false);
        return;
      }

      // Check if contract has enough rewards
      const tokenInfo = await stakingContract.tokenInfo(token.address);
      const pendingRaw = await stakingContract.pendingReward(token.address, account);
      
      if (tokenInfo.rewardTokenBalance < pendingRaw) {
        alert(
          `Contract doesn't have enough ${token.rewardSymbol} tokens to pay rewards.\n` +
          `Please contact the admin to deposit more reward tokens.`
        );
        setTransactionPending(false);
        return;
      }

      const claimTx = await stakingContract.claimReward(token.address);
      await claimTx.wait();
      
      setRefresh(!refresh);
      setTransactionPending(false);
      
      alert(`Successfully claimed ${token.pendingFormatted} ${token.rewardSymbol} rewards`);
      
    } catch (error) {
      console.error("Claim error:", error);
      
      if (error.message && error.message.includes("Insufficient reward tokens")) {
        alert(
          `Cannot claim: Contract has insufficient ${token.rewardSymbol} tokens.\n` +
          `Admin needs to deposit more rewards.`
        );
      } else {
        alert(error?.reason || error.message || "Transaction failed");
      }
      
      setTransactionPending(false);
    }
  };

  // Format numbers
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '0.00';
    const n = parseFloat(num);
    if (isNaN(n)) return '0.00';
    
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
    if (n < 0.001) return '<0.001';
    if (n < 1) return n.toFixed(6);
    if (n < 100) return n.toFixed(4);
    return n.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700">Loading staking data...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Staking Dashboard</h1>
          <p className="text-gray-600">
            Connected: <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
              {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
            </span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={loadTokens}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Reward Balance Warning */}
        {tokens.some(t => !t.hasSufficientRewards && t.pending > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <span className="text-yellow-600 text-xl mr-2">⚠️</span>
              <div>
                <h3 className="font-semibold text-yellow-800">Low Reward Balance</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Some tokens have insufficient rewards in the contract. Please ask admin to deposit more reward tokens.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tokens List */}
        {tokens.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-5xl text-gray-400 mb-4">💰</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Tokens Available</h3>
            <p className="text-gray-500">No staking tokens found in the contract</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tokens.map((token) => (
              <div key={token.address} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span className="text-blue-600">💰</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{token.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {token.symbol}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                              APR: {token.apr}%
                            </span>
                            {!token.hasSufficientRewards && token.pending > 0 && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">
                                Low Rewards
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {formatNumber(token.balance + token.staked)}
                      </div>
                      <div className="text-sm text-gray-500">Total Holdings</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-sm mb-1">Wallet Balance</div>
                        <div className="text-lg font-semibold">{token.balanceFormatted}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-sm mb-1">Staked Amount</div>
                        <div className="text-lg font-semibold text-green-600">{token.stakedFormatted}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-500 text-sm mb-1">Pending Rewards</div>
                        <div className={`text-lg font-semibold ${token.hasSufficientRewards ? 'text-purple-600' : 'text-yellow-600'}`}>
                          {token.pendingFormatted} {token.rewardSymbol}
                          {!token.hasSufficientRewards && token.pending > 0 && (
                            <span className="text-xs text-yellow-600 ml-2">(low balance)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-sm mb-1">ROI</div>
                        <div className="text-lg font-semibold text-blue-600">{token.roi}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Contract Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Reward Token:</span>
                        <span className="font-medium">{token.rewardSymbol}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Contract Rewards:</span>
                        <span className={token.rewardBalance > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatNumber(token.rewardBalance)} {token.rewardSymbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Input */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-700 font-medium">Amount</label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setMaxAmount(token, 'balance')}
                          className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
                        >
                          Max Balance
                        </button>
                        {token.staked > 0 && (
                          <button
                            onClick={() => setMaxAmount(token, 'staked')}
                            className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200"
                          >
                            Max Staked
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={inputAmounts[token.address] || ""}
                        onChange={(e) => handleInput(token.address, e.target.value)}
                        placeholder={`0.00 ${token.symbol}`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        step="any"
                        min="0"
                        max={token.balance + token.staked}
                      />
                      <div className="absolute right-3 top-3 text-gray-500">{token.symbol}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleStake(token)}
                      disabled={transactionPending || !inputAmounts[token.address] || parseFloat(inputAmounts[token.address] || 0) <= 0}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <span className="mr-2">💰</span>
                      Stake
                    </button>
                    
                    <button
                      onClick={() => handleWithdraw(token)}
                      disabled={transactionPending || !inputAmounts[token.address] || parseFloat(inputAmounts[token.address] || 0) <= 0 || token.staked === 0}
                      className="px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <span className="mr-2">👛</span>
                      Withdraw
                    </button>
                    
                    <button
                      onClick={() => handleClaim(token)}
                      disabled={transactionPending || token.pending <= 0}
                      className="px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <span className="mr-2">🎁</span>
                      Claim
                    </button>
                  </div>

                  {/* Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {token.hasUnlimitedApproval ? (
                        <span className="text-green-600">✓ Approved for unlimited staking</span>
                      ) : (
                        <span>Approval needed for staking</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-2">Need Help?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• "Insufficient reward tokens" means contract needs more {tokens[0]?.rewardSymbol} tokens</li>
            <li>• Ask admin to deposit rewards using Admin Panel</li>
            <li>• Make sure you have enough {tokens[0]?.symbol} in your wallet to stake</li>
            <li>• Check that the contract has enough reward tokens for your pending rewards</li>
          </ul>
        </div>
      </div>

      {/* Transaction Pending Modal */}
      {transactionPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <h3 className="text-xl font-semibold text-center text-gray-800">Processing Transaction</h3>
            <p className="text-gray-600 text-center mt-2">Please confirm in your wallet...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StakingDashboard;
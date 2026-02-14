import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  Settings,
  Wallet,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  Info,
  Zap,
  Shield,
  TrendingUp,
  BarChart3,
  Search,
  X
} from "lucide-react";
import TokenSelectorModal from "./TokenSelector"
import PriceInfo from "./priceinfo";
import { getContractsForChain } from "../utils/contracts";
import { getTokensForChain } from "../utils/tokens";
import {
  formatAddress,
  formatNumber,
} from "../utils/wallet";
import { useWeb3 } from "../context/Web3Context";
import { Contract, formatEther, formatUnits, parseUnits } from "ethers";
import { ROUTER_ABI, ERC20_ABI } from "../utils/contracts";


// const TokenSelectorModal = ({
//   tokens,
//   selectedToken,
//   onSelect,
//   onClose,
//   title = "Select a token",
//   balances = {},
// }) => {
//   const [search, setSearch] = useState("");

//   // Filter tokens based on search
//   const filteredTokens = tokens.filter((token) => {
//     if (!search.trim()) return true;
//     const searchLower = search.toLowerCase();
//     return (
//       token.name?.toLowerCase().includes(searchLower) ||
//       token.symbol?.toLowerCase().includes(searchLower) ||
//       token.address?.toLowerCase().includes(searchLower)
//     );
//   });

//   // Get token icon
//   const getTokenIcon = (token) => {
//     if (token.logoURI) {
//       return <span className="text-2xl">{token.logoURI}</span>;
//     }
//     return (
//       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-yellow-400 flex items-center justify-center">
//         <span className="text-white font-bold">
//           {token.symbol?.charAt(0) || "T"}
//         </span>
//       </div>
//     );
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
//         {/* Header */}
//         <div className="flex items-center justify-between p-6 border-b border-gray-200">
//           <h3 className="text-xl font-bold text-gray-900">{title}</h3>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5 text-gray-500" />
//           </button>
//         </div>

//         {/* Search */}
//         <div className="p-4 border-b border-gray-200">
//           <div className="relative">
//             <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search name or paste address"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
//               autoFocus
//             />
//           </div>
//         </div>

//         {/* Token List */}
//         <div className="overflow-y-auto max-h-[400px]">
//           {filteredTokens.length === 0 ? (
//             <div className="p-8 text-center text-gray-500">
//               No tokens found
//             </div>
//           ) : (
//             <div className="divide-y divide-gray-100">
//               {filteredTokens.map((token) => {
//                 const balance = balances[token.address] || "0";
//                 const isSelected = selectedToken?.address === token.address;

//                 return (
//                   <button
//                     key={token.address}
//                     onClick={() => {
//                       onSelect(token);
//                       onClose();
//                     }}
//                     className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors ${
//                       isSelected ? "bg-blue-50" : ""
//                     }`}
//                     disabled={isSelected}
//                   >
//                     {/* Token Icon */}
//                     <div className="flex-shrink-0">
//                       {getTokenIcon(token)}
//                     </div>

//                     {/* Token Info */}
//                     <div className="flex-1 text-left min-w-0">
//                       <div className="flex items-center gap-2">
//                         <span className="font-semibold text-gray-900">
//                           {token.symbol}
//                         </span>
//                         {isSelected && (
//                           <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
//                             Selected
//                           </span>
//                         )}
//                       </div>
//                       <div className="text-sm text-gray-500 truncate">
//                         {token.name}
//                       </div>
//                       {token.address && (
//                         <div className="text-xs text-gray-400 font-mono truncate">
//                           {token.address.substring(0, 6)}...
//                           {token.address.substring(token.address.length - 4)}
//                         </div>
//                       )}
//                     </div>

//                     {/* Balance */}
//                     <div className="text-right flex-shrink-0">
//                       <div className="font-medium text-gray-900">
//                         {formatNumber(balance, 4)}
//                       </div>
//                       <div className="text-xs text-gray-500">Balance</div>
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Footer */}
//         {filteredTokens.length > 0 && (
//           <div className="p-4 border-t border-gray-200">
//             <div className="text-sm text-gray-500 text-center">
//               {filteredTokens.length} token{filteredTokens.length !== 1 ? "s" : ""} found
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// Main PancakeSwapDApp Component
const PancakeSwapDApp = () => {
  // Use Web3 context for global state
  const {
    provider,
    account,
    isConnected,
    chainId,
    connectWallet,
    loading: web3Loading,
  } = useWeb3();

  // Local state
  const [tokens, setTokens] = useState([]);
  const [fromToken, setFromToken] = useState(null);
  const [toToken, setToToken] = useState(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [balances, setBalances] = useState({});
  const [slippage, setSlippage] = useState(0.5);
  const [swapLoading, setSwapLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [priceImpact, setPriceImpact] = useState(0);
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Memoized contracts based on chain
  const activeContracts = useMemo(() => 
    getContractsForChain(chainId),
    [chainId]
  );

  const networkName = 
    chainId === "0x38" ? "BSC Mainnet" :
    chainId === "0x61" ? "BSC Testnet" : "Unknown Network";

  // Check if we're on a supported network
  const isSupportedNetwork = chainId === "0x38" || chainId === "0x61";

  // Load tokens when chain changes
  useEffect(() => {
    if (chainId) {
      const chainTokens = getTokensForChain(chainId);
      setTokens(chainTokens);

      if (chainTokens.length > 0 && !fromToken) {
        setFromToken(chainTokens[0]);
        setToToken(chainTokens[1] || chainTokens[0]);
      }
    }
  }, [chainId, fromToken]);

  // Load balances
  const loadBalances = useCallback(async (userAccount, currentProvider, currentChainId) => {
    if (!currentProvider || !userAccount || !currentChainId) return;

    const chainTokens = getTokensForChain(currentChainId);
    const newBalances = {};

    try {
      for (const token of chainTokens) {
        if (token.isNative) {
          const balance = await currentProvider.getBalance(userAccount);
          newBalances[token.address] = formatEther(balance);
        } else {
          try {
            const contract = new Contract(token.address, ERC20_ABI, currentProvider);
            const balance = await contract.balanceOf(userAccount);
            newBalances[token.address] = formatUnits(balance, token.decimals);
          } catch {
            newBalances[token.address] = "0";
          }
        }
      }
      setBalances(newBalances);
    } catch (error) {
      console.error("Error loading balances:", error);
    }
  }, []);

  // Load balances when account or chain changes
  useEffect(() => {
    if (isConnected && provider && account && chainId) {
      loadBalances(account, provider, chainId);
    }
  }, [isConnected, provider, account, chainId, loadBalances]);

  // Price Quote function
  const getPriceQuote = useCallback(async () => {
    if (!provider || !fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken || !activeContracts.ROUTER) {
      setToAmount("");
      setExchangeRate(0);
      setPriceImpact(0);
      return;
    }

    setPriceLoading(true);
    setError("");

    try {
      const router = new Contract(activeContracts.ROUTER, ROUTER_ABI, provider);
      const amountIn = parseUnits(fromAmount, fromToken.decimals);

      let path = [fromToken.address, toToken.address];
      if (fromToken.address !== activeContracts.WBNB && toToken.address !== activeContracts.WBNB) {
        path = [fromToken.address, activeContracts.WBNB, toToken.address];
      }

      const amounts = await router.getAmountsOut(amountIn, path);
      const outputAmount = amounts[amounts.length - 1];
      const formattedOutput = formatUnits(outputAmount, toToken.decimals);

      setToAmount(formattedOutput);
      setExchangeRate(parseFloat(formattedOutput) / parseFloat(fromAmount));
      const impact = Math.min((parseFloat(fromAmount) / 1000) * 0.3, 5);
      setPriceImpact(impact);
    } catch (error) {
      console.error("Error getting price quote:", error);
      setError("Unable to get price quote. Please check your input.");
      setToAmount("0");
      setExchangeRate(0);
      setPriceImpact(0);
    } finally {
      setPriceLoading(false);
    }
  }, [provider, fromAmount, fromToken, toToken, activeContracts]);

  // Debounce getPriceQuote
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromAmount && provider && fromToken && toToken) {
        getPriceQuote();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [fromAmount, fromToken, toToken, provider, getPriceQuote]);

  // Execute swap
  const executeSwap = async () => {
    if (!provider || !account || !fromAmount || !toAmount || !activeContracts.ROUTER) return;

    setSwapLoading(true);
    setError("");

    try {
      // Get signer locally for this transaction
      const signer = await provider.getSigner();
      const router = new Contract(activeContracts.ROUTER, ROUTER_ABI, signer);

      const amountIn = parseUnits(fromAmount, fromToken.decimals);
      const amountOutMin = parseUnits(
        (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(toToken.decimals),
        toToken.decimals
      );

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      let path;
      if (fromToken.isNative) {
        path = [activeContracts.WBNB, toToken.address];
      } else if (toToken.isNative) {
        path = [fromToken.address, activeContracts.WBNB];
      } else {
        path = [fromToken.address, activeContracts.WBNB, toToken.address];
      }

      let tx;

      if (fromToken.isNative && !toToken.isNative) {
        // BNB → Token
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          account,
          deadline,
          { value: amountIn }
        );
      } else if (!fromToken.isNative && toToken.isNative) {
        // Token → BNB
        tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          account,
          deadline
        );
      } else {
        // Token → Token
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          account,
          deadline
        );
      }

      console.log("TX SENT:", tx.hash);
      await tx.wait();

      setFromAmount("");
      setToAmount("");
      setApproved(false);

      // Reload balances after swap
      await loadBalances(account, provider, chainId);

    } catch (err) {
      console.error("Swap failed:", err);
      setError(err.reason || err.message || "Swap failed");
    } finally {
      setSwapLoading(false);
    }
  };

  // Handle token approval
  const handleApprove = async () => {
    if (!provider || !account || !fromToken || !fromAmount) return;

    setSwapLoading(true);
    setError("");

    try {
      // Get signer locally for approval
      const signer = await provider.getSigner();
      const tokenContract = new Contract(fromToken.address, ERC20_ABI, signer);
      const amountInBN = parseUnits(fromAmount, fromToken.decimals);

      const tx = await tokenContract.approve(activeContracts.ROUTER, amountInBN);
      await tx.wait();

      alert(`${fromToken.symbol} approved! You can now swap.`);
      setApproved(true);
    } catch (error) {
      console.error("Approval failed:", error);
      setError(error.message || "Approval failed.");
    } finally {
      setSwapLoading(false);
    }
  };

  // Swap tokens (reverse from/to)
  const swapTokens = () => {
    if (!fromToken || !toToken) return;
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount("");
    setToAmount("");
    setExchangeRate(0);
    setPriceImpact(0);
  };

  // Get token icon for button - UPDATED FOR RESPONSIVE
  const getTokenIcon = (token) => {
    if (token.logoURI) {
      return <span className="text-xl">{token.logoURI}</span>;
    }
    return (
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-pink-400 to-yellow-400 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-sm md:text-base">
          {token.symbol?.charAt(0) || "T"}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-yellow-400">
              <span className="text-white font-bold text-xl">🥞</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PancakeSwap</h1>
              <p className="text-xs text-gray-500">Clone DEX</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button className="text-gray-700 hover:text-gray-900 font-medium">Swap</button>
            <button className="text-gray-700 hover:text-gray-900 font-medium">Liquidity</button>
            <button className="text-gray-700 hover:text-gray-900 font-medium">Farms</button>
            <button className="text-gray-700 hover:text-gray-900 font-medium">Pools</button>
            
            {/* Network Indicator */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isSupportedNetwork ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium text-gray-700">
                {chainId === "0x38" && "BSC"}
                {chainId === "0x61" && "BSC Test"}
                {!isSupportedNetwork && "Unsupported"}
              </span>
            </div>

            {/* Wallet Button */}
            {!isConnected ? (
              <button
                onClick={connectWallet}
                disabled={web3Loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-yellow-600 transition-all disabled:opacity-50"
              >
                {web3Loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-mono text-sm text-green-800">
                    {formatAddress(account)}
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col space-y-3">
              <button className="text-gray-700 hover:text-gray-900 py-2">Swap</button>
              <button className="text-gray-700 hover:text-gray-900 py-2">Liquidity</button>
              <button className="text-gray-700 hover:text-gray-900 py-2">Farms</button>
              <button className="text-gray-700 hover:text-gray-900 py-2">Pools</button>
              
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-lg font-medium"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-mono text-sm text-gray-700 truncate">{account}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Swap Card */}
            <div className="lg:col-span-2">
              {/* Stats Bar */}
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500">TVL</div>
                  <div className="text-lg font-bold text-gray-900">$2.1B</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500">Volume 24H</div>
                  <div className="text-lg font-bold text-gray-900">$189M</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500">Fees 24H</div>
                  <div className="text-lg font-bold text-gray-900">$945K</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500">APR</div>
                  <div className="text-lg font-bold text-green-600">38.5%</div>
                </div>
              </div>

              {/* Swap Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Swap Tokens
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Chart">
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-medium mb-3 text-gray-700 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Transaction Settings
                    </h3>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Slippage Tolerance
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[0.1, 0.5, 1.0, 3.0].map((value) => (
                          <button
                            key={value}
                            onClick={() => setSlippage(value)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              slippage === value
                                ? "bg-gradient-to-r from-pink-500 to-yellow-500 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            {value}%
                          </button>
                        ))}
                        <div className="relative">
                          <input
                            type="number"
                            value={slippage}
                            onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                            className="w-24 px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                            step="0.1"
                            min="0"
                            max="50"
                            placeholder="Custom"
                          />
                          <span className="absolute right-3 top-2.5 text-gray-400">%</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Higher slippage tolerance = higher chance of success
                      </div>
                    </div>
                  </div>
                )}

                {/* Network Warning */}
                {isConnected && !isSupportedNetwork && (
                  <div className="px-6 py-4 border-b border-yellow-200 bg-yellow-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-800">Unsupported Network</div>
                        <div className="text-sm text-yellow-700">
                          Please connect to Binance Smart Chain (Mainnet or Testnet)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="px-6 py-4 border-b border-red-200 bg-red-50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-800">Error</div>
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* From Token Input - UPDATED FOR RESPONSIVE */}
                <div className="p-6">
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">From</span>
                      <span className="text-sm text-gray-600">
                        Balance:{" "}
                        {fromToken
                          ? formatNumber(balances[fromToken.address] || "0", 4)
                          : "0"}
                        {fromToken && (
                          <button
                            onClick={() =>
                              setFromAmount(balances[fromToken.address] || "0")
                            }
                            className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                          >
                            MAX
                          </button>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        placeholder="0.0"
                        className="flex-1 min-w-0 text-3xl md:text-4xl font-bold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                        step="any"
                        min="0"
                      />
                      {fromToken && (
                        <button
                          onClick={() => setShowFromTokens(true)}
                          className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                        >
                          {getTokenIcon(fromToken)}
                          <span className="font-semibold text-gray-900 truncate max-w-[70px] sm:max-w-[100px]">
                            {fromToken.symbol}
                          </span>
                          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Swap Direction Button */}
                  <div className="flex justify-center -my-2 z-10 relative">
                    <button
                      onClick={swapTokens}
                      disabled={!fromToken || !toToken}
                      className="p-3 bg-gradient-to-r from-pink-500 to-yellow-500 text-white rounded-full border-4 border-white hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      title="Swap tokens"
                    >
                      <ArrowDownUp className="w-5 h-5" />
                    </button>
                  </div>

                  {/* To Token Input - UPDATED FOR RESPONSIVE */}
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-600">To (estimated)</span>
                      <span className="text-sm text-gray-600">
                        Balance:{" "}
                        {toToken
                          ? formatNumber(balances[toToken.address] || "0", 4)
                          : "0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                      <input
                        type="number"
                        value={toAmount}
                        readOnly
                        placeholder="0.0"
                        className="flex-1 min-w-0 text-3xl md:text-4xl font-bold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
                      />
                      <div className="flex items-center gap-2">
                        {priceLoading && (
                          <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                        )}
                        {toToken && (
                          <button
                            onClick={() => setShowToTokens(true)}
                            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0"
                          >
                            {getTokenIcon(toToken)}
                            <span className="font-semibold text-gray-900 truncate max-w-[70px] sm:max-w-[100px]">
                              {toToken.symbol}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Token Selector Modals */}
                  {showFromTokens && (
                    <TokenSelectorModal
                      tokens={tokens.filter((t) => t.address !== toToken?.address)}
                      selectedToken={fromToken}
                      onSelect={(token) => {
                        setFromToken(token);
                        setShowFromTokens(false);
                      }}
                      onClose={() => setShowFromTokens(false)}
                      title="Select a token"
                      balances={balances}
                    />
                  )}

                  {showToTokens && (
                    <TokenSelectorModal
                      tokens={tokens.filter((t) => t.address !== fromToken?.address)}
                      selectedToken={toToken}
                      onSelect={(token) => {
                        setToToken(token);
                        setShowToTokens(false);
                      }}
                      onClose={() => setShowToTokens(false)}
                      title="Select a token"
                      balances={balances}
                    />
                  )}

                  {/* Price Info */}
                  {fromToken && toToken && fromAmount && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                      <PriceInfo
                        fromToken={fromToken}
                        toToken={toToken}
                        fromAmount={fromAmount}
                        toAmount={toAmount}
                        exchangeRate={exchangeRate}
                        priceImpact={priceImpact}
                        slippage={slippage}
                        loading={priceLoading}
                      />
                    </div>
                  )}

                  {/* Swap Button */}
                  <div className="mt-8">
                    {!isConnected ? (
                      <button
                        onClick={connectWallet}
                        disabled={web3Loading}
                        className="w-full bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        {web3Loading ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
                            Connecting...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <Wallet className="w-5 h-5" />
                            Connect Wallet
                          </div>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isSupportedNetwork) return;
                          if (!fromToken.isNative && !approved) {
                            handleApprove();
                          } else {
                            executeSwap();
                          }
                        }}
                        disabled={
                          swapLoading ||
                          priceLoading ||
                          !isSupportedNetwork ||
                          !fromAmount ||
                          !toAmount ||
                          parseFloat(fromAmount) <= 0
                        }
                        className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                          !fromToken?.isNative && !approved
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                            : 'bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white'
                        }`}
                      >
                        {swapLoading ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
                            Processing...
                          </div>
                        ) : priceLoading ? (
                          <div className="flex items-center justify-center gap-3">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Getting Price...
                          </div>
                        ) : !fromAmount ? (
                          "Enter Amount"
                        ) : !fromToken?.isNative && !approved ? (
                          <div className="flex items-center justify-center gap-3">
                            <Shield className="w-5 h-5" />
                            Approve {fromToken?.symbol}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <Zap className="w-5 h-5" />
                            Swap {fromToken?.symbol} → {toToken?.symbol}
                          </div>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Security Info */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>Secured by PancakeSwap</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Contract: {activeContracts.ROUTER ? formatAddress(activeContracts.ROUTER) : 'Not available'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Info Panel */}
            <div className="space-y-6">
              {/* Market Stats */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Market Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600">BNB Price</span>
                    <span className="font-semibold text-gray-900">$321.45</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="text-gray-600">CAKE Price</span>
                    <span className="font-semibold text-gray-900">$2.84</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Pairs</span>
                    <span className="font-semibold text-gray-900">15,432</span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Swaps</h3>
                <div className="space-y-3">
                  {[
                    { from: "BNB", to: "CAKE", amount: "1.5", value: "$482" },
                    { from: "CAKE", to: "BUSD", amount: "100", value: "$284" },
                    { from: "BUSD", to: "USDT", amount: "500", value: "$500" },
                    { from: "ETH", to: "BNB", amount: "0.5", value: "$800" },
                  ].map((tx, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div>
                        <div className="font-medium text-gray-900">{tx.from} → {tx.to}</div>
                        <div className="text-sm text-gray-500">{tx.amount} {tx.from}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{tx.value}</div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-pink-500 to-yellow-500 rounded-2xl shadow-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Transactions</span>
                    <span className="font-bold">2.4M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Users Today</span>
                    <span className="font-bold">45.2K</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-bold">99.8%</span>
                  </div>
                  <div className="pt-3 border-t border-white/20">
                    <div className="text-sm opacity-90">Fast & Secure Swaps</div>
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-800 mb-1">Pro Tips</div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Use small amounts for testing</li>
                      <li>• Check slippage tolerance</li>
                      <li>• Verify contract addresses</li>
                      <li>• Keep some BNB for gas fees</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-yellow-400 flex items-center justify-center">
                <span className="text-white font-bold">🥞</span>
              </div>
              <div>
                <div className="font-bold text-gray-900">PancakeSwap Clone</div>
                <div className="text-sm text-gray-500">Decentralized Exchange</div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Docs</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">GitHub</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Twitter</a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Telegram</a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} PancakeSwap Clone. This is a demonstration interface.</p>
            <p className="mt-1">Use at your own risk. Always verify contract addresses.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PancakeSwapDApp;
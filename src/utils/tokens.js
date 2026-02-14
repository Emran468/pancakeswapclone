// Token list for BSC Mainnet
export const MAINNET_TOKENS = [
  {
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    symbol: "WBNB",
    name: "Wrapped BNB",
    decimals: 18,
    logoURI: "🔶",
    isNative: true,
  },
  {
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    symbol: "BUSD",
    name: "Binance USD",
    decimals: 18,
    logoURI: "💵",
    isNative: false,
  },
  {
    address: "0x55d398326f99059fF775485246999027B3197955",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    logoURI: "💚",
    isNative: false,
  },
  {
    address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    symbol: "CAKE",
    name: "PancakeSwap Token",
    decimals: 18,
    logoURI: "🥞",
    isNative: false,
  },
  {
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 18,
    logoURI: "🔵",
    isNative: false,
  },
];

// Token list for BSC Testnet
export const TESTNET_TOKENS = [
  {
    address: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
    symbol: "WBNB",
    name: "Wrapped BNB",
    decimals: 18,
    logoURI: "🔶",
    isNative: true,
  },
  {
    address: "0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7",
    symbol: "BUSD",
    name: "Binance USD",
    decimals: 18,
    logoURI: "💵",
    isNative: false,
  },
  {
    address: "0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 18,
    logoURI: "💚",
    isNative: false,
  },
   {
    address: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
    symbol: "DAI",
    name: "Dai Stablecoin (Testnet)",
    decimals: 18,
    logoURI: "🟡",
    isNative: false,
  },
   {
    address: "0xFa60D973F7642B748046464e165A65B7323b0DEE",
    symbol: "CAKE",
    name: "PancakeSwap Token (Testnet)",
    decimals: 18,
    logoURI: "🥞",
    isNative: false,
  },
];

export const getTokensForChain = (chainId) => {
  switch (chainId) {
    case "0x38": // BSC Mainnet
    case 56:
      return MAINNET_TOKENS;
    case "0x61": // BSC Testnet
    case 97:
      return TESTNET_TOKENS;
    default:
      return MAINNET_TOKENS;
  }
};

export const findTokenByAddress = (address, chainId) => {
  const tokens = getTokensForChain(chainId);
  return tokens.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
};

export const getTokenPair = (tokenA, tokenB, chainId) => {
  const WBNB_ADDRESS =
    chainId === "0x61" || chainId === 97
      ? "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
      : "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

  if (tokenA.address !== tokenB.address) {
    return [tokenA.address, tokenB.address];
  }

  if (tokenA.address !== WBNB_ADDRESS && tokenB.address !== WBNB_ADDRESS) {
    return [tokenA.address, WBNB_ADDRESS, tokenB.address];
  }

  return [tokenA.address, tokenB.address];
};


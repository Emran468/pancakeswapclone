    export const BSC_CONFIG={
    chainId: "0x38",
    chainName: "Binance Smart Chain",
    nativeCurrency: {
        name: "BNB",
        symbol: "BNB",
        decimals: 18,
    },
    rpcUrls:['https://bsc-dataseed.bnbchain.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    }

     export const BSC_TESTNET_CONFIG={
    chainId: "0x61",
    chainName: "BNB Smart Chain Testnet",
    nativeCurrency: {
        name: "tBNB",
        symbol: "tBNB",
        decimals: 18,
    },
    rpcUrls:['https://bsc-testnet-dataseed.bnbchain.org'],
    blockExplorerUrls: [' https://testnet.bscscan.com'],
    }

    export const CONTRACTS = {
  ROUTER: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  FACTORY: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
};
//  ROUTER: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
export const TESTNET_CONTRACTS = {
  ROUTER: "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3",
  FACTORY: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
  WBNB: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
};

export const getContractsForChain = (chainId) => {
  if (chainId === "0x61" || Number(chainId) === 97) {
    return TESTNET_CONTRACTS;
  }
  return CONTRACTS; // Mainnet
};


export const ROUTER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
    ],
    name: "getAmountsOut",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactETHForTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForETH",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
    {
  inputs: [
    { internalType: "uint256", name: "amountIn", type: "uint256" },
    { internalType: "uint256", name: "amountOutMin", type: "uint256" },
    { internalType: "address[]", name: "path", type: "address[]" },
    { internalType: "address", name: "to", type: "address" },
    { internalType: "uint256", name: "deadline", type: "uint256" },
  ],
  name: "swapExactTokensForTokens",
  outputs: [
    { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
  ],
  stateMutability: "nonpayable",
  type: "function",
}

];

export const ERC20_ABI = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
];


export const STAKING_ABI = [
 
  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "stake",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  

  {
    "inputs": [{"name": "amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  

  {
    "inputs": [],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  

  {
    "inputs": [{"name": "userAddress", "type": "address"}],
    "name": "pendingReward",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "stakes",
    "outputs": [
      {"name": "amount", "type": "uint256"},
      {"name": "rewardDebt", "type": "uint256"},
      {"name": "lastBlock", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalStaked",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardRatePerBlock",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];



import { ethers } from 'ethers';

// Network configurations by chain ID
export const NETWORKS = {
  // Local development (Hardhat)
  '31337': {
    chainId: '0x7a69',
    chainName: 'Hardhat Local',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['http://127.0.0.1:8545/'],
    blockExplorerUrls: []
  },
  // Sepolia Testnet
  '11155111': {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [process.env.REACT_APP_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo'],
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  }
};

// Current network configuration
const NETWORK_ID = process.env.REACT_APP_NETWORK_ID || '31337';
const CURRENT_NETWORK = NETWORKS[NETWORK_ID] || {
  chainId: '0x0',
  chainName: 'Unsupported Network',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: [],
  blockExplorerUrls: []
};

// Main network export
export const NETWORK = {
  ...CURRENT_NETWORK,
  chainId: process.env.REACT_APP_CHAIN_ID || CURRENT_NETWORK.chainId,
  chainName: process.env.REACT_APP_CHAIN_NAME || CURRENT_NETWORK.chainName,
  rpcUrl: process.env.REACT_APP_RPC_URL || (CURRENT_NETWORK.rpcUrls[0] || ''),
  blockExplorerUrl: process.env.REACT_APP_BLOCK_EXPLORER_URL || (CURRENT_NETWORK.blockExplorerUrls[0] || '')
};

// Contract addresses from environment variables
export const CONTRACTS = {
  // DEX1 Tokens
  SEFI: process.env.REACT_APP_SEFI_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  CHLOE: process.env.REACT_APP_CHLOE_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  AMM1: process.env.REACT_APP_AMM1_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  
  // DEX2 Tokens
  ZOE: process.env.REACT_APP_ZOE_ADDRESS || '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
  MAGGIE: process.env.REACT_APP_MAGGIE_ADDRESS || '0x0165878A594ca255338adfa4d48449f69242Eb8F',
  AMM2: process.env.REACT_APP_AMM2_ADDRESS || '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
  
  // Aggregator
  AGGREGATOR: process.env.REACT_APP_AGGREGATOR_ADDRESS || '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'
};

// Default slippage tolerance (0.5%)
export const DEFAULT_SLIPPAGE = 0.5;

// Default transaction deadline in minutes
export const DEFAULT_DEADLINE = 20;

// List of supported tokens
export const SUPPORTED_TOKENS = ['SEFI', 'CHLOE', 'MAGGIE', 'ZOE'];

// Token addresses by symbol for quick lookup
export const TOKEN_ADDRESSES = {
  SEFI: CONTRACTS.SEFI,
  CHLOE: CONTRACTS.CHLOE,
  MAGGIE: CONTRACTS.MAGGIE,
  ZOE: CONTRACTS.ZOE
};
  
// Token metadata with additional details
export const TOKENS = {
  SEFI: {
    address: CONTRACTS.SEFI,
    name: 'Sefi',
    symbol: 'SEFI',
    decimals: 18,
    logo: '🟢',
    color: '#10B981',
    description: 'The primary token of the DEX ecosystem',
    icon: '/tokens/sefi.png',
    isStablecoin: false,
    isNative: false,
    isWhitelisted: true
  },
  CHLOE: {
    address: CONTRACTS.CHLOE,
    name: 'Chloe',
    symbol: 'CHLOE',
    decimals: 18,
    logo: '🔵',
    color: '#3B82F6',
    description: 'A stable token pegged to a basket of assets',
    icon: '/tokens/chloe.png',
    isStablecoin: true,
    isNative: false,
    isWhitelisted: true
  },
  ZOE: {
    address: CONTRACTS.ZOE,
    name: 'Zoe',
    symbol: 'ZOE',
    decimals: 18,
    logo: '🟣',
    color: '#8B5CF6',
    description: 'A governance token for the ecosystem',
    icon: '/tokens/zoe.png',
    isStablecoin: false,
    isNative: false,
    isWhitelisted: true
  },
  MAGGIE: {
    address: CONTRACTS.MAGGIE,
    name: 'Maggie',
    symbol: 'MAGGIE',
    decimals: 18,
    logo: '🟠',
    color: '#F59E0B',
    description: 'A utility token for platform fees',
    icon: '/tokens/maggie.png',
    isStablecoin: false,
    isNative: false,
    isWhitelisted: true
  }
};

// Default token list for the DEX
export const DEFAULT_TOKENS = [
  TOKENS.SEFI,
  TOKENS.CHLOE,
  TOKENS.ZOE,
  TOKENS.MAGGIE
];

// Default token pairs for the DEX
export const DEFAULT_PAIRS = [
  [TOKENS.SEFI, TOKENS.CHLOE],
  [TOKENS.ZOE, TOKENS.MAGGIE],
  [TOKENS.SEFI, TOKENS.ZOE],
  [TOKENS.CHLOE, TOKENS.MAGGIE]
];

// Contract ABIs
export const ABI = {
  ERC20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],
  BaseAMM: [
    // Views
    'function token1() view returns (address)',
    'function token2() view returns (address)',
    'function token1Balance() view returns (uint256)',
    'function token2Balance() view returns (uint256)',
    'function totalShares() view returns (uint256)',
    'function shares(address) view returns (uint256)',
    'function getAmountOut(uint256 amountIn, address tokenIn) view returns (uint256)',
    'function getReserves() view returns (uint256, uint256)',
    'function FEE() view returns (uint256)',
    'function FEE_BASE() view returns (uint256)',
    'function K() view returns (uint256)',
    
    // Mutations
    'function swap(uint256 amountIn, uint256 minAmountOut, address tokenIn, address to) external',
    'function addLiquidity(uint256 amount1, uint256 amount2) external',
    'function removeLiquidity(uint256 shares) external',
    
    // Events
    'event AddLiquidity(address indexed provider, uint256 amount1, uint256 amount2, uint256 shares)',
    'event RemoveLiquidity(address indexed provider, uint256 amount1, uint256 amount2, uint256 shares)',
    'event Swap(address indexed from, address tokenIn, uint256 amountIn, uint256 amountOut)'
  ],
  
  AMM: [
    // Inherited from BaseAMM
    'function token1() view returns (address)',
    'function token2() view returns (address)',
    'function getAmountOut(uint256 amountIn, address tokenIn) view returns (uint256)',
    'function swap(uint256 amountIn, uint256 minAmountOut, address tokenIn, address to) external',
    'function addLiquidity(uint256 amount1, uint256 amount2) external',
    'function removeLiquidity(uint256 shares) external',
    
    // Events
    'event AddLiquidity(address indexed provider, uint256 amount1, uint256 amount2, uint256 shares)',
    'event RemoveLiquidity(address indexed provider, uint256 amount1, uint256 amount2, uint256 shares)',
    'event Swap(address indexed from, address tokenIn, uint256 amountIn, uint256 amountOut)'
  ],
  
  Aggregator: [
    // Views
    'function dex1() view returns (address)',
    'function dex2() view returns (address)',
    'function getBestPrice(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256 amountOut, address bestDex)',
    'function getDex1Price(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)',
    'function getDex2Price(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)',
    
    // Mutations
    'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address recipient) external returns (uint256)',
    
    // Events
    'event BestTrade(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, address bestDex)'
  ]
};

// Default gas limits for different operations
export const GAS_LIMITS = {
  APPROVE: 50000,
  SWAP: 300000,
  ADD_LIQUIDITY: 500000,
  REMOVE_LIQUIDITY: 400000
};

// Default gas price settings
export const GAS_PRICE = {
  DEFAULT: '50', // 50 Gwei
  FAST: '60',    // 60 Gwei
  FASTEST: '70'  // 70 Gwei
};

// Transaction settings
export const TRANSACTION = {
  DEFAULT_GAS_LIMIT: 300000,
  DEFAULT_GAS_PRICE: ethers.utils.parseUnits('50', 'gwei').toString(),
  MAX_GAS_PRICE: ethers.utils.parseUnits('200', 'gwei').toString()
};

// UI Configuration
export const UI = {
  MAX_SLIPPAGE: 5, // 5% max slippage
  DEFAULT_SLIPPAGE: 0.5, // 0.5% default slippage
  SLIPPAGE_TOLERANCE: 0.5, // 0.5% default tolerance
  PRICE_IMPACT_WARNING_THRESHOLD: 3, // 3% price impact warning
  PRICE_IMPACT_HIGH_THRESHOLD: 5, // 5% high price impact
  PRICE_IMPACT_INVALID_THRESHOLD: 10 // 10% invalidates the trade
};

// API Endpoints
export const API = {
  PRICE_FEED: process.env.REACT_APP_PRICE_FEED_URL || 'https://api.coingecko.com/api/v3',
  EXPLORER: process.env.REACT_APP_EXPLORER_URL || 'https://api.etherscan.io/api',
  GRAPHQL: process.env.REACT_APP_GRAPHQL_URL || 'http://localhost:8000/subgraphs/name/dex-aggregator'
};

// Error messages
export const ERRORS = {
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity',
  INVALID_PAIR: 'Invalid token pair',
  INVALID_AMOUNT: 'Invalid amount',
  PRICE_IMPACT_TOO_HIGH: 'Price impact too high',
  SLIPPAGE_TOO_HIGH: 'Slippage tolerance exceeded',
  TRANSACTION_REJECTED: 'Transaction was rejected',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred'
};
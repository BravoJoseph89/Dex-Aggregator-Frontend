export const CONTRACTS = {
    // DEX1
    SEFI: '0xCB20BA2fA3E2D5E2dfbdA00d932f855cB9F74D59',
    CHLOE: '0xBD7d0444c9791d1462f5cb6108a49EDA9D633b1A',
    AMM1: '0xbC506636987538158A0AbdEC59F033A43c0Fc995',
    
    // DEX2
    ZOE: '0x0FcD4CD95B530830A2D7DC102EE2C8648F981a65',
    MAGGIE: '0x9E61B2Bf8Fb796e2ba95Ba00340F4F959C2417bc',
    AMM2: '0xfb3A49BdC2324c6621005a01A31DAc581F1BbdAb',
    
    // Aggregator
    AGGREGATOR: '0xAdB54d30B0b56246ce4DEeb5A89A4cc68296B87A'
  };
  
  export const TOKENS = {
    SEFI: {
      address: CONTRACTS.SEFI,
      name: 'Sefi',
      symbol: 'SEFI',
      decimals: 18,
      logo: '🟢'
    },
    CHLOE: {
      address: CONTRACTS.CHLOE,
      name: 'Chloe',
      symbol: 'CHLOE',
      decimals: 18,
      logo: '🔵'
    },
    ZOE: {
      address: CONTRACTS.ZOE,
      name: 'Zoe',
      symbol: 'ZOE',
      decimals: 18,
      logo: '🟣'
    },
    MAGGIE: {
      address: CONTRACTS.MAGGIE,
      name: 'Maggie',
      symbol: 'MAGGIE',
      decimals: 18,
      logo: '🟠'
    }
  };
  
  export const NETWORK = {
    chainId: '0xaa36a7',  // Sepolia Testnet
    chainName: 'Sepolia Test Network',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'], // Using Alchemy's public endpoint
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  };
  
  export const ABI = {
    // We'll add ABI interfaces here as we implement the components
    ERC20: [
      'function balanceOf(address) view returns (uint)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'function approve(address spender, uint256 amount) returns (bool)',
      'function allowance(address owner, address spender) view returns (uint256)'
    ]
  };
import { ethers } from 'ethers';
import { ABI } from '../config';

// Initialize provider and signer
let provider;
let signer;

export const initWeb3 = async () => {
  if (window.ethereum) {
    try {
      // Request account access if needed
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create Web3Provider and get the signer
      provider = new ethers.providers.Web3Provider(window.ethereum);
      signer = provider.getSigner();
      
      return { provider, signer };
    } catch (error) {
      console.error('User denied account access', error);
      throw error;
    }
  } else {
    throw new Error('No Ethereum provider detected. Please install MetaMask!');
  }
};

// Contract factory functions
export const getTokenContract = (address, providerOrSigner) => {
  if (!providerOrSigner) throw new Error('Provider or signer not provided');
  return new ethers.Contract(address, ABI.ERC20, providerOrSigner);
};

export const getAMMContract = (address, providerOrSigner) => {
  if (!providerOrSigner) throw new Error('Provider or signer not provided');
  return new ethers.Contract(address, ABI.AMM, providerOrSigner);
};

export const getBaseAMMContract = (address, providerOrSigner) => {
  if (!providerOrSigner) throw new Error('Provider or signer not provided');
  return new ethers.Contract(address, ABI.BaseAMM, providerOrSigner);
};

export const getAggregatorContract = (address, providerOrSigner) => {
  if (!providerOrSigner) throw new Error('Provider or signer not provided');
  return new ethers.Contract(address, ABI.Aggregator, providerOrSigner);
};

// Token approval helper
export const approveToken = async (tokenAddress, spender, amount, signer) => {
  if (!signer) throw new Error('Signer not provided');
  const token = getTokenContract(tokenAddress, signer);
  const tx = await token.approve(spender, amount);
  return tx;
};

// Get token allowance
export const getAllowance = async (tokenAddress, owner, spender, provider) => {
  if (!provider) throw new Error('Provider not provided');
  const token = getTokenContract(tokenAddress, provider);
  const allowance = await token.allowance(owner, spender);
  return allowance.toString();
};

// Format token amounts
export const formatTokenAmount = (amount, decimals = 18) => {
  return ethers.utils.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount, decimals = 18) => {
  return ethers.utils.parseUnits(amount.toString(), decimals);
};

// Get token balance
export const getTokenBalance = async (tokenAddress, account, provider) => {
  if (!provider) throw new Error('Provider not provided');
  const token = getTokenContract(tokenAddress, provider);
  try {
    const balance = await token.balanceOf(account);
    return balance.toString();
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
};

// Get token metadata
export const getTokenMetadata = async (tokenAddress, provider) => {
  if (!provider) throw new Error('Provider not provided');
  const token = getTokenContract(tokenAddress, provider);
  try {
    const [name, symbol, decimals] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals()
    ]);
    return { 
      name, 
      symbol, 
      decimals: decimals.toString(),
      address: tokenAddress
    };
  } catch (error) {
    console.error('Error getting token metadata:', error);
    throw error;
  }
};

// Get best price from aggregator
export const getBestPrice = async (aggregatorAddress, tokenIn, tokenOut, amountIn, provider) => {
  if (!provider) throw new Error('Provider not provided');
  const aggregator = getAggregatorContract(aggregatorAddress, provider);
  try {
    const [amountOut, bestDex] = await aggregator.getBestPrice(tokenIn, tokenOut, amountIn);
    return { 
      amountOut: amountOut.toString(), 
      bestDex,
      price: amountOut / amountIn,
      formattedPrice: (amountOut / amountIn).toFixed(8)
    };
  } catch (error) {
    console.error('Error getting best price:', error);
    throw error;
  }
};

// Execute swap through aggregator
export const executeSwap = async (
  aggregatorAddress, 
  tokenIn, 
  tokenOut, 
  amountIn, 
  minAmountOut, 
  recipient,
  signer,
  options = {}
) => {
  if (!signer) throw new Error('Signer not provided');
  const aggregator = getAggregatorContract(aggregatorAddress, signer);
  
  // Set default gas limit if not provided
  const gasLimit = options.gasLimit || 300000; // Default gas limit for swaps
  
  try {
    const tx = await aggregator.swap(
      tokenIn, 
      tokenOut, 
      amountIn, 
      minAmountOut, 
      recipient,
      { gasLimit }
    );
    
    // Wait for transaction to be mined if requested
    if (options.waitForConfirmation) {
      const receipt = await tx.wait();
      return { tx, receipt };
    }
    
    return { tx };
  } catch (error) {
    console.error('Error executing swap:', error);
    
    // Enhanced error handling
    if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      throw new Error('Transaction would fail. Check token balances and allowances.');
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient funds for gas.');
    } else if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Transaction reverted. Check token approvals and amounts.');
    }
    
    throw error;
  }
};

// Get reserves from AMM
export const getReserves = async (ammAddress, tokenA, tokenB, provider) => {
  if (!provider) throw new Error('Provider not provided');
  const amm = getBaseAMMContract(ammAddress, provider);
  try {
    const [reserveA, reserveB] = await amm.getReserves();
    return {
      [tokenA]: reserveA.toString(),
      [tokenB]: reserveB.toString(),
      totalLiquidity: (reserveA * reserveB).toString(),
      priceRatio: reserveB / reserveA,
      token1Balance: reserveA.toString(),
      token2Balance: reserveB.toString()
    };
  } catch (error) {
    console.error('Error getting reserves:', error);
    throw error;
  }
};

// Get price impact for a trade
export const getPriceImpact = (amountIn, reserveIn, reserveOut) => {
  const amountInWithFee = amountIn.mul(997); // 0.3% fee
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = reserveIn.mul(1000).add(amountInWithFee);
  const amountOut = numerator.div(denominator);
  
  const priceBefore = reserveOut.mul(ethers.utils.parseEther('1')).div(reserveIn);
  const priceAfter = reserveOut.sub(amountOut).mul(ethers.utils.parseEther('1')).div(reserveIn.add(amountIn));
  
  const priceImpact = priceBefore.sub(priceAfter).mul(10000).div(priceBefore);
  return parseFloat(ethers.utils.formatUnits(priceImpact, 2));
};

// Format token amount with decimals
export const formatTokenAmountWithDecimals = (amount, decimals = 18) => {
  return ethers.utils.formatUnits(amount.toString(), decimals);
};

// Parse token amount from string
export const parseTokenAmountFromString = (amount, decimals = 18) => {
  return ethers.utils.parseUnits(amount.toString(), decimals);
};

// Get transaction status
export const getTransactionStatus = async (txHash, provider) => {
  if (!provider) throw new Error('Provider not provided');
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    return {
      status: receipt.status === 1 ? 'success' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      confirmations: receipt.confirmations
    };
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw error;
  }
};

// Add event listeners for contract events
export const setupEventListeners = (contract, eventName, callback) => {
  contract.on(eventName, (...args) => {
    callback(...args);
  });
  
  // Return cleanup function
  return () => contract.removeAllListeners(eventName);
};

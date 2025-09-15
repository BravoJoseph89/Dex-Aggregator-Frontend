import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { 
  getBaseAMMContract,
  getTokenContract,
  formatTokenAmount,
  parseTokenAmount,
  getTokenMetadata
} from '../utils/web3Utils';
import { TOKENS, CONTRACTS, GAS_LIMITS } from '../config';
import { useWeb3React } from '@web3-react/core';

/**
 * Custom hook to interact with AMM (Automated Market Maker) contracts
 * @param {string} ammAddress - The address of the AMM contract
 * @returns {Object} - AMM state and methods
 */
export const useAMM = (ammAddress) => {
  const { account, library: provider, chainId } = useWeb3React();
  
  // State for AMM data
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // AMM contract instance
  const [contract, setContract] = useState(null);
  const [tokens, setTokens] = useState({
    token1: null, // { address, symbol, name, decimals, contract }
    token2: null
  });
  
  // Reserves and price data
  const [reserves, setReserves] = useState({
    reserve1: '0',        // Raw reserve amount of token1
    reserve2: '0',        // Raw reserve amount of token2
    reserve1Formatted: '0', // Formatted reserve amount of token1
    reserve2Formatted: '0', // Formatted reserve amount of token2
    price: '0',            // Current price (reserve2 / reserve1)
    formattedPrice: '0',    // Formatted price
    lastUpdated: null       // Timestamp of last update
  });
  
  // Liquidity data
  const [liquidity, setLiquidity] = useState({
    totalShares: '0',      // Total LP tokens in circulation
    totalSharesFormatted: '0',
    userShares: '0',       // User's LP token balance
    userSharesFormatted: '0',
    userSharePercentage: '0', // User's share of the pool (0-100%)
    token1Amount: '0',     // User's share of token1
    token2Amount: '0',     // User's share of token2
    token1AmountFormatted: '0',
    token2AmountFormatted: '0'
  });

  // Memoized contract instance with signer for transactions
  const contractWithSigner = useMemo(() => {
    if (!contract || !provider) return null;
    return contract.connect(provider.getSigner());
  }, [contract, provider]);

  /**
   * Initialize the AMM contract and fetch initial data
   */
  const initialize = useCallback(async () => {
    if (!provider || !ammAddress) return false;

    try {
      setIsLoading(true);
      setError(null);

      const signer = provider.getSigner();
      
      // Initialize AMM contract
      const ammContract = getBaseAMMContract(ammAddress, signer);
      
      try {
        // Get token addresses from AMM
        const [token1Address, token2Address] = await Promise.all([
          ammContract.token1(),
          ammContract.token2()
        ]);

        // Get token contracts with signer
        const token1Contract = getTokenContract(token1Address, signer);
        const token2Contract = getTokenContract(token2Address, signer);

        // Get token metadata in parallel
        const [
          token1Symbol, 
          token2Symbol,
          token1Decimals,
          token2Decimals,
          token1Name,
          token2Name
        ] = await Promise.all([
          token1Contract.symbol(),
          token2Contract.symbol(),
          token1Contract.decimals(),
          token2Contract.decimals(),
          token1Contract.name(),
          token2Contract.name()
        ]);

        // Create token info objects
        const token1Info = {
          ...TOKENS[token1Symbol],
          address: token1Address,
          symbol: token1Symbol,
          name: token1Name,
          decimals: token1Decimals,
          contract: token1Contract
        };

        const token2Info = {
          ...TOKENS[token2Symbol],
          address: token2Address,
          symbol: token2Symbol,
          name: token2Name,
          decimals: token2Decimals,
          contract: token2Contract
        };

        setTokens({
          token1: token1Info,
          token2: token2Info
        });

        setContract(ammContract);
        
        // Initial data fetch
        await refresh();
        
        // Set up event listeners
        setupEventListeners(ammContract);
        
        setIsInitialized(true);
        return true;
      } catch (err) {
        console.error('Error initializing AMM:', err);
        setError(`Failed to initialize AMM: ${err.message}`);
        return false;
      }
    } catch (err) {
      console.error('Error in initialize:', err);
      setError(`Failed to initialize: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [provider, ammAddress]);

  /**
   * Set up event listeners for the AMM contract
   */
  const setupEventListeners = useCallback((ammContract) => {
    if (!ammContract || !provider) return;
    
    const handleSwap = async (sender, amount0In, amount1In, amount0Out, amount1Out, to, event) => {
      console.log('Swap event:', { sender, amount0In, amount1In, amount0Out, amount1Out, to, event });
      await refresh();
    };
    
    const handleMint = async (sender, amount0, amount1, event) => {
      console.log('Mint event:', { sender, amount0, amount1, event });
      await refresh();
    };
    
    const handleBurn = async (sender, amount0, amount1, to, event) => {
      console.log('Burn event:', { sender, amount0, amount1, to, event });
      await refresh();
    };
    
    // Add event listeners
    ammContract.on('Swap', handleSwap);
    ammContract.on('Mint', handleMint);
    ammContract.on('Burn', handleBurn);
    
    // Cleanup function
    return () => {
      ammContract.off('Swap', handleSwap);
      ammContract.off('Mint', handleMint);
      ammContract.off('Burn', handleBurn);
    };
  }, [provider]);

  /**
   * Fetch reserves and liquidity data from the AMM
   */
  const fetchReserves = useCallback(async () => {
    if (!contract || !tokens.token1 || !tokens.token2) return null;

    try {
      setIsLoading(true);
      
      // Get reserves and total supply in parallel
      const [reserve1, reserve2, totalSupply] = await Promise.all([
        contract.getReserve1(),
        contract.getReserve2(),
        contract.totalSupply()
      ]);
      
      // Format reserve amounts
      const reserve1Formatted = formatTokenAmount(reserve1.toString(), tokens.token1.decimals);
      const reserve2Formatted = formatTokenAmount(reserve2.toString(), tokens.token2.decimals);
      
      // Calculate price (token2 per token1)
      const price = parseFloat(reserve2Formatted) / Math.max(parseFloat(reserve1Formatted), 1);
      
      // Prepare reserves data
      const reservesData = {
        reserve1: reserve1.toString(),
        reserve2: reserve2.toString(),
        reserve1Formatted,
        reserve2Formatted,
        price: price.toString(),
        formattedPrice: price.toFixed(8),
        lastUpdated: new Date().toISOString()
      };
      
      // Update reserves state
      setReserves(reservesData);
      
      // If user is connected, get their liquidity info
      if (account) {
        await fetchUserLiquidity();
      }
      
      return reservesData;
    } catch (err) {
      console.error('Error fetching reserves:', err);
      setError(`Failed to fetch pool reserves: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, tokens, account]);

  /**
   * Fetch user's liquidity position
   */
  const fetchUserLiquidity = useCallback(async () => {
    if (!contract || !account || !tokens.token1 || !tokens.token2) return null;
    
    try {
      setIsLoading(true);
      
      // Get user's LP token balance and total supply
      const [userShares, totalSupply] = await Promise.all([
        contract.balanceOf(account),
        contract.totalSupply()
      ]);
      
      // Get reserves
      const [reserve1, reserve2] = await Promise.all([
        contract.getReserve1(),
        contract.getReserve2()
      ]);
      
      // Calculate user's share of the pool
      let userSharePercentage = '0';
      let token1Amount = '0';
      let token2Amount = '0';
      
      if (totalSupply.gt(0)) {
        // Calculate user's share percentage (0-100)
        userSharePercentage = userShares
          .mul(ethers.BigNumber.from(10000))
          .div(totalSupply)
          .toNumber() / 100;
        
        // Calculate user's share of each token
        token1Amount = reserve1.mul(userShares).div(totalSupply);
        token2Amount = reserve2.mul(userShares).div(totalSupply);
      }
      
      // Format amounts
      const liquidityData = {
        totalShares: totalSupply.toString(),
        totalSharesFormatted: formatTokenAmount(totalSupply.toString(), 18), // LP tokens are 18 decimals
        userShares: userShares.toString(),
        userSharesFormatted: formatTokenAmount(userShares.toString(), 18),
        userSharePercentage: userSharePercentage.toFixed(2),
        token1Amount: token1Amount.toString(),
        token2Amount: token2Amount.toString(),
        token1AmountFormatted: formatTokenAmount(token1Amount.toString(), tokens.token1.decimals),
        token2AmountFormatted: formatTokenAmount(token2Amount.toString(), tokens.token2.decimals)
      };
      
      // Update liquidity state
      setLiquidity(liquidityData);
      
      return liquidityData;
    } catch (err) {
      console.error('Error fetching user liquidity:', err);
      setError(`Failed to fetch user liquidity: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, tokens]);

  /**
   * Calculate the amount of output tokens for a given input amount
   * @param {string} amountIn - The input amount as a string
   * @param {string} tokenInSymbol - Symbol of the input token (e.g., 'SEFI', 'CHLOE')
   * @returns {Promise<Object>} - Object containing swap details
   */
  const getAmountOut = useCallback(async (amountIn, tokenInSymbol) => {
    if (!contract || !tokens.token1 || !tokens.token2) {
      throw new Error('AMM not initialized');
    }
    
    try {
      // Determine which token is being swapped in
      const isToken1 = tokenInSymbol === tokens.token1.symbol;
      const tokenIn = isToken1 ? tokens.token1 : tokens.token2;
      const tokenOut = isToken1 ? tokens.token2 : tokens.token1;
      
      // Parse input amount with proper decimals
      const amountInWei = parseTokenAmount(amountIn, tokenIn.decimals);
      
      // Get amount out from the contract
      const amountOutWei = await contract.getAmountOut(
        amountInWei,
        tokenIn.address
      );
      
      // Format the output amount
      const amountOut = formatTokenAmount(amountOutWei.toString(), tokenOut.decimals);
      
      // Calculate price impact (slippage)
      const reserveIn = isToken1 ? reserves.reserve1 : reserves.reserve2;
      const reserveOut = isToken1 ? reserves.reserve2 : reserves.reserve1;
      
      let priceImpact = 0;
      let priceImpactFormatted = '0.00%';
      
      if (reserveIn && reserveOut) {
        const reserveInNum = parseFloat(formatTokenAmount(reserveIn, tokenIn.decimals));
        const reserveOutNum = parseFloat(formatTokenAmount(reserveOut, tokenOut.decimals));
        const amountInNum = parseFloat(amountIn);
        
        if (reserveInNum > 0 && reserveOutNum > 0) {
          // Calculate new reserves after swap
          const newReserveIn = reserveInNum + amountInNum;
          const newReserveOut = (reserveInNum * reserveOutNum) / newReserveIn;
          
          // Calculate effective price and market price
          const effectivePrice = amountInNum / (reserveOutNum - newReserveOut);
          const marketPrice = reserveInNum / reserveOutNum;
          
          // Calculate price impact percentage
          priceImpact = ((effectivePrice - marketPrice) / marketPrice) * 100;
          priceImpactFormatted = `${Math.max(0, priceImpact).toFixed(4)}%`;
        }
      }
      
      return {
        amountOut,
        amountOutWei: amountOutWei.toString(),
        priceImpact: Math.max(0, priceImpact),
        priceImpactFormatted,
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        tokenInAddress: tokenIn.address,
        tokenOutAddress: tokenOut.address
      };
    } catch (err) {
      console.error('Error calculating amount out:', err);
      setError(`Failed to calculate swap amount: ${err.message}`);
      throw err;
    }
  }, [contract, tokens, reserves]);

  /**
   * Add liquidity to the pool
   * @param {string} amount1 - Amount of token1 to add
   * @param {string} amount2 - Amount of token2 to add
   * @param {Object} options - Additional options
   * @param {string} options.minLiquidity - Minimum liquidity to receive (slippage protection)
   * @param {string} options.gasLimit - Custom gas limit
   * @param {string} options.gasPrice - Custom gas price
   * @returns {Promise<Object>} - Transaction receipt
   */
  const addLiquidity = useCallback(async (amount1, amount2, options = {}) => {
    if (!contractWithSigner || !account) {
      throw new Error('Not connected to wallet');
    }
    
    if (!tokens.token1 || !tokens.token2) {
      throw new Error('Tokens not initialized');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse input amounts with proper decimals
      const amount1Wei = parseTokenAmount(amount1, tokens.token1.decimals);
      const amount2Wei = parseTokenAmount(amount2, tokens.token2.decimals);
      
      // Connect token contracts with signer
      const token1Contract = tokens.token1.contract.connect(provider.getSigner());
      const token2Contract = tokens.token2.contract.connect(provider.getSigner());
      
      // Check current allowances in parallel
      const [allowance1, allowance2] = await Promise.all([
        token1Contract.allowance(account, contract.address),
        token2Contract.allowance(account, contract.address)
      ]);
      
      // Approve tokens if needed (using max uint256 to minimize future approvals)
      if (allowance1.lt(amount1Wei)) {
        const tx1 = await token1Contract.approve(
          contract.address, 
          ethers.constants.MaxUint256,
          { gasLimit: GAS_LIMITS.APPROVE }
        );
        await tx1.wait();
      }
      
      if (allowance2.lt(amount2Wei)) {
        const tx2 = await token2Contract.approve(
          contract.address, 
          ethers.constants.MaxUint256,
          { gasLimit: GAS_LIMITS.APPROVE }
        );
        await tx2.wait();
      }
      
      // Set slippage protection (default to 1%)
      const minLiquidity = options.minLiquidity || '0';
      const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
      
      // Execute addLiquidity transaction
      const tx = await contractWithSigner.addLiquidity(
        amount1Wei,
        amount2Wei,
        minLiquidity,
        deadline,
        {
          gasLimit: options.gasLimit || GAS_LIMITS.ADD_LIQUIDITY,
          gasPrice: options.gasPrice
        }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Update data after successful transaction
      await Promise.all([
        fetchReserves(),
        fetchUserLiquidity()
      ]);
      
      return {
        ...receipt,
        status: receipt.status === 1 ? 'success' : 'failed',
        transactionHash: receipt.transactionHash
      };
    } catch (err) {
      console.error('Error adding liquidity:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to add liquidity';
      if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction would fail. Check token approvals and amounts.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, contractWithSigner, account, provider, tokens, fetchReserves]);

  /**
   * Remove liquidity from the pool
   * @param {string} liquidityAmount - Amount of LP tokens to burn
   * @param {Object} options - Additional options
   * @param {string} options.minAmount1 - Minimum amount of token1 to receive
   * @param {string} options.minAmount2 - Minimum amount of token2 to receive
   * @param {string} options.gasLimit - Custom gas limit
   * @param {string} options.gasPrice - Custom gas price
   * @returns {Promise<Object>} - Transaction receipt
   */
  const removeLiquidity = useCallback(async (liquidityAmount, options = {}) => {
    if (!contractWithSigner || !account) {
      throw new Error('Not connected to wallet');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Parse LP token amount (18 decimals)
      const sharesWei = parseTokenAmount(liquidityAmount, 18);
      
      // Approve LP token spending if needed (for some AMM implementations)
      const allowance = await contract.allowance(account, contract.address);
      if (allowance.lt(sharesWei)) {
        const approveTx = await contract.approve(
          contract.address,
          ethers.constants.MaxUint256,
          { gasLimit: GAS_LIMITS.APPROVE }
        );
        await approveTx.wait();
      }
      
      // Remove liquidity
      const tx = await contractWithSigner.removeLiquidity(
        sharesWei,
        options.minAmount1 || '0',
        options.minAmount2 || '0',
        {
          gasLimit: options.gasLimit || GAS_LIMITS.REMOVE_LIQUIDITY,
          gasPrice: options.gasPrice
        }
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Update reserves
      await fetchReserves();
      
      return receipt;
    } catch (err) {
      console.error('Error removing liquidity:', err);
      setError('Failed to remove liquidity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract, account, fetchReserves]);

  // Initialize on mount and when dependencies change
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch reserves when contract or account changes
  useEffect(() => {
    if (isInitialized) {
      fetchReserves();
    }
  }, [isInitialized, fetchReserves]);

  return {
    // State
    isInitialized,
    contract,
    tokens: tokensData,
    reserves,
    liquidity,
    isLoading,
    error,

    // Methods
    initialize,
    refresh,
    fetchReserves,
    fetchUserLiquidity,
    getAmountOut,
    addLiquidity,
    removeLiquidity,

    // For convenience
    address: ammAddress,
    token1: tokensData.token1,
    token2: tokensData.token2,

    // Alias for backward compatibility
    getPoolData: fetchReserves
  };
};

export default useAMM;

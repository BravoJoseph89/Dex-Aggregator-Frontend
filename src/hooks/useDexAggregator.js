import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { 
  getTokenContract, 
  getBaseAMMContract,
  getAggregatorContract,
  getTokenBalance,
  formatTokenAmount,
  parseTokenAmount,
  getTokenMetadata,
  getBestPrice as getBestPriceUtil
} from '../utils/web3Utils';
import { TOKENS, CONTRACTS, SUPPORTED_TOKENS, GAS_LIMITS } from '../config';
import { useWeb3React } from '@web3-react/core';
import useAMM from './useAMM';

export const useDexAggregator = () => {
  const { account, library: provider, chainId } = useWeb3React();
  const [isInitialized, setIsInitialized] = useState(false);
  const [balances, setBalances] = useState({});
  const [prices, setPrices] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState({
    tokens: {},
    aggregator: null
  });
  
  // Initialize AMM hooks
  const amm1 = useAMM(CONTRACTS.AMM1);
  const amm2 = useAMM(CONTRACTS.AMM2);
  
  // Combined loading state from both AMMs and aggregator
  const combinedIsLoading = useMemo(() => {
    return isLoading || amm1.isLoading || amm2.isLoading;
  }, [isLoading, amm1.isLoading, amm2.isLoading]);
  
  // Combined error state
  const combinedError = useMemo(() => {
    return error || amm1.error || amm2.error;
  }, [error, amm1.error, amm2.error]);
  
  // Combined reserves from both AMMs
  const reserves = useMemo(() => ({
    amm1: amm1.reserves,
    amm2: amm2.reserves
  }), [amm1.reserves, amm2.reserves]);
  
  // Combined liquidity from both AMMs
  const liquidity = useMemo(() => ({
    amm1: amm1.liquidity,
    amm2: amm2.liquidity
  }), [amm1.liquidity, amm2.liquidity]);

  // Initialize contracts
  const initializeContracts = useCallback(async () => {
    if (!provider || !account) return;

    try {
      setIsLoading(true);
      setError(null);

      // Initialize token contracts
      const tokenContracts = {};
      for (const tokenSymbol of SUPPORTED_TOKENS) {
        const tokenInfo = TOKENS[tokenSymbol];
        if (tokenInfo) {
          tokenContracts[tokenSymbol] = getTokenContract(tokenInfo.address, provider);
        }
      }

      // Initialize Aggregator contract
      const signer = provider.getSigner();
      const aggregator = getAggregatorContract(CONTRACTS.AGGREGATOR, signer);

      setContracts(prev => ({
        ...prev,
        tokens: tokenContracts,
        aggregator
      }));

      // Initialize AMMs
      await Promise.all([
        amm1.initialize(),
        amm2.initialize()
      ]);

      // Fetch initial data
      await Promise.all([
        fetchBalances(account),
        fetchPrices()
      ]);

      setIsInitialized(true);
      return true;
    } catch (err) {
      console.error('Contract initialization error:', err);
      setError('Failed to initialize contracts');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [provider, account, amm1, amm2]);

  // Initialize when provider and account are available
  useEffect(() => {
    if (provider && account) {
      initializeContracts();
    }
  }, [provider, account, initializeContracts]);

  // Fetch token balances for the connected account
  const fetchBalances = useCallback(async (accountAddress) => {
    if (!accountAddress) return {};
    
    try {
      setIsLoading(true);
      const newBalances = {};
      
      // Fetch balance for each supported token
      for (const symbol of SUPPORTED_TOKENS) {
        const token = TOKENS[symbol];
        if (!token) continue;
        
        try {
          const balance = await getTokenBalance(token.address, accountAddress, provider);
          const formattedBalance = formatTokenAmount(balance, token.decimals);
          
          newBalances[symbol] = {
            raw: balance,
            formatted: formattedBalance,
            ...token
          };
        } catch (err) {
          console.error(`Error fetching ${symbol} balance:`, err);
          newBalances[symbol] = {
            raw: '0',
            formatted: '0',
            error: err.message,
            ...token
          };
        }
      }
      
      setBalances(newBalances);
      return newBalances;
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to fetch token balances');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Fetch prices for all token pairs
  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newPrices = {};
      const tokens = Object.values(TOKENS);
      
      // Get prices for all token pairs
      for (let i = 0; i < tokens.length; i++) {
        for (let j = 0; j < tokens.length; j++) {
          if (i === j) continue;
          
          const fromToken = tokens[i];
          const toToken = tokens[j];
          const amount = '1'; // Get price for 1 unit
          
          try {
            const result = await getBestPriceUtil(
              CONTRACTS.AGGREGATOR,
              fromToken.address,
              toToken.address,
              parseTokenAmount(amount, fromToken.decimals),
              provider
            );
            
            newPrices[`${fromToken.symbol}_${toToken.symbol}`] = {
              amountOut: formatTokenAmount(result.amountOut, toToken.decimals),
              price: result.price,
              formattedPrice: result.formattedPrice,
              bestDex: result.bestDex,
              timestamp: Date.now()
            };
          } catch (err) {
            console.error(`Error fetching price for ${fromToken.symbol}/${toToken.symbol}:`, err);
          }
        }
      }
      
      setPrices(prev => ({
        ...prev,
        ...newPrices
      }));
      
      return newPrices;
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Failed to fetch prices');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);
  
  // Get best price for a specific trade
  const getBestPrice = useCallback(async (fromToken, toToken, amount) => {
    if (!fromToken || !toToken || !amount) {
      throw new Error('Missing required parameters');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const fromTokenInfo = TOKENS[fromToken];
      const toTokenInfo = TOKENS[toToken];
      
      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error('Invalid token selection');
      }
      
      const amountInWei = parseTokenAmount(amount, fromTokenInfo.decimals);
      
      // Get best price from the aggregator
      const result = await getBestPriceUtil(
        CONTRACTS.AGGREGATOR,
        fromTokenInfo.address,
        toTokenInfo.address,
        amountInWei,
        provider
      );
      
      // Update prices state
      const priceInfo = {
        amountOut: formatTokenAmount(result.amountOut, toTokenInfo.decimals),
        price: result.price,
        formattedPrice: result.formattedPrice,
        bestDex: result.bestDex,
        timestamp: Date.now()
      };
      
      setPrices(prev => ({
        ...prev,
        [`${fromToken}_${toToken}`]: priceInfo
      }));
      
      return priceInfo;
    } catch (err) {
      console.error('Error getting best price:', err);
      setError('Failed to get best price');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  // Execute a swap
  const executeSwap = useCallback(async (fromToken, toToken, amount, minAmountOut, recipient = null, options = {}) => {
    if (!fromToken || !toToken || !amount) {
      throw new Error('Missing required parameters');
    }
    
    if (!account) {
      throw new Error('No connected account');
    }

    try {
      setIsLoading(true);
      setError(null);

      const fromTokenInfo = TOKENS[fromToken];
      const toTokenInfo = TOKENS[toToken];
      const recipientAddress = recipient || account;
      
      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error('Invalid token selection');
      }

      const amountInWei = parseTokenAmount(amount, fromTokenInfo.decimals);
      const minAmountOutWei = parseTokenAmount(minAmountOut, toTokenInfo.decimals);
      
      // Get the aggregator contract with signer
      const signer = provider.getSigner();
      const aggregator = getAggregatorContract(CONTRACTS.AGGREGATOR, signer);
      
      // Approve token if needed
      const tokenContract = getTokenContract(fromTokenInfo.address, signer);
      const allowance = await tokenContract.allowance(account, CONTRACTS.AGGREGATOR);
      
      if (allowance.lt(amountInWei)) {
        const approveTx = await tokenContract.approve(
          CONTRACTS.AGGREGATOR,
          ethers.constants.MaxUint256,
          { gasLimit: GAS_LIMITS.APPROVE }
        );
        await approveTx.wait();
      }
      
      // Execute the swap through the aggregator
      const tx = await aggregator.swap(
        fromTokenInfo.address,
        toTokenInfo.address,
        amountInWei,
        minAmountOutWei,
        recipientAddress,
        { 
          gasLimit: options.gasLimit || GAS_LIMITS.SWAP,
          gasPrice: options.gasPrice
        }
      );
      
      const receipt = await tx.wait();
      
      // Update data after successful swap
      await Promise.all([
        fetchBalances(account),
        fetchPrices()
      ]);
      
      // Get the best DEX used for the swap
      let bestDex = 'Unknown';
      try {
        const bestPrice = await getBestPrice(fromToken, toToken, amount);
        bestDex = bestPrice.bestDex === CONTRACTS.AMM1 ? 'AMM1' : 'AMM2';
      } catch (e) {
        console.error('Error getting best DEX after swap:', e);
      }

      return {
        transactionHash: receipt.transactionHash,
        fromToken,
        toToken,
        amountIn: amount,
        amountOut: minAmountOut,
        dex: bestDex,
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (err) {
      console.error('Error executing swap:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = 'Failed to execute swap';
      if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas';
      } else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = 'Transaction would fail. Check token approvals and amounts.';
      } else if (err.message.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
        errorMessage = 'Insufficient output amount. Try increasing slippage.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [account, provider, fetchBalances, fetchPrices, getBestPrice]);

  // Set up event listeners for account and chain changes
  useEffect(() => {
    if (!provider) return;
    
    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        fetchBalances(accounts[0]);
      } else {
        // Handle account disconnect
        setBalances({});
      }
    };
    
    const handleChainChanged = () => {
      window.location.reload();
    };
    
    // Set up listeners
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    // Initial data fetch
    if (account) {
      fetchBalances(account);
      fetchPrices();
    }
    
    // Clean up
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [provider, account, fetchBalances, fetchPrices]);

  return {
    // State
    isInitialized: isInitialized && amm1.isInitialized && amm2.isInitialized,
    contracts,
    balances,
    prices,
    reserves,
    liquidity,
    isLoading: combinedIsLoading,
    error: combinedError,
    
    // AMM instances
    amm1,
    amm2,
    
    // Methods
    initializeContracts,
    fetchBalances,
    fetchPrices,
    getBestPrice,
    executeSwap,
    
    // Refresh all data
    refresh: async () => {
      await Promise.all([
        fetchBalances(account),
        fetchPrices(),
        amm1.refresh(),
        amm2.refresh()
      ]);
    }
  };
};

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useDexAggregator } from '../hooks/useDexAggregator';

// Create context
const DexAggregatorContext = createContext();

// Supported tokens
const SUPPORTED_TOKENS = ['SEFI', 'CHLOE', 'MAGGIE', 'ZOE'];

// Initial state
const initialState = {
  fromToken: 'SEFI',  // Default from token
  toToken: 'CHLOE',   // Default to token
  amount: '',
  slippage: 0.5,      // 0.5% default slippage
  isSwapping: false,
  isLoading: false,
  error: null,
  txHash: null,
  lastSwap: null,
  tokenBalances: {},
  supportedTokens: SUPPORTED_TOKENS,
};

// Reducer function
function reducer(state, action) {
  switch (action.type) {
    case 'SET_FROM_TOKEN':
      // If setting to the same as toToken, swap them
      if (action.payload === state.toToken) {
        return { ...state, fromToken: state.toToken, toToken: state.fromToken };
      }
      return { ...state, fromToken: action.payload };
    case 'SET_TO_TOKEN':
      // If setting to the same as fromToken, swap them
      if (action.payload === state.fromToken) {
        return { ...state, toToken: state.fromToken, fromToken: state.toToken };
      }
      return { ...state, toToken: action.payload };
    case 'SET_AMOUNT':
      return { ...state, amount: action.payload };
    case 'SET_SLIPPAGE':
      return { ...state, slippage: action.payload };
    case 'SWAP_TOKENS':
      return {
        ...state,
        fromToken: state.toToken,
        toToken: state.fromToken,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_BALANCES':
      return { ...state, tokenBalances: { ...action.payload } };
    case 'SWAP_START':
      return { 
        ...state, 
        isSwapping: true, 
        isLoading: true,
        txHash: null, 
        error: null 
      };
    case 'SWAP_SUCCESS':
      return {
        ...state,
        isSwapping: false,
        isLoading: false,
        txHash: action.payload.txHash,
        lastSwap: {
          fromToken: state.fromToken,
          toToken: state.toToken,
          amount: state.amount,
          amountOut: action.payload.amountOut,
          txHash: action.payload.txHash,
          timestamp: Date.now(),
        },
        amount: '', // Reset amount after successful swap
      };
    case 'SWAP_ERROR':
      return { ...state, isSwapping: false, error: action.payload };
    case 'RESET_SWAP':
      return { ...initialState };
    default:
      return state;
  }
}

// Provider component
const DexAggregatorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { getBestPrice, executeSwap, fetchBalances } = useDexAggregator();

  // Set loading state
  const setLoading = useCallback((isLoading) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);

  // Set error
  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Set from token
  const setFromToken = useCallback((token) => {
    if (!state.supportedTokens.includes(token)) {
      setError(`Token ${token} is not supported`);
      return;
    }
    dispatch({ type: 'SET_FROM_TOKEN', payload: token });
  }, [state.supportedTokens, setError]);

  // Set to token
  const setToToken = useCallback((token) => {
    if (!state.supportedTokens.includes(token)) {
      setError(`Token ${token} is not supported`);
      return;
    }
    dispatch({ type: 'SET_TO_TOKEN', payload: token });
  }, [state.supportedTokens, setError]);

  // Set amount
  const setAmount = useCallback((amount) => {
    // Validate amount is a positive number or empty string
    if (amount !== '' && (isNaN(amount) || parseFloat(amount) < 0)) {
      setError('Please enter a valid amount');
      return;
    }
    dispatch({ type: 'SET_AMOUNT', payload: amount });
  }, [setError]);

  // Set slippage
  const setSlippage = useCallback((slippage) => {
    if (isNaN(slippage) || slippage < 0 || slippage > 100) {
      setError('Slippage must be between 0 and 100');
      return;
    }
    dispatch({ type: 'SET_SLIPPAGE', payload: slippage });
  }, []);
  
  // Reset swap state
  const resetSwap = useCallback(() => {
    dispatch({ type: 'RESET_SWAP' });
  }, []);
  
  // Value to provide to consumers
  const value = {
    ...state,
    ...dexAggregator,
    executeSwap,
    getPrice,
    switchTokens,
    setFromToken,
    setToToken,
    setAmount,
    setSlippage,
    resetSwap,
  };
  
  return (
    <DexAggregatorContext.Provider value={value}>
      {children}
    </DexAggregatorContext.Provider>
  );
};

// Custom hook to use the DexAggregator context
export const useDexAggregatorContext = () => {
  const context = useContext(DexAggregatorContext);
  if (!context) {
    throw new Error('useDexAggregatorContext must be used within a DexAggregatorProvider');
  }
  return context;
};

export default DexAggregatorContext;

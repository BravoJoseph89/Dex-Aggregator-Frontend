import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  fromToken: 'SEFI',
  toToken: 'CHLOE',
  amount: '',
  isSwapping: false,
  error: null,
  priceImpact: '0.5', // in percentage
  exchangeRate: 0.95, // 1 fromToken = 0.95 toToken
};

export const executeSwap = createAsyncThunk(
  'swap/execute',
  async (_, { getState }) => {
    const { swap } = getState();
    // Simulate API call or blockchain transaction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          fromToken: swap.fromToken,
          toToken: swap.toToken,
          amount: swap.amount,
          received: (parseFloat(swap.amount) * swap.exchangeRate).toFixed(4),
          txHash: '0x' + Math.random().toString(16).substring(2, 66)
        });
      }, 2000);
    });
  }
);

const swapSlice = createSlice({
  name: 'swap',
  initialState,
  reducers: {
    setFromToken: (state, action) => {
      state.fromToken = action.payload;
    },
    setToToken: (state, action) => {
      state.toToken = action.payload;
    },
    setAmount: (state, action) => {
      state.amount = action.payload;
    },
    switchTokens: (state) => {
      const temp = state.fromToken;
      state.fromToken = state.toToken;
      state.toToken = temp;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSwap: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(executeSwap.pending, (state) => {
        state.isSwapping = true;
        state.error = null;
      })
      .addCase(executeSwap.fulfilled, (state, action) => {
        state.isSwapping = false;
        state.amount = '';
        // In a real app, you might want to update balances here
      })
      .addCase(executeSwap.rejected, (state, action) => {
        state.isSwapping = false;
        state.error = action.error.message || 'Swap failed';
      });
  },
});

export const {
  setFromToken,
  setToToken,
  setAmount,
  switchTokens,
  clearError,
  resetSwap,
} = swapSlice.actions;

export default swapSlice.reducer;

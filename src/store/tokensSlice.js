import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  balances: {
    SEFI: '0',
    CHLOE: '0',
    ZOE: '0',
    MAGGIE: '0',
  },
  isLoading: false,
  error: null,
};

export const fetchBalances = createAsyncThunk(
  'tokens/fetchBalances',
  async (_, { getState }) => {
    // In a real app, you would fetch actual token balances here
    // This is mock data for demonstration
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          SEFI: '1000.00',
          CHLOE: '500.00',
          ZOE: '2000.00',
          MAGGIE: '750.00',
        });
      }, 1000);
    });
  }
);

const tokensSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    updateBalance: (state, action) => {
      const { token, balance } = action.payload;
      state.balances[token] = balance;
    },
    resetBalances: (state) => {
      state.balances = initialState.balances;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalances.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.balances = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchBalances.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { updateBalance, resetBalances } = tokensSlice.actions;

export default tokensSlice.reducer;

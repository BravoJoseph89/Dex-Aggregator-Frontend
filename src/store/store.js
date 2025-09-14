import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import tokensReducer from './slices/tokensSlice';
import swapReducer from './slices/swapSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    tokens: tokensReducer,
    swap: swapReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['wallet/setProvider'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.provider'],
        // Ignore these paths in the state
        ignoredPaths: ['wallet.provider'],
      },
    }),
});

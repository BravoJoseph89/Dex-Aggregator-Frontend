import React, { useState } from 'react';
import { useAppContext } from '../contexts';
import { TOKENS } from '../config';
import styled, { keyframes } from 'styled-components';
import { parseTokenAmount } from '../utils/web3Utils';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SwapContainer = styled.div`
  max-width: 450px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  animation: ${fadeIn} 0.3s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const SettingsButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: rgba(255, 255, 255, 0.1);
  }
`;

const TokenInput = styled.div`
  background: ${({ theme }) => theme.colors.surfaceLight};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.surfaceLighter};
`;

const InputRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.5rem;
  width: 100%;
  outline: none;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const Balance = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  
  button {
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    padding: 0 0.25rem;
    margin-left: 0.25rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const TokenSelect = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceLighter};
  padding: 0.5rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }
`;


const Swap = () => {
  const { account, balances, executeSwap, fetchBalances } = useAppContext();
  const [fromToken, setFromToken] = useState('SEFI');
  const [toToken, setToToken] = useState('CHLOE');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState('');
  const [priceImpact, setPriceImpact] = useState(0);
  const [loadingQuote, setLoadingQuote] = useState(false);


  // Handle amount input
  const handleFromAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
      setToAmount('');
      setError('');
      
      // If we have a valid amount, fetch quote
      if (value && parseFloat(value) > 0) {
        fetchQuote(value);
      }
    }
  };

  // Fetch quote for the swap
  const fetchQuote = async (amount) => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoadingQuote(true);
    try {
      // In a real implementation, you would call your backend or smart contract
      // to get the quote. For now, we'll simulate a small delay.
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate a price impact calculation (1-5%)
      const simulatedImpact = 1 + Math.random() * 4;
      setPriceImpact(simulatedImpact);
      
      // Simulate a price (1:1 with small variation)
      const price = 0.95 + Math.random() * 0.1; // Random price between 0.95 and 1.05
      setToAmount((parseFloat(amount) * price).toFixed(6));
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Failed to fetch price. Please try again.');
    } finally {
      setLoadingQuote(false);
    }
  };

  // Handle swap
  const handleSwap = async () => {
    if (!account) {
      setError('Please connect your wallet');
      return;
    }
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!toToken || !fromToken) {
      setError('Please select tokens');
      return;
    }
    
    setIsSwapping(true);
    setError('');
    
    try {
      // Calculate minimum amount out with slippage
      const amountIn = parseTokenAmount(fromAmount, TOKENS[fromToken].decimals);
      const amountOut = parseTokenAmount(toAmount, TOKENS[toToken].decimals);
      const minAmountOut = Math.floor(amountOut * (1 - slippage / 100));
      
      // Execute the swap
      const tx = await executeSwap(
        TOKENS[fromToken].address,
        TOKENS[toToken].address,
        amountIn.toString(),
        minAmountOut.toString(),
        account
      );
      
      // Wait for transaction to be mined
      await tx.wait();
      
      // Refresh balances
      await fetchBalances(account);
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      
      // Show success message
      // In a real app, you might want to show a toast notification here
      alert('Swap completed successfully!');
      
    } catch (err) {
      console.error('Swap error:', err);
      setError(err.message || 'Failed to execute swap. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  // Max button handler
  const handleMax = () => {
    if (balances[fromToken]?.balance) {
      setFromAmount(balances[fromToken].balance);
      fetchQuote(balances[fromToken].balance);
    }
  };

  // Swap tokens handler
  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount || '');
    setToAmount(fromAmount || '');
    setError('');
  };

  // Format balance for display
  const formatBalance = (token) => {
    if (!balances[token] || !balances[token].balance) return '0.0';
    const balance = parseFloat(balances[token].balance);
    return balance < 0.0001 ? '<0.0001' : balance.toFixed(4);
  };

  return (
    <SwapContainer>
      <Header>
        <Title>Swap</Title>
        <SettingsButton>⚙️</SettingsButton>
      </Header>
      
      {/* From Token Input */}
      <TokenInput>
        <InputRow>
          <Input 
            type="text" 
            placeholder="0.0" 
            value={fromAmount}
            onChange={handleFromAmountChange}
            disabled={!account}
          />
          <TokenSelect>
            <span>{fromToken}</span>
            <span>▼</span>
          </TokenSelect>
        </InputRow>
        <Balance>
          Balance: {formatBalance(fromToken)}
          <button onClick={handleMax}>Max</button>
        </Balance>
      </TokenInput>
      
      {/* Switch Tokens Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
        <button 
          onClick={handleSwitchTokens}
          style={{
            background: 'none',
            border: '1px solid #2d2d2d',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '1.2rem',
            transition: 'all 0.2s ease',
            ':hover': {
              background: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          ⇅
        </button>
      </div>
      
      {/* To Token Input */}
      <TokenInput>
        <InputRow>
          <Input 
            type="text" 
            placeholder="0.0" 
            value={toAmount || ''}
            readOnly
            className={loadingQuote ? 'loading' : ''}
          />
          <TokenSelect>
            <span>{toToken}</span>
            <span>▼</span>
          </TokenSelect>
        </InputRow>
        <Balance>Balance: {formatBalance(toToken)}</Balance>
      </TokenInput>
      
      {/* Price Impact and Slippage */}
      <div style={{ 
        margin: '1rem 0', 
        padding: '0.75rem', 
        background: 'rgba(255, 255, 255, 0.05)', 
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#a0a0a0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Price Impact:</span>
          <span>{priceImpact > 0 ? `${priceImpact.toFixed(2)}%` : '-'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Slippage Tolerance:</span>
          <div>
            <button 
              onClick={() => setSlippage(0.5)}
              style={{
                background: slippage === 0.5 ? '#3B82F6' : 'transparent',
                border: '1px solid #2d2d2d',
                borderRadius: '4px',
                color: '#fff',
                padding: '0.25rem 0.5rem',
                margin: '0 0.25rem',
                cursor: 'pointer'
              }}
            >
              0.5%
            </button>
            <button 
              onClick={() => setSlippage(1)}
              style={{
                background: slippage === 1 ? '#3B82F6' : 'transparent',
                border: '1px solid #2d2d2d',
                borderRadius: '4px',
                color: '#fff',
                padding: '0.25rem 0.5rem',
                margin: '0 0.25rem',
                cursor: 'pointer'
              }}
            >
              1%
            </button>
            <button 
              onClick={() => setSlippage(3)}
              style={{
                background: slippage === 3 ? '#3B82F6' : 'transparent',
                border: '1px solid #2d2d2d',
                borderRadius: '4px',
                color: '#fff',
                padding: '0.25rem 0.5rem',
                margin: '0 0.25rem',
                cursor: 'pointer'
              }}
            >
              3%
            </button>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{ 
          color: '#EF4444', 
          fontSize: '0.875rem', 
          margin: '0.5rem 0',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      
      {/* Swap Button */}
      <button 
        onClick={handleSwap}
        disabled={isSwapping || !account || !fromAmount || !toAmount}
        style={{
          width: '100%',
          background: !account || !fromAmount || !toAmount ? '#2d2d2d' : '#3B82F6',
          color: '#fff',
          border: 'none',
          borderRadius: '12px',
          padding: '1rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: !account || !fromAmount || !toAmount ? 'not-allowed' : 'pointer',
          opacity: isSwapping ? 0.7 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {isSwapping ? (
          <>
            <span className="spinner"></span>
            Swapping...
          </>
        ) : !account ? (
          'Connect Wallet'
        ) : !fromAmount || !toAmount ? (
          'Enter an amount'
        ) : (
          'Swap'
        )}
      </button>
    </SwapContainer>
  );
};

export default Swap;

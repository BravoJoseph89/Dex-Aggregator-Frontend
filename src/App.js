import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled, { createGlobalStyle } from 'styled-components';
import { useWeb3React } from '@web3-react/core';
import { injected } from './connectors';

import { AppProvider } from './contexts';
import Swap from './components/Swap';

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #121212;
    color: #ffffff;
    line-height: 1.5;
  }
`;

// Styled components
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  padding: 1rem 2rem;
  background-color: #1e1e1e;
  border-bottom: 1px solid #2d2d2d;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #4f46e5;
  margin: 0;
`;

const Main = styled.main`
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
`;

const Footer = styled.footer`
  padding: 1.5rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ConnectButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const ConnectedBadge = styled.div`
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  padding: 0.5rem 1rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  &::before {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    background-color: white;
    border-radius: 50%;
  }
`;

const ErrorText = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.75rem;
  margin-top: 0.25rem;
  text-align: right;
`;

// Theme configuration
const theme = {
  colors: {
    primary: '#4f46e5',
    primaryDark: '#4338ca',
    background: '#121212',
    surface: '#1e1e1e',
    surfaceLight: '#2d2d2d',
    surfaceLighter: '#3d3d3d',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
};

function App() {
  const { active, error, activate, account } = useWeb3React();
  const [connectionError, setConnectionError] = React.useState(null);
  
  // Handle wallet connection
  const handleConnect = async () => {
    try {
      setConnectionError(null);
      await activate(injected, undefined, true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setConnectionError('Failed to connect wallet. Please try again.');
    }
  };
  
  // Log Web3 connection status
  React.useEffect(() => {
    console.log('Web3 active:', active, 'Account:', account);
    if (error) {
      console.error('Web3 error:', error);
      setConnectionError(error.message);
    } else {
      setConnectionError(null);
    }
  }, [active, error, account]);

  return (
    <AppProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <Router>
          <AppContainer>
            <Header>
              <HeaderContent>
                <Logo>DEX Aggregator</Logo>
                <div>
                  {!active ? (
                    <ConnectButton 
                      onClick={handleConnect}
                      disabled={!!connectionError}
                    >
                      {connectionError ? 'Connection Failed' : 'Connect Wallet'}
                    </ConnectButton>
                  ) : (
                    <ConnectedBadge>
                      {`${account.substring(0, 6)}...${account.substring(38)}`}
                    </ConnectedBadge>
                  )}
                  {connectionError && (
                    <ErrorText>{connectionError}</ErrorText>
                  )}
                </div>
              </HeaderContent>
            </Header>
            
            <Main>
              <Routes>
                <Route path="/" element={<Swap />} />
              </Routes>
            </Main>
            
            <Footer>
              <p>DEX Aggregator &copy; {new Date().getFullYear()}</p>
            </Footer>
          </AppContainer>
        </Router>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;

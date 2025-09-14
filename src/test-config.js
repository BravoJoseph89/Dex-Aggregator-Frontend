import { CONTRACTS, TOKENS, NETWORK } from './config';

function testConfig() {
  console.log('Testing Configuration...\n');
  
  // Test CONTRACTS
  console.log('Contracts:');
  Object.entries(CONTRACTS).forEach(([key, value]) => {
    console.log(`- ${key}: ${value} (${value.length === 42 ? '✅ Valid' : '❌ Invalid'} length)`);
  });
  
  // Test TOKENS
  console.log('\nTokens:');
  Object.entries(TOKENS).forEach(([key, token]) => {
    console.log(`- ${key}: ${token.symbol} (${token.address.length === 42 ? '✅ Valid' : '❌ Invalid'} address)`);
  });
  
  // Test NETWORK
  console.log('\nNetwork:');
  console.log(`- Chain ID: ${NETWORK.chainId}`);
  console.log(`- RPC URL: ${NETWORK.rpcUrls[0]}`);
  console.log(`- Block Explorer: ${NETWORK.blockExplorerUrls[0]}`);
  
  console.log('\n✅ Configuration test complete!');
}

testConfig();
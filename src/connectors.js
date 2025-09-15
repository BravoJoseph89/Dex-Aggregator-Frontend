import { InjectedConnector } from '@web3-react/injected-connector';

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 56, 97, 137, 80001, 31337], // Includes Hardhat network (31337)
});

export const connectors = {
  injected: injected,
};

export const connectorNames = {
  Injected: 'injected',
};

export const getLibrary = (provider) => {
  return provider;
};

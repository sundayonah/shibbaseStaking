import { StakingContextProvider } from '@/Context/StakeContext';
import Header from '@/components/header';
import '@/styles/globals.css';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';

import { WagmiConfig } from 'wagmi';
import {
   arbitrum,
   bsc,
   bscTestnet,
   goerli,
   mainnet,
   polygon,
   sepolia,
} from 'wagmi/chains';

// 1. Get projectId
const projectId = '60fa83860edbb9d7d2e1df131caa2675';
// const projectId = process.env.NEXT_APP_PROJECTID;

// 2. Create wagmiConfig
const metadata = {
   name: 'Shibbase Staking',
   description: 'Shibbaase Staking',
   url: 'Staking',
   icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const chains = [mainnet, arbitrum, bsc, bscTestnet, polygon, sepolia, goerli];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

// 3. Create modal
createWeb3Modal({ wagmiConfig, projectId, chains });

export default function App({ Component, pageProps }) {
   return (
      <WagmiConfig config={wagmiConfig}>
         <StakingContextProvider>
            <Header />
            <Component {...pageProps} />
         </StakingContextProvider>
      </WagmiConfig>
   );
}

import { StakingContextProvider } from '@/Context/StakeContext';
import Header from '@/components/header';
import '@/styles/globals.css';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { createConfig, http } from 'wagmi'
import { mainnet, baseSepolia, bsc, base, shibarium } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

import { WagmiConfig } from 'wagmi';

const projectId = '60fa83860edbb9d7d2e1df131caa2675';
// const projectId = process.env.NEXT_APP_PROJECTID;

const metadata = {
   name: 'Shibbase Staking',
   description: 'Shibbaase Staking',
   url: 'Staking',
   icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const chains = [mainnet, baseSepolia, bsc, base, shibarium];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });


createWeb3Modal({ wagmiConfig, projectId, chains, shibarium });

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

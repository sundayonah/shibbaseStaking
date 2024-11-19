import React, { useState, useEffect, useContext, createContext } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';

import factoryAbi from '@/Contract/factoryAbi.json';
import stakingAbi2 from '@/Contract/stakingAbi2.json';
import erc20Abi from '@/Contract/erc20Abi.json';

// import axios from 'axios';

export const StakingContext = createContext({});

export const StakingContextProvider = ({ children }) => {
   // testnet
   const factoryContractAddress = "0x0B440864fe9f47da44E45A193012a60dD73d8062"
   // const factoryContractAddress = "0xEB5663450e6047AB2307e12B74333714976e6705"


   /// state variables
   const [createdShibbase, setCreatedShibbase] = useState([]);
   const [isLoading, setIsLoading] = useState(true);



   useEffect(() => {
      const fetchFactory = async () => {
         setIsLoading(true)

         try {


            const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

            const provider = new ethers.getDefaultProvider(alchemyApiKey);

            const contractInstance = new ethers.Contract(
               factoryContractAddress,
               factoryAbi,
               provider
            );

            const getAllCreatedShibbase = await contractInstance.getAllCreatedShibbase()

            const networkDetails = [];

            // Iterate over each address in the getAllCreatedShibbase array
            for (let addr of getAllCreatedShibbase) {
               // Create a new instance of the ERC20 contract for each address
               const createdShibbase4Address = new ethers.Contract(addr, stakingAbi2, provider);

               ////////////
               const aprInSmallestUnits = await createdShibbase4Address.RATE();
               const apr = ethers.formatEther(aprInSmallestUnits);

               const totalStake = await createdShibbase4Address.totalStaking();
               const formatStake = ethers.formatEther(totalStake.toString())


               const totalStaker = await createdShibbase4Address.totalStaker();

               ///////////

               // Fetch the required data from the ERC20 contrac
               const tokens = await createdShibbase4Address.token();

               const erc20Tokens = new ethers.Contract(tokens, erc20Abi, provider);
               // console.log(erc20Tokens)

               // const balanceOf = await erc20Tokens.balanceOf(signer.getAddress());
               const name = await erc20Tokens.name();

               const symbol = await erc20Tokens.symbol();


               // Add the network details to the array
               networkDetails.push({
                  shibAddress: addr,
                  apr: apr,
                  totalStake: formatStake,
                  totalStaker: totalStaker.toString(),
                  tokens: tokens,
                  name: name,
                  symbol: symbol,
               });
               setCreatedShibbase(networkDetails)
            }

            setIsLoading(false)
         } catch (error) {
            console.error('Error failed fetching data:', error);

         }
      }
      fetchFactory()
   }, [])


   return (
      <StakingContext.Provider
         value={{
            isLoading,
            createdShibbase,
         }}
      >
         {children}
      </StakingContext.Provider>
   );
};

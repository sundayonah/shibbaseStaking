import React, { useState, useEffect, createContext, useRef } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';

import shibaseAbi from '@/Contract/shibaseAbi.json';
import stakingAbi from '@/Contract/stakingAbi2.json';
import erc20Abi from '@/Contract/erc20Abi.json';
import approveAbi from '@/Contract/approve.json';
import toast from 'react-hot-toast';
import { ConvertToEpochDuration } from '@/lib/helper';

export const StakingContext = createContext({});

export const StakingContextProvider = ({ children }) => {
   const [stakeParams, setStakeParams] = useState({
      tokenAddress: '',
      minimumStake: '',
      apr: '',
      duration: '',
   });

   const { address, isConnected } = useAccount();
   const { connect } = useConnect({
      connector: new InjectedConnector(),
   });


   // testnet
   const shibaseContractAddress = "0x34BA159A08773127b3522b7819c6A7Cab9CDf8f6"
   // const shibaseContractAddress = "0xaf2e951d9a4BF8d74e594eA8f10D04c58314d520"


   /// state variables
   const [createdShibbase, setCreatedShibbase] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isCreating, setIsCreating] = useState(false);

   const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

   const provider = new ethers.getDefaultProvider(alchemyApiKey);


   const CreateStake = async () => {
      const { tokenAddress, minimumStake, apr, duration } = stakeParams;

      try {
         setIsCreating(true);

         // Validate inputs
         if (!tokenAddress || !minimumStake || !apr || !duration) {
            toast.error("Please fill all stake parameters.");
            return false;
         }

         // Check if MetaMask is installed
         if (!window.ethereum?.isMetaMask) {
            throw new Error('MetaMask is not detected. Please install MetaMask.');
         }

         const provider = new ethers.BrowserProvider(window.ethereum);

         // Ensure wallet is connected
         const accounts = await provider.send("eth_accounts", []);
         if (accounts.length === 0) {
            await provider.send("eth_requestAccounts", []);
         }

         const signer = await provider.getSigner();

         const contractInstance = new ethers.Contract(
            shibaseContractAddress,
            shibaseAbi,
            signer
         );



         // Validate token address
         if (!ethers.isAddress(tokenAddress)) {
            throw new Error('Invalid token address');
         }

         // Convert inputs to appropriate formats
         const minStakeInWei = ethers.parseEther(minimumStake.toString());
         const aprInWei = ethers.parseUnits(apr.toString(), 18);
         const stakeDuration = ConvertToEpochDuration(duration);

         // // Check if protocol fees are enabled and get the fee
         // const protocolFee = await contractInstance.protocolFees();
         // // if (protocolFee > 0) {
         // console.log("Protocol Fee:", protocolFee.toString());
         // // }

         // Estimate gas for stake creation
         const gasEstimate = await contractInstance.createStake.estimateGas(
            tokenAddress,
            minStakeInWei,
            apr,
            stakeDuration,
            // { value: protocolFee }
         );

         // Add 20% buffer to gas estimate
         const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2));

         // Create stake (sending the protocol fee as value)
         const tx = await contractInstance.createStake(
            tokenAddress,
            minStakeInWei,
            apr,
            stakeDuration,
            { gasLimit: gasLimit }
         );

         const receipt = await tx.wait();

         // After transaction
         console.log("Full Transaction Details:", {
            hash: receipt.hash,
            from: receipt.from,
            to: receipt.to,
            logs: receipt.logs,
            status: receipt.status
         });

         // Decode the logs
         const iface = new ethers.Interface(shibaseAbi);
         let stakeAddress = null

         if (receipt.logs.length === 0) {
            console.error("No logs found in the transaction receipt");
         }

         for (const log of receipt.logs) {
            try {
               console.log("Raw Log:", log);
               const parsedLog = iface.parseLog(log);
               console.log("Parsed Log Details:", {
                  name: parsedLog.name,
                  args: parsedLog.args
               });

               if (parsedLog.name === "ShibaseStakeCreated") {
                  stakeAddress = parsedLog.args.shibaseStake;
                  console.log("Found Stake Address:", stakeAddress);
                  break;
               }
            } catch (err) {
               console.warn("Log parsing failed:", err);
            }
         }
         toast.success("Stake created successfully!");

         return {
            stakeAddress,
            transactionHash: receipt.hash,
         };
      } catch (error) {
         console.error('Stake Creation Error:', error);
         toast.error(error.message || "Failed to create stake");
         return false;
      } finally {
         setIsCreating(false);
      }
   };

   const fetchPastStakesWithDetails = async () => {
      try {
         const provider = new ethers.getDefaultProvider(alchemyApiKey);
         const factoryContract = new ethers.Contract(shibaseContractAddress, shibaseAbi, provider);

         const filter = factoryContract.filters.ShibaseStakeCreated();
         const events = await factoryContract.queryFilter(filter, "earliest", "latest");

         if (events.length === 0) {
            console.warn("No stakes found for the current filter.");
            return [];
         }

         // Use Promise.all to fetch details for all stakes concurrently
         const stakesWithDetails = await Promise.all(events.map(async (event) => {
            const shibaseStakeAddress = event.args.shibaseStake;

            // Create a contract instance for the specific ShibaseStake
            const shibaseStakeContract = new ethers.Contract(
               shibaseStakeAddress,
               [
                  "function vaultInfo() external view returns (tuple(uint256 totalStaked, uint256 totalStaker, uint256 minimumStakeAmount, uint256 ENTRY_RATE, uint256 duration, address TOKEN, address owner, address factory))"
               ],
               provider
            );

            // bal of claim isinside calculateReward or userInfo, userData give amoint users has stake, 
            try {
               // Fetch vault information
               const vaultInfo = await shibaseStakeContract.vaultInfo();

               // Create ERC20 contract instance for the token
               const tokenContract = new ethers.Contract(
                  vaultInfo.TOKEN,
                  erc20Abi,
                  provider
               );

               // Fetch token name and symbol
               const [tokenName, tokenSymbol] = await Promise.all([
                  tokenContract.name(),
                  tokenContract.symbol()
               ]);

               return {
                  shibaseStake: shibaseStakeAddress,
                  name: tokenName,
                  symbol: tokenSymbol,
                  owner: event.args.owner,
                  apr: event.args.apr.toString(),
                  duration: event.args.duration.toString(),
                  min: ethers.formatEther(event.args.min),
                  token: vaultInfo.TOKEN,
                  totalStaked: ethers.formatEther(vaultInfo.totalStaked),
                  totalStaker: vaultInfo.totalStaker.toString(),
                  minimumStakeAmount: ethers.formatEther(vaultInfo.minimumStakeAmount),
                  entryRate: vaultInfo.ENTRY_RATE.toString(),
                  durationInDays: Number(event.args.duration) / (24 * 60 * 60),
                  timeLeft: Math.max(0, Number(event.args.duration) - (Date.now() / 1000)),
                  active: Number(event.args.duration) > (Date.now() / 1000)
               };
            } catch (error) {
               console.error(`Error fetching details for ${shibaseStakeAddress}:`, error);
               return null;
            }
         }));

         // Filter out any null results
         return stakesWithDetails.filter(stake => stake !== null);

      } catch (error) {
         console.error("Error fetching past stakes:", error);
         return [];
      }
   };

   // Function to fetch user info for a specific stake
   const fetchUserStakeInfo = async (stakeAddress, userAddress) => {
      const provider = new ethers.getDefaultProvider(alchemyApiKey);

      try {
         // Create stake contract instance
         const stakeContract = new ethers.Contract(
            stakeAddress,
            stakingAbi,
            provider
         );

         // Fetch vault info and user info concurrently
         const [vaultInfo, userInfo] = await Promise.all([
            stakeContract.vaultInfo(),
            stakeContract.userInfo(userAddress)
         ]);

         // Get token decimals
         const tokenContract = new ethers.Contract(
            vaultInfo.TOKEN,
            erc20Abi,
            provider
         );
         const decimals = await tokenContract.decimals().catch(() => 18);

         // Format user info with additional derived data
         return {
            stakeAddress,
            userAddress,
            staker: userInfo._staker,
            amountStaked: ethers.formatUnits(userInfo._amountStaked, decimals),
            reward: ethers.formatUnits(userInfo._userReward, decimals),
            timeStaked: {
               timestamp: Number(userInfo._timeStaked),
               date: new Date(Number(userInfo._timeStaked) * 1000).toLocaleString()
            },
            hasActiveStake: userInfo._amountStaked > 0,
            tokenAddress: vaultInfo.TOKEN,
            decimals
         };
      } catch (error) {
         console.error(`Error fetching user info for stake ${stakeAddress}:`, error);
         return null;
      }
   };



   // Function to fetch user info for multiple stakes
   const fetchAllUserStakeInfo = async (stakeAddresses, userAddress) => {
      const userStakeInfo = await Promise.all(
         stakeAddresses.map(address => fetchUserStakeInfo(address, userAddress, provider))
      );
      return userStakeInfo.filter(Boolean); // Remove null or invalid results
   };

   const fetchStakesWithUserInfo = async () => {
      try {
         // First get all stakes
         const stakes = await fetchPastStakesWithDetails();
         const userInfo = await fetchAllUserStakeInfo(
            stakes.map(stake => stake.shibaseStake),
            address
         );
         return stakes.map(stake => ({
            ...stake,
            userInfo: userInfo.find(info => info?.stakeAddress === stake.shibaseStake) || null
         }));
      } catch (error) {
         console.error("Error fetching stakes with user info:", error);
         throw error;
      }
   };

   const listenForNewStakes = () => {
      const provider = new ethers.getDefaultProvider(alchemyApiKey);

      const factoryContract = new ethers.Contract(
         shibaseContractAddress,
         shibaseAbi,
         provider
      );

      factoryContract.on("ShibaseStakeCreated", async (shibaseStake, owner, apr, duration, min, token) => {
         const newStake = {
            shibaseStake,
            owner,
            apr: apr.toString(),
            duration: duration.toString(),
            min: ethers.utils.formatEther(min),
            token,
         };
         console.log(newStake, "new Stake")


         // Immediately fetch the user info for this new stake
         const newStakesWithUserInfo = await fetchStakesWithUserInfo();
         // console.log(newStakesWithUserInfo, "new Stakes With User Info")

         // Update state with the new stakes data
         setCreatedShibbase(prevState => [...prevState, ...newStakesWithUserInfo]);
      });
   };

   // Fetch initial stakes when component mounts
   useEffect(() => {
      const fetchData = async () => {
         const stakesWithUserInfo = await fetchStakesWithUserInfo();
         // console.log(stakesWithUserInfo, "stakes With User Info")
         setCreatedShibbase(stakesWithUserInfo);
         setIsLoading(false);
      };

      fetchData();

      // Start listening for new stakes
      listenForNewStakes();
   }, []);

   // // Function to fetch user info for multiple stakes
   // const fetchAllUserStakeInfo = async (stakeAddresses, userAddress) => {
   //    try {
   //       const provider = new ethers.getDefaultProvider(alchemyApiKey);

   //       // Process stakes in batches to avoid rate limiting
   //       const batchSize = 5;
   //       const userStakeInfo = [];

   //       for (let i = 0; i < stakeAddresses.length; i += batchSize) {
   //          const batch = stakeAddresses.slice(i, i + batchSize);

   //          const batchResults = await Promise.all(
   //             batch.map(address => fetchUserStakeInfo(address, userAddress, provider))
   //          );

   //          userStakeInfo.push(...batchResults.filter(Boolean));

   //          // Add slight delay between batches
   //          if (i + batchSize < stakeAddresses.length) {
   //             await new Promise(resolve => setTimeout(resolve, 1000));
   //          }
   //       }

   //       return userStakeInfo;
   //    } catch (error) {
   //       console.error("Error fetching user stake info:", error);
   //       throw error;
   //    }
   // };



   // const listenForNewStakes = () => {
   //    const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';
   //    const provider = new ethers.getDefaultProvider(alchemyApiKey);



   //    const factoryContract = new ethers.Contract(
   //       shibaseContractAddress,
   //       shibaseAbi,
   //       provider
   //    );
   //    factoryContract.on("ShibaseStakeCreated", (shibaseStake, owner, apr, duration, min, token) => {
   //       const newStake = {
   //          shibaseStake,
   //          owner,
   //          apr: apr.toString(),
   //          duration: duration.toString(),
   //          min: ethers.utils.formatEther(min),
   //          token,
   //       };

   //    });
   // };

   // Listen for new stakes created and update state


   // useEffect(() => {
   //    // const provider = new ethers.BrowserProvider(window.ethereum);
   //    const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

   //    const provider = new ethers.getDefaultProvider(alchemyApiKey);


   //    const factoryContract = new ethers.Contract(
   //       shibaseContractAddress,
   //       shibaseAbi,
   //       provider
   //    );
   //    const initialize = async () => {
   //       setIsLoading(true);

   //       const userInfoWithPastEvents = await fetchStakesWithUserInfo()
   //       // console.log(userInfoWithPastEvents, "user Info With Past Events ✔️")

   //       setCreatedShibbase(userInfoWithPastEvents);

   //       await provider.getLogs({
   //          address: shibaseContractAddress,
   //          fromBlock: '0x0',
   //          toBlock: 'latest',
   //       });


   //       listenForNewStakes();
   //       setIsLoading(false);
   //    };

   //    initialize();

   //    return () => {
   //       // Clean up event listener when component unmounts
   //       factoryContract.removeAllListeners("ShibaseStakeCreated");
   //    };
   // }, []);




   // 0x201af0e0243415B67A0D6CD1f6fCd50666bB1a6E


   return (
      <StakingContext.Provider
         value={{
            shibaseContractAddress,
            shibaseAbi,
            stakeParams,
            setStakeParams,
            CreateStake,
            isCreating,
            isLoading,
            createdShibbase,
            isConnected,
            address,
            connect,
            provider
         }}
      >
         {children}
      </StakingContext.Provider>
   );
};

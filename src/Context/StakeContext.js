import React, { useState, useEffect, createContext, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { ethers } from 'ethers';

import shibaseAbi from '@/Contract/shibaseAbi.json';
import stakingAbi from '@/Contract/stakingAbi2.json';
import erc20Abi from '@/Contract/erc20Abi.json';
import approveAbi from '@/Contract/approve.json';
import toast from 'react-hot-toast';
import { ConvertToEpochDuration, durationOptions } from '@/lib/helper';

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
   // const shibaseContractAddress = "0x34BA159A08773127b3522b7819c6A7Cab9CDf8f6"
   const shibaseContractAddress = "0xb6BAD05d5568E53E5dCFa0EF27d92dF75104Fd1e"

   const subscriptionRef = useRef();


   /// state variables
   const [createdShibbase, setCreatedShibbase] = useState([]);
   const [isLoading, setIsLoading] = useState(true);
   const [isCreating, setIsCreating] = useState(false);
   const [isApproving, setIsApproving] = useState(false);

   const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

   const provider = new ethers.getDefaultProvider(alchemyApiKey);



   const CreateStake = async () => {
      const { tokenAddress, minimumStake, apr, duration } = stakeParams;
      console.log(tokenAddress, minimumStake, apr, duration, " Params");

      try {
         setIsCreating(true);

         // Validate inputs
         if (!tokenAddress || !minimumStake || !apr || !duration) {
            toast.error("Please fill all stake parameters.");
            return false;
         }

         // Validate APR
         if (apr > 10000) {
            throw new Error("APR must be less than or equal to 10000");
         }

         // Check if MetaMask is installed
         if (!window.ethereum?.isMetaMask) {
            throw new Error("MetaMask is not detected. Please install MetaMask.");
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
            throw new Error("Invalid token address");
         }

         // Find the selected duration option
         const selectedDuration = durationOptions.find((option) => option.value === duration);
         if (!selectedDuration) {
            throw new Error("Invalid duration selected");
         }

         // Retrieve fee (`min`) for the selected duration
         const feeInEther = selectedDuration.min.toString(); // Ensure string format
         const feeInWei = ethers.parseEther(feeInEther);
         console.log("Fee in Wei:", feeInWei.toString());

         // Convert inputs to appropriate formats
         const minStakeInWei = ethers.parseEther(minimumStake.toString());
         const aprInWei = BigInt(apr); // Ensure integer format for APR
         const stakeDuration = ConvertToEpochDuration(duration);

         console.log({ minStakeInWei, })

         // Estimate gas for stake creation
         const gasEstimate = await contractInstance.createStake.estimateGas(
            tokenAddress,
            minStakeInWei,
            aprInWei,
            stakeDuration,
            { value: feeInWei }
         );

         // Add 20% buffer to gas estimate
         const gasLimit = BigInt(Math.floor(Number(gasEstimate) * 1.2));
         console.log({
            tokenAddress,
            minStakeInWei,
            aprInWei,
            stakeDuration,
         }, " create state parameters")

         // Create stake (sending the fee as value)
         const tx = await contractInstance.createStake(
            tokenAddress,
            minStakeInWei,
            aprInWei,
            stakeDuration,
            { gasLimit, value: feeInWei }
         );

         const receipt = await tx.wait();

         // Decode the logs
         const iface = new ethers.Interface(shibaseAbi);
         let stakeAddress = null;

         for (const log of receipt.logs) {
            try {
               const parsedLog = iface.parseLog(log);
               if (parsedLog.name === "ShibaseStakeCreated") {
                  stakeAddress = parsedLog.args.shibaseStake;
                  console.log("Stake Address:", stakeAddress);
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
         console.error("Stake Creation Error:", error);
         toast.error(error.message || "Failed to create stake");
         return false;
      } finally {
         setIsCreating(false);
      }
   };

   const fetchPastStakesWithDetails = async () => {
      const provider = new ethers.getDefaultProvider(alchemyApiKey);
      const factoryContract = new ethers.Contract(shibaseContractAddress, shibaseAbi, provider);
      try {

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

   const fetchUserStakeInfo = async (stakeAddress) => {

      const provider = new ethers.getDefaultProvider(alchemyApiKey);


      // Validate inputs first
      if (!stakeAddress || !provider || !address) {
         console.error('Missing required parameters:', { stakeAddress, provider, address });
         return null;
      }


      try {
         // Validate stake address format
         if (!ethers.isAddress(stakeAddress)) {
            console.error(`Invalid stake address format: ${stakeAddress}`);
            return null;
         }

         // Create stake contract instance
         const stakeContract = new ethers.Contract(
            stakeAddress,
            stakingAbi,
            provider
         );

         // Validate that contract exists at address
         const code = await provider.getCode(stakeAddress);
         if (code === '0x') {
            console.error(`No contract found at address: ${stakeAddress}`);
            return null;
         }

         // Fetch vault info and user info concurrently
         const [vaultInfo, userInfo] = await Promise.all([
            stakeContract.vaultInfo(),
            stakeContract.userInfo(address)
         ]);

         // Validate token address
         if (!vaultInfo || !vaultInfo.TOKEN || !ethers.isAddress(vaultInfo.TOKEN)) {
            console.error(`Invalid token address in vault info for stake ${stakeAddress}`);
            return null;
         }

         // Get token decimals
         const tokenContract = new ethers.Contract(
            vaultInfo.TOKEN,
            erc20Abi,
            provider
         );
         const decimals = await tokenContract.decimals().catch(() => 18);

         return {
            stakeAddress,
            address,
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

   const fetchAllUserStakeInfo = async (stakeAddresses) => {
      if (!stakeAddresses || !Array.isArray(stakeAddresses)) {
         console.error('Invalid stake addresses array:', stakeAddresses);
         return [];
      }

      // Filter out invalid addresses first
      const validAddresses = stakeAddresses.filter(addr => addr && ethers.isAddress(addr));

      try {
         // const provider = new ethers.getDefaultProvider(alchemyApiKey);
         const batchSize = 5;
         const userStakeInfo = [];

         for (let i = 0; i < validAddresses.length; i += batchSize) {
            const batch = validAddresses.slice(i, i + batchSize);
            const batchResults = await Promise.all(
               batch.map(stakeAddress => fetchUserStakeInfo(stakeAddress)),

            );
            // console.log(batchResults, "batch Results address in batch")

            // Filter out null results
            const validResults = batchResults.filter(result => result !== null);
            userStakeInfo.push(...validResults);

            // Add slight delay between batches
            if (i + batchSize < validAddresses.length) {
               await new Promise(resolve => setTimeout(resolve, 1000));
            }
         }

         // console.log(userStakeInfo, "user info //////////////////")

         return userStakeInfo;
      } catch (error) {
         console.error("Error fetching user stake info:", error);
         return [];
      }
   };

   const fetchStakesWithUserInfo = async () => {
      try {
         // First get all stakes
         const stakes = await fetchPastStakesWithDetails();

         // Validate stakes array
         if (!stakes || !Array.isArray(stakes)) {
            console.error('Invalid stakes array:', stakes);
            return [];
         }

         // Filter out stakes without valid addresses
         const validStakes = stakes.filter(stake =>
            stake && stake.shibaseStake && ethers.isAddress(stake.shibaseStake)
         );

         const userInfo = await fetchAllUserStakeInfo(
            validStakes.map(stake => stake.shibaseStake)
         );

         return validStakes.map(stake => ({
            ...stake,
            userInfo: userInfo.find(info => info?.stakeAddress === stake.shibaseStake) || null
         }));
      } catch (error) {
         console.error("Error fetching stakes with user info:", error);
         return [];
      }
   };

   // Listen for new stakes created and update state
   const listenForNewStakes = () => {
      try {
         if (!provider) {
            console.error("Provider not available for listening to events");
            return;
         }

         const factoryContract = new ethers.Contract(
            shibaseContractAddress,
            shibaseAbi,
            provider
         );

         if (!factoryContract) {
            console.error("Failed to initialize factory contract for events");
            return;
         }

         factoryContract.on("ShibaseStakeCreated", async (shibaseStake, owner, apr, duration, min, token) => {
            try {
               const newStake = {
                  shibaseStake,
                  owner,
                  apr: apr.toString(),
                  duration: duration.toString(),
                  min: ethers.formatEther(min),
                  token,
               };
               console.log("New stake created:", newStake);

               const newStakesWithUserInfo = await fetchStakesWithUserInfo();
               console.log("Stakes with user info:", newStakesWithUserInfo);

               setCreatedShibbase(prevState => [...prevState, ...newStakesWithUserInfo]);
            } catch (error) {
               console.error("Error processing new stake:", error);
            }
         });

         return () => {
            // Cleanup listener
            factoryContract.removeAllListeners("ShibaseStakeCreated");
         };
      } catch (error) {
         console.error("Error setting up event listener:", error);
      }
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

   useEffect(() => {
      const calculateRewards = async () => {
         try {
            const provider = new ethers.BrowserProvider(window.ethereum);

            // Get signer for contract interaction
            const signer = await provider.getSigner();

            const factoryContract = new ethers.Contract(
               shibaseContractAddress,
               stakingAbi,
               signer // Use signer instead of provider
            );

            const formattedAddress = ethers.getAddress(address);

            // Additional logging
            console.log("Contract Address:", shibaseContractAddress);
            console.log("User Address:", formattedAddress);

            const userReward = await factoryContract.calculateRewards(formattedAddress);
            console.log(userReward.toString(), "user reward");
         } catch (error) {
            console.error("Detailed Error:", {
               name: error.name,
               code: error.code,
               message: error.message,
               stack: error.stack
            });
         }
      }

      if (address) {
         calculateRewards();
      }
   }, [address])





   // useEffect(() => {
   // // const provider = new ethers.BrowserProvider(window.ethereum);
   // const alchemyApiKey = 'https://base-sepolia.g.alchemy.com/v2/k876etRLMsoIcTpTzkkTuh3LPBTK96YZ';

   // const provider = new ethers.getDefaultProvider(alchemyApiKey);


   // const factoryContract = new ethers.Contract(
   //    shibaseContractAddress,
   //    shibaseAbi,
   //    provider
   // );
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
            isApproving,
            // approveToken,
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

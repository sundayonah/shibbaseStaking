import Link from "next/link";
import { useContext, useState } from "react";
import { StakingContext } from "@/Context/StakeContext";
import { Loading } from "./Loading";

const NetworkList = () => {
    // const [isLoading, setIsLoading] = useState(true);

// 
  const {
       createdShibbase,isLoading
  } = useContext(StakingContext);

// Conditional rendering based on loading state
  if (isLoading) {
    return (
      <div className="mt-64">
     <div className="flex items-center justify-center">

            <div  className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white" />
</div>
      </div>
    );
  }
  
 return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 mt-32">
      {createdShibbase.map(net => (
      <Link key={net.shibAddress} href={`/singleNetwork?shibAddress=${net.shibAddress}&token=${net.tokens}`} className="text-xl font-bold text-blue-500 hover:text-blue-700 block">
              <div className="border border-blue-950  shadow-2xl rounded-md p-4">
                  <div className="flex justify-between items-center">
                     {net.name}
              <img src="/shibase.png" className="w-6 h-6 rounded-full" alt={net.name} />

                  </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Total Stake: <span className="font-semibold">{net.totalStake}</span></p>
            <p className="text-sm text-gray-500">APR: <span className="font-semibold">{net.apr}%</span></p>
            <p className="text-sm text-gray-500">Total Staker: <span className="font-semibold">{net.totalStaker}</span></p>
          </div>
        </div>
      </Link>
      ))}
    </div>
 );
};

export default NetworkList;



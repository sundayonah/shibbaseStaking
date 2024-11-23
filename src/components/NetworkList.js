import { useContext, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { StakingContext } from "@/Context/StakeContext";
import CreateStakeModal from "./CreateStakeModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Toaster } from "react-hot-toast";
import { EmptyState, FormatDateTime, LoadingSpinner } from "@/lib/helper";
import AOS from 'aos';
import 'aos/dist/aos.css';



const NetworkCard = ({ network }) => (
  <Link
    href={`/singleNetwork?shibAddress=${network.shibaseStake}&token=${network.token}`}
    className="block  hover:shadow-2xl"
  >
    <Card className="h-full w-full border-none bg-gradient-to-br from-slate-900 to-slate-800 " data-aos="fade-up"
      data-aos-duration="3000">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">{network.name}</h3>
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-500 text-white text-sm font-bold rounded-full shadow-md">
            {network.symbol}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <StatsRow label="Total Stake" value={network.totalStaked} />
          <StatsRow label="APR" value={`${network.apr}%`} />
          <StatsRow label="Total Stakers" value={network.totalStaker} />
          <StatsRow label="Minimum Stake" value={network.min} />
          <StatsRow label="Duration (Days)" value={FormatDateTime(network.duration)} />
        </div>
      </CardContent>
    </Card>
  </Link>
  // 20139
);

const StatsRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-400 ">{label}</span>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
);





const NetworkList = () => {
  const { createdShibbase, isLoading } = useContext(StakingContext);


  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      <Toaster />

      {createdShibbase.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex justify-end mb-8">
            <CreateStakeModal />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-aos="fade-up"
            data-aos-duration="3000">
            {createdShibbase.map((network) => (
              <NetworkCard key={network.shibaseStake} network={network} />
            ))}
          </div>
        </>
      )}

    </div>
  );
};

export default NetworkList;
// pages/[network].js
import SingleNetwork from '@/components/singleNetwork';
import { useRouter } from 'next/router';

export default function NetworkPage() {

  const router = useRouter();
  const { shibAddress, token } = router.query;



  return <SingleNetwork shibAddress={shibAddress} token={token} />;
}

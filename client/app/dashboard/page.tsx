'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat');
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-xs tracking-widest uppercase">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        <span>Rerouting to chat room...</span>
      </div>
    </div>
  );
}

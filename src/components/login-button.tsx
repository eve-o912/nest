'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui';
import { Wallet, Loader2 } from 'lucide-react';

export function LoginButton() {
  const { login, logout, authenticated, user, ready } = usePrivy();

  if (!ready) {
    return (
      <Button disabled variant="outline" size="sm">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (authenticated && user) {
    const address = user.wallet?.address;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-400 hidden sm:inline">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : user.email?.address || 'Connected'}
        </span>
        <Button onClick={logout} variant="outline" size="sm">
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={login} size="sm">
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}

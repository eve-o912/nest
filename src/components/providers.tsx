'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#C8D946',
          logo: '/nest-logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'all-users', // Allow external wallets to connect
        },
        defaultChain: {
          id: 8453,
          name: 'Base',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['https://mainnet.base.org'],
            },
          },
          blockExplorers: {
            default: {
              name: 'Basescan',
              url: 'https://basescan.org',
            },
          },
        },
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://mainnet.base.org'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Basescan',
                url: 'https://basescan.org',
              },
            },
          },
        ],
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord'],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

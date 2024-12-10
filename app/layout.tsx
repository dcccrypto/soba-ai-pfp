import './globals.css';
import { Providers } from './providers';
import { WalletInit } from '@/components/wallet/WalletInit';

export const metadata = {
  title: 'Soba AI PFP',
  description: 'AI-Powered NFT Profile Picture Platform on Solana',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <WalletInit />
          {children}
        </Providers>
      </body>
    </html>
  );
}

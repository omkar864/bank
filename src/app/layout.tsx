
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar'; // Added import
import { Toaster } from '@/components/ui/toaster'; // Added import

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SHAGUNAM MICRO ASSOCIATION',
  description: 'Role-Based Access Control System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SidebarProvider initialOpen={true} initialCollapsed={false} collapseMode="icon">
          {children}
          <Toaster />
        </SidebarProvider>
      </body>
    </html>
  );
}

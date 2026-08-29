import type { PropsWithChildren } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: PropsWithChildren) {
  return <DashboardLayout area="Admin">{children}</DashboardLayout>;
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'PLANDA', template: '%s | PLANDA' },
  description: 'Turkey-focused new-development property marketplace.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

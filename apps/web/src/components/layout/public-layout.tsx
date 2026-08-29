import type { PropsWithChildren } from 'react';
import { PublicHeader } from './public-header';

export function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="shell">
      <PublicHeader />
      {children}
    </div>
  );
}

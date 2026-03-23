import { NavBar } from '@/components/nav-bar';
import type { ReactNode } from 'react';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-display text-text-900">404</h1>
        <p className="text-body text-text-500">
          This page doesn't exist or the tournament was removed.
        </p>
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
      </div>
    </div>
  );
}

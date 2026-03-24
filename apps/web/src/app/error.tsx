'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="text-center space-y-4 px-4">
        <h1 className="text-h1 text-text-900">Something went wrong</h1>
        <p className="text-body text-text-500 max-w-md">
          An unexpected error occurred. This has been logged and we'll look into
          it.
        </p>
        {error.digest && (
          <p className="text-caption text-text-300 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}

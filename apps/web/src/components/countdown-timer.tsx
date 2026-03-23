'use client';

import { memo } from 'react';
import { useCountdown } from '@/hooks/use-countdown';
import { cn } from '@/lib/utils';

type CountdownTimerProps = {
  closesAt: Date | null;
  variant?: 'active' | 'passive' | 'resolved';
};

function formatTimeLabel(
  hours: number,
  minutes: number,
  seconds: number,
): string {
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export const CountdownTimer = memo(function CountdownTimer({
  closesAt,
  variant = 'active',
}: CountdownTimerProps) {
  const { hours, minutes, seconds, isExpired, urgency, totalSeconds } =
    useCountdown(closesAt);

  if (variant === 'resolved') {
    return <span className="text-[11px] text-text-300">Ended</span>;
  }
  if (variant === 'passive') {
    if (isExpired) {
      return <span className="text-[11px] text-text-300">Awaiting result</span>;
    }
    if (totalSeconds <= 10) {
      return (
        <span className="text-[11px] text-text-300">
          Result in <span className="font-mono tabular-nums">{seconds}s</span>
        </span>
      );
    }
    return <span className="text-[11px] text-text-300">Awaiting result</span>;
  }

  // Active: user can still vote
  if (isExpired) {
    return <span className="text-[11px] text-text-300">Awaiting result</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {totalSeconds < 300 && (
        <span
          className={cn(
            'size-1.5 rounded-full shrink-0',
            urgency === 'warning' && 'bg-warning-500',
            urgency === 'urgent' && 'bg-error-500',
            urgency === 'critical' && 'bg-error-500 animate-pulse',
          )}
        />
      )}
      <span
        className={cn(
          'text-[11px]',
          urgency === 'normal' && 'text-text-300',
          urgency === 'warning' && 'text-warning-500',
          urgency === 'urgent' && 'text-error-500',
          urgency === 'critical' && 'text-error-500 animate-pulse',
        )}
      >
        Closes in{' '}
        <span suppressHydrationWarning className="font-mono tabular-nums">
          {formatTimeLabel(hours, minutes, seconds)}
        </span>
      </span>
    </div>
  );
});

import { useTick } from '@/components/global-ticker-provider';

export type Urgency = 'normal' | 'warning' | 'urgent' | 'critical';
type CountdownResult = {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
  urgency: Urgency;
};

const expiredState: CountdownResult = {
  hours: 0,
  minutes: 0,
  seconds: 0,
  totalSeconds: 0,
  isExpired: true,
  urgency: 'normal',
};

export function useCountdown(closesAt: Date | null): CountdownResult {
  const tick = useTick(); // forces re-render every second
  void tick;

  if (closesAt === null) return expiredState;

  const now = Date.now();
  const totalSeconds = Math.floor((new Date(closesAt).getTime() - now) / 1000);
  if (totalSeconds <= 0) return expiredState;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
  const seconds = totalSeconds % 60;

  let urgency: Urgency;
  if (totalSeconds > 3600) urgency = 'normal';
  else if (totalSeconds > 600) urgency = 'warning';
  else if (totalSeconds > 60) urgency = 'urgent';
  else urgency = 'critical';

  return { isExpired: false, hours, minutes, seconds, totalSeconds, urgency };
}

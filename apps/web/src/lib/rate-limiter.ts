import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

// 20 votes per 60 seconds per IP
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: 'ratelimit:ip',
});

// 1 vote per 5 seconds per user
export const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '5 s'),
  prefix: 'ratelimit:user',
});

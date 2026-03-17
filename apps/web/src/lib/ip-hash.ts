import { createHmac } from 'crypto';

export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT!;
  return createHmac('sha256', salt).update(ip).digest('hex');
}

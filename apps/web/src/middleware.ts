export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: ['/tournaments/create', '/profile/:path*'],
};

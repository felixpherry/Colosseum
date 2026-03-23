import { auth, signOut } from '@/lib/auth';
import Link from 'next/link';
import { Swords } from 'lucide-react';

export async function NavBar() {
  const session = await auth();

  return (
    <nav className="border-b border-surface-200 bg-surface-0">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-text-900 hover:text-brand-500 transition-colors"
          >
            <Swords className="size-5 text-brand-500" />
            <span className="text-body font-semibold">Colosseum</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/discover"
              className="text-caption text-text-500 hover:text-text-900 transition-colors"
            >
              Discover
            </Link>
            {session?.user && (
              <Link
                href="/tournaments/create"
                className="text-caption text-text-500 hover:text-text-900 transition-colors"
              >
                Create
              </Link>
            )}
          </div>
        </div>

        {/* Right: auth */}
        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="size-7 rounded-full bg-surface-100 flex items-center justify-center text-caption font-semibold text-text-500">
                    {session.user.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-caption text-text-900 font-medium hidden sm:block">
                  {session.user.name}
                </span>
              </Link>
              <form
                action={async () => {
                  'use server';
                  await signOut({ redirectTo: '/' });
                }}
              >
                <button
                  type="submit"
                  className="text-caption text-text-300 hover:text-text-900 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-caption font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

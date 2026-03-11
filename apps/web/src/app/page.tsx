import { auth, signIn, signOut } from '@/lib/auth';
import { api } from '@/trpc/server';

export default async function Home() {
  const session = await auth();
  const trpc = await api();
  const tournaments = await trpc.tournament.list();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Colosseum</h1>
      <p>Tournaments: {tournaments.length}</p>
      {session ? (
        <div>
          <p>Signed in as {session.user?.email}</p>
          <form
            action={async () => {
              'use server';
              await signOut();
            }}
          >
            <button type="submit">Sign Out</button>
          </form>
        </div>
      ) : (
        <div>
          <form
            action={async () => {
              'use server';
              await signIn('google');
            }}
          >
            <button type="submit">Sign in with Google</button>
          </form>

          <form
            action={async () => {
              'use server';
              await signIn('github');
            }}
          >
            <button type="submit">Sign in with GitHub</button>
          </form>
        </div>
      )}
    </div>
  );
}

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { db } from '@colosseum/db';
import { users, accounts } from '@colosseum/db';
import { eq, and } from '@colosseum/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google, GitHub],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        request.nextUrl.pathname.startsWith('/tournaments/create') ||
        request.nextUrl.pathname.startsWith('/profile');

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL('/login', request.nextUrl));
      }

      return true;
    },
    async signIn({ user, account, profile }) {
      if (!account || !user.email) return false;

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .then((rows) => rows[0]);

      if (existingUser) {
        // Link this OAuth account if not already linked
        const existingAccount = await db
          .select()
          .from(accounts)
          .where(
            and(
              eq(accounts.provider, account.provider),
              eq(accounts.providerAccountId, account.providerAccountId),
            ),
          )
          .then((rows) => rows[0]);

        if (!existingAccount) {
          await db.insert(accounts).values({
            userId: existingUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            tokenType: account.token_type,
            scope: account.scope,
          });
        }
      } else {
        // Create new user + account
        const username =
          user.email.split('@')[0] + Math.random().toString(36).slice(2, 6);

        await db.transaction(async (tx) => {
          const [newUser] = await tx
            .insert(users)
            .values({
              name: user.name,
              email: user.email!,
              username,
              image: user.image,
              emailVerifiedAt: profile?.email_verified ? new Date() : null,
            })
            .returning();

          await tx.insert(accounts).values({
            userId: newUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            tokenType: account.token_type,
            scope: account.scope,
          });
        });
      }

      return true;
    },

    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        // First login — fetch our DB user to get the real ID
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .then((rows) => rows[0]);

        if (dbUser) {
          token.sub = dbUser.id;
        }
      }
      return token;
    },
  },
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
});

import { auth } from '@/lib/auth';
import { api } from '@/trpc/server';
import { redirect } from 'next/navigation';
import { Trophy, Swords, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

function getTierInfo(rating: number) {
  if (rating >= 2000) return { name: 'Diamond', color: 'text-tier-diamond' };
  if (rating >= 1800) return { name: 'Platinum', color: 'text-tier-platinum' };
  if (rating >= 1600) return { name: 'Gold', color: 'text-tier-gold' };
  if (rating >= 1400) return { name: 'Silver', color: 'text-tier-silver' };
  return { name: 'Bronze', color: 'text-tier-bronze' };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  accepting_submissions: { label: 'Open', variant: 'default' },
  in_progress: { label: 'Live', variant: 'default' },
  completed: { label: 'Done', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const trpc = await api();
  const { user, ratings, createdTournaments } = await trpc.profile.me();

  const highestRating = ratings[0];
  const highestTier = highestRating ? getTierInfo(highestRating.rating) : null;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Profile header */}
        <div className="bg-surface-0 border border-surface-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <div className="size-16 rounded-full bg-surface-100 flex items-center justify-center text-h1 font-semibold text-text-500">
                {user.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-h1 text-text-900">{user.name ?? 'Anonymous'}</h1>
              <p className="text-body text-text-500">@{user.username}</p>
              {highestTier && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Trophy className={`size-4 ${highestTier.color}`} />
                  <span className={`text-caption font-semibold ${highestTier.color}`}>
                    {highestTier.name}
                  </span>
                  <span className="text-caption text-text-300">
                    · {highestRating.rating} ELO in {highestRating.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ELO Ratings */}
        <div className="space-y-3">
          <h2 className="text-h3 text-text-900">Ratings</h2>
          {ratings.length === 0 ? (
            <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center">
              <p className="text-body text-text-300">
                No ratings yet. Vote in tournaments to build your ELO.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {ratings.map((r) => {
                const tier = getTierInfo(r.rating);
                return (
                  <div
                    key={r.id}
                    className="bg-surface-0 border border-surface-200 rounded-lg px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className={`size-4 ${tier.color}`} />
                      <span className="text-body text-text-900 font-medium">
                        {r.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-caption text-text-300">
                        {r.matchesPlayed} matches
                      </span>
                      <span className={`text-body font-mono font-semibold ${tier.color}`}>
                        {r.rating}
                      </span>
                      <span className={`text-caption font-medium ${tier.color}`}>
                        {tier.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Created tournaments */}
        <div className="space-y-3">
          <h2 className="text-h3 text-text-900">
            Your Tournaments
            <span className="text-text-300 font-normal ml-1.5">
              {createdTournaments.length}
            </span>
          </h2>
          {createdTournaments.length === 0 ? (
            <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center">
              <p className="text-body text-text-300">
                No tournaments created yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {createdTournaments.map((t) => {
                const status = statusConfig[t.status] ?? { label: t.status, variant: 'secondary' as const };
                return (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.slug}`}
                    className="block bg-surface-0 border border-surface-200 rounded-lg px-4 py-3 hover:border-brand-500/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Swords className="size-4 text-text-300 shrink-0" />
                        <span className="text-body text-text-900 font-medium truncate">
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 ml-6 text-caption text-text-300">
                      <span>{t.category}</span>
                      <span>·</span>
                      <span>{t.size} entries</span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

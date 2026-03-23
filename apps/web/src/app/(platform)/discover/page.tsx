'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Swords, Users, TrendingUp, Flame } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  accepting_submissions: { label: 'Open', variant: 'default' },
  in_progress: { label: 'Live', variant: 'default' },
  completed: { label: 'Done', variant: 'secondary' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

function TournamentCard({
  tournament,
}: {
  tournament: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    category: string;
    status: string;
    size: number;
  };
}) {
  const status = statusConfig[tournament.status] ?? {
    label: tournament.status,
    variant: 'secondary' as const,
  };

  return (
    <Link
      href={`/tournaments/${tournament.slug}`}
      className="block bg-surface-0 border border-surface-200 rounded-lg px-4 py-3 hover:border-brand-500/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Swords className="size-4 text-text-300 shrink-0" />
          <span className="text-body text-text-900 font-medium truncate">
            {tournament.title}
          </span>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      {tournament.description && (
        <p className="text-caption text-text-500 mt-1.5 ml-6 line-clamp-2">
          {tournament.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-1.5 ml-6 text-caption text-text-300">
        <span>{tournament.category}</span>
        <span>\u00b7</span>
        <div className="flex items-center gap-1">
          <Users className="size-3" />
          <span>{tournament.size} entries</span>
        </div>
      </div>
    </Link>
  );
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'search'>(
    'trending',
  );

  const { data: searchResults } = trpc.search.search.useQuery(
    { query, limit: 20 },
    { enabled: query.length > 0 && activeTab === 'search' },
  );

  const { data: trendingResults } = trpc.search.trending.useQuery(
    { limit: 20 },
    { enabled: activeTab === 'trending' },
  );

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-h1 text-text-900">Discover</h1>
          <p className="text-body text-text-500 mt-1">
            Find tournaments to join or watch.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-300" />
          <Input
            placeholder="Search tournaments..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 0) setActiveTab('search');
              else setActiveTab('trending');
            }}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-100 p-1 rounded-lg">
          <button
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-caption font-medium transition-colors',
              activeTab === 'trending'
                ? 'bg-surface-0 text-text-900 shadow-sm'
                : 'text-text-500 hover:text-text-900',
            )}
            onClick={() => {
              setActiveTab('trending');
              setQuery('');
            }}
          >
            <Flame className="size-3.5" />
            Trending
          </button>
          <button
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-caption font-medium transition-colors',
              activeTab === 'search'
                ? 'bg-surface-0 text-text-900 shadow-sm'
                : 'text-text-500 hover:text-text-900',
            )}
            onClick={() => setActiveTab('search')}
          >
            <Search className="size-3.5" />
            Search
          </button>
        </div>

        {/* Results */}
        {activeTab === 'trending' && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-caption text-text-300">
              <TrendingUp className="size-3.5" />
              <span>Trending tournaments</span>
            </div>
            {trendingResults && trendingResults.length > 0 ? (
              <div className="space-y-2">
                {trendingResults.map((item: { tournament_stats: { id: string; tournamentId: string }; tournaments: { id: string; title: string; slug: string; description: string | null; category: string; status: string; size: number } }) => (
                  <TournamentCard
                    key={item.tournament_stats.id}
                    tournament={item.tournaments}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center">
                <p className="text-body text-text-300">
                  No trending tournaments yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-3">
            {query.length === 0 ? (
              <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center">
                <p className="text-body text-text-300">
                  Type to search tournaments.
                </p>
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-2">
                {(searchResults as unknown as Array<{ id: string; title: string; slug: string; description: string | null; category: string; status: string; size: number }>).map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            ) : searchResults ? (
              <div className="bg-surface-0 border border-surface-200 rounded-lg p-6 text-center">
                <p className="text-body text-text-300">
                  No results for \"{query}\"
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

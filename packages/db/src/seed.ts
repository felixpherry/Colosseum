import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  users,
  tournaments,
  submissions,
  matchups,
  votes,
  tournamentStats,
  userRatings,
} from './schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { casing: 'snake_case' });

const CATEGORIES = [
  'music',
  'movies',
  'food',
  'gaming',
  'sports',
  'tech',
  'anime',
  'books',
  'tv-shows',
  'hot-takes',
];
const SIZES = [8, 16, 32, 64] as const;
type STATUSES =
  | 'draft'
  | 'accepting_submissions'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const TOURNAMENT_NAMES: Record<string, string[]> = {
  music: [
    'Best Album of 2025',
    'Greatest Guitar Solo',
    'Top One-Hit Wonder',
    'Best Concert Opener',
    'Most Underrated Band',
  ],
  movies: [
    'Best Movie Villain',
    'Greatest Plot Twist',
    'Best Opening Scene',
    'Worst Sequel',
    'Best Animated Film',
  ],
  food: [
    'Best Pizza Topping',
    'Greatest Street Food',
    'Best Breakfast Item',
    'Top Comfort Food',
    'Best Dessert',
  ],
  gaming: [
    'Best RPG of All Time',
    'Greatest Boss Fight',
    'Best Indie Game',
    'Most Iconic Character',
    'Best Soundtrack',
  ],
  sports: [
    'Greatest Athlete',
    'Best Championship Game',
    'Most Iconic Moment',
    'Best Rivalry',
    'Greatest Upset',
  ],
  tech: [
    'Best Programming Language',
    'Greatest Tech Product',
    'Best IDE',
    'Most Overrated Framework',
    'Best CLI Tool',
  ],
  anime: [
    'Best Anime Opening',
    'Greatest Fight Scene',
    'Best Protagonist',
    'Most Emotional Moment',
    'Best Studio',
  ],
  books: [
    'Best Fantasy Series',
    'Greatest Opening Line',
    'Best Mystery Novel',
    'Most Influential Book',
    'Best Autobiography',
  ],
  'tv-shows': [
    'Best TV Villain',
    'Greatest Series Finale',
    'Best Sitcom',
    'Most Binge-Worthy Show',
    'Best Mini-Series',
  ],
  'hot-takes': [
    'Worst Popular Opinion',
    'Most Overrated Thing',
    'Best Unpopular Take',
    'Hottest Food Take',
    'Most Controversial Ranking',
  ],
};

const ENTRY_NAMES: Record<string, string[]> = {
  music: [
    'Bohemian Rhapsody',
    'Stairway to Heaven',
    'Hotel California',
    'Smells Like Teen Spirit',
    'Imagine',
    'Purple Rain',
    'Sweet Child O Mine',
    'Thriller',
    'Hey Jude',
    'Billie Jean',
    'Like a Rolling Stone',
    'What a Wonderful World',
    'Yesterday',
    'Respect',
    'Born to Run',
    'Superstition',
  ],
  movies: [
    'Hans Gruber',
    'Darth Vader',
    'The Joker',
    'Thanos',
    'Voldemort',
    'Hannibal Lecter',
    'Anton Chigurh',
    'Agent Smith',
    'Sauron',
    'Loki',
    'Magneto',
    'T-1000',
    'Bane',
    'Pennywise',
    'Freddy Krueger',
    'Jaws',
  ],
  food: [
    'Pepperoni',
    'Pineapple',
    'Mushrooms',
    'Olives',
    'Bacon',
    'Jalapeños',
    'Sausage',
    'Bell Peppers',
    'Onions',
    'Anchovies',
    'Ham',
    'Spinach',
    'BBQ Chicken',
    'Buffalo Mozzarella',
    'Truffle Oil',
    'Garlic',
  ],
  gaming: [
    'The Witcher 3',
    'Skyrim',
    'Final Fantasy VII',
    'Chrono Trigger',
    "Baldur's Gate 3",
    'Elden Ring',
    'Mass Effect 2',
    'Persona 5',
    'Dragon Age Origins',
    'Divinity OS2',
    'Disco Elysium',
    'Planescape Torment',
    'Dark Souls',
    'Fallout New Vegas',
    'Knights of the Old Republic',
    'Xenoblade Chronicles',
  ],
  sports: [
    'Michael Jordan',
    'LeBron James',
    'Muhammad Ali',
    'Wayne Gretzky',
    'Lionel Messi',
    'Serena Williams',
    'Usain Bolt',
    'Tom Brady',
    'Babe Ruth',
    'Pelé',
    'Tiger Woods',
    'Michael Phelps',
    'Roger Federer',
    'Kobe Bryant',
    'Cristiano Ronaldo',
    'Mike Tyson',
  ],
  tech: [
    'Rust',
    'TypeScript',
    'Python',
    'Go',
    'Zig',
    'Kotlin',
    'Swift',
    'C#',
    'Java',
    'Elixir',
    'Haskell',
    'OCaml',
    'Scala',
    'Ruby',
    'Lua',
    'Dart',
  ],
  anime: [
    'Attack on Titan',
    'Fullmetal Alchemist',
    'Death Note',
    'One Piece',
    'Naruto',
    'Dragon Ball Z',
    'Cowboy Bebop',
    'Steins;Gate',
    'Hunter x Hunter',
    'Mob Psycho 100',
    'Jujutsu Kaisen',
    'Demon Slayer',
    'Vinland Saga',
    'Code Geass',
    'Neon Genesis Evangelion',
    'My Hero Academia',
  ],
  books: [
    'Lord of the Rings',
    'A Song of Ice and Fire',
    'Harry Potter',
    'Wheel of Time',
    'Mistborn',
    'Dune',
    'The Name of the Wind',
    'Earthsea',
    'Discworld',
    'Malazan',
    'First Law',
    'Stormlight Archive',
    'Chronicles of Narnia',
    "The Hitchhiker's Guide",
    'Foundation',
    'Neuromancer',
  ],
  'tv-shows': [
    'Breaking Bad',
    'The Wire',
    'The Sopranos',
    'Game of Thrones',
    'Succession',
    'Better Call Saul',
    'True Detective',
    'The Office',
    'Seinfeld',
    'Friends',
    'Stranger Things',
    'Dark',
    'Chernobyl',
    'Band of Brothers',
    'The Bear',
    'Severance',
  ],
  'hot-takes': [
    'Tabs are better',
    'Spaces are better',
    'Dark mode is overrated',
    'Light mode is superior',
    'Vim is the best',
    'VS Code wins',
    'Mac over Linux',
    'Linux over Mac',
    'GraphQL is dead',
    'REST is better',
    'Monorepos rule',
    'Polyrepos rule',
    'TDD is wasteful',
    'Tests are essential',
    'AI will replace devs',
    'AI is just a tool',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  return new Date(now - Math.random() * daysAgo * 24 * 60 * 60 * 1000);
}

function makeSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') +
    '-' +
    Math.random().toString(36).slice(2, 6)
  );
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  console.log('  Clearing existing data...');
  await db.delete(votes);
  await db.delete(matchups);
  await db.delete(submissions);
  await db.delete(tournamentStats);
  await db.delete(userRatings);
  await db.delete(tournaments);
  await db.delete(users);

  // 1. Create users
  console.log('  Creating 50 users...');
  const userRows = [];
  for (let i = 0; i < 50; i++) {
    userRows.push({
      name: `User ${i + 1}`,
      username: `user${i + 1}_${Math.random().toString(36).slice(2, 6)}`,
      email: `user${i + 1}_${Math.random().toString(36).slice(2, 6)}@colosseum.test`,
    });
  }
  const insertedUsers = await db.insert(users).values(userRows).returning();
  const userIds = insertedUsers.map((u) => u.id);
  console.log(`  ✅ Created ${userIds.length} users`);

  // 2. Create tournaments
  console.log('  Creating 200 tournaments...');
  const tournamentRows = [];
  // Distribution: 30 draft, 30 accepting, 60 in_progress, 60 completed, 20 cancelled
  const statusDist: Array<STATUSES[number]> = [
    ...Array(30).fill('draft'),
    ...Array(30).fill('accepting_submissions'),
    ...Array(60).fill('in_progress'),
    ...Array(60).fill('completed'),
    ...Array(20).fill('cancelled'),
  ];

  for (let i = 0; i < 200; i++) {
    const category = pick(CATEGORIES);
    const names = TOURNAMENT_NAMES[category];
    const baseName = pick(names);
    const title =
      i < names.length * CATEGORIES.length
        ? baseName
        : `${baseName} #${Math.floor(Math.random() * 100)}`;
    const entryNames = ENTRY_NAMES[category] ?? ENTRY_NAMES['tech'];
    const maxEntries = entryNames.length; // 16 max per category
    const size = Math.min(
      pick(SIZES as unknown as number[]),
      Math.pow(2, Math.ceil(Math.log2(maxEntries))),
    );
    const totalRounds = Math.log2(size);

    const status = statusDist[i];
    const createdAt = randomDate(30);

    tournamentRows.push({
      creatorId: pick(userIds),
      title,
      slug: makeSlug(title),
      description: `A tournament to decide the ultimate ${title.toLowerCase()}. Vote for your favorites!`,
      category,
      size,
      totalRounds,
      status,
      matchupDurationHours: pick([1, 2, 4, 8, 12, 24, 48]),
      createdAt,
      completedAt:
        status === 'completed'
          ? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
          : null,
    });
  }

  const insertedTournaments = await db
    .insert(tournaments)
    .values(tournamentRows)
    .returning();
  console.log(`  ✅ Created ${insertedTournaments.length} tournaments`);

  // 3. Create submissions for non-draft tournaments
  console.log('  Creating submissions...');
  const allSubRows = [];

  for (const tournament of insertedTournaments) {
    if (tournament.status === 'draft') continue;

    const category = tournament.category;
    const entryNames = ENTRY_NAMES[category] ?? ENTRY_NAMES['tech'];
    const entryCount =
      tournament.status === 'accepting_submissions'
        ? Math.floor(Math.random() * tournament.size) + 1
        : Math.min(entryNames.length, tournament.size);

    const submitters = pickN(userIds, entryCount);
    const entries = pickN(entryNames, entryCount);

    for (let idx = 0; idx < entries.length; idx++) {
      allSubRows.push({
        tournamentId: tournament.id,
        submitterId: submitters[idx],
        title: entries[idx],
        createdAt: new Date(
          tournament.createdAt!.getTime() + (idx + 1) * 60000,
        ),
      });
    }
  }

  const insertedSubmissions =
    allSubRows.length > 0
      ? await db.insert(submissions).values(allSubRows).returning()
      : [];

  console.log(`  ✅ Created ${insertedSubmissions.length} submissions`);

  // 4. Create matchups for in_progress and completed tournaments
  console.log('  Creating matchups and votes...');
  // 1. allMatchupRows
  const allMatchupRows: Array<{
    tournamentId: string;
    round: number;
    position: number;
    entryAId: string | null;
    entryBId: string | null;
    seedA: number | null;
    seedB: number | null;
    winnerId: string | null;
    votesA: number;
    votesB: number;
    isBye: boolean;
    status: string;
    activatesAt: Date | null;
    closesAt: Date | null;
    resolvedAt: Date | null;
  }> = [];

  // 2. matchupMeta
  const matchupMeta: Array<{
    votesA: number;
    votesB: number;
    entryAId: string | null;
    entryBId: string | null;
    status: string;
    isBye: boolean;
  }> = [];

  const subsByTournament = new Map<string, typeof insertedSubmissions>();
  for (const sub of insertedSubmissions) {
    if (!sub.tournamentId) continue;
    const list = subsByTournament.get(sub.tournamentId) ?? [];
    list.push(sub);
    subsByTournament.set(sub.tournamentId, list);
  }

  for (const tournament of insertedTournaments) {
    if (
      tournament.status !== 'in_progress' &&
      tournament.status !== 'completed'
    )
      continue;

    const tournamentSubs = subsByTournament.get(tournament.id) ?? [];
    if (tournamentSubs.length < 3) continue;

    const actualSize = Math.min(
      tournament.size,
      Math.pow(2, Math.ceil(Math.log2(tournamentSubs.length))),
    );
    const totalRounds = Math.log2(actualSize);
    const round1Matchups = actualSize / 2;
    const now = new Date();

    for (let pos = 0; pos < round1Matchups; pos++) {
      const idxA = pos * 2;
      const idxB = pos * 2 + 1;
      const entryA = tournamentSubs[idxA] ?? null;
      const entryB = tournamentSubs[idxB] ?? null;
      const isBye = !entryA || !entryB;
      const isCompleted = tournament.status === 'completed';

      let status: string;
      let winnerId: string | null = null;
      let votesA = 0;
      let votesB = 0;
      let activatesAt: Date | null = null;
      let closesAt: Date | null = null;
      let resolvedAt: Date | null = null;

      if (isBye) {
        status = 'bye';
        winnerId = entryA?.id ?? entryB?.id ?? null;
      } else if (isCompleted) {
        status = 'completed';
        votesA = Math.floor(Math.random() * 100) + 10;
        votesB = Math.floor(Math.random() * 100) + 10;
        winnerId = votesA >= votesB ? entryA!.id : entryB!.id;
        activatesAt = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        closesAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        resolvedAt = closesAt;
      } else {
        if (pos < round1Matchups / 2) {
          status = 'completed';
          votesA = Math.floor(Math.random() * 50) + 5;
          votesB = Math.floor(Math.random() * 50) + 5;
          winnerId = votesA >= votesB ? entryA!.id : entryB!.id;
          activatesAt = new Date(now.getTime() - 12 * 60 * 60 * 1000);
          closesAt = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          resolvedAt = closesAt;
        } else {
          status = 'active';
          activatesAt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          closesAt = new Date(
            now.getTime() + pick([1, 2, 4, 8, 12]) * 60 * 60 * 1000,
          );
          votesA = Math.floor(Math.random() * 30);
          votesB = Math.floor(Math.random() * 30);
        }
      }

      allMatchupRows.push({
        tournamentId: tournament.id,
        round: 1,
        position: pos,
        entryAId: entryA?.id ?? null,
        entryBId: isBye ? null : (entryB?.id ?? null),
        seedA: entryA ? idxA + 1 : null,
        seedB: isBye ? null : entryB ? idxB + 1 : null,
        winnerId,
        votesA,
        votesB,
        isBye,
        status,
        activatesAt,
        closesAt,
        resolvedAt,
      });
      matchupMeta.push({
        votesA,
        votesB,
        entryAId: entryA?.id ?? null,
        entryBId: isBye ? null : (entryB?.id ?? null),
        status,
        isBye,
      });
    }

    let matchupsInRound = round1Matchups / 2;
    for (let round = 2; round <= totalRounds; round++) {
      for (let pos = 0; pos < matchupsInRound; pos++) {
        allMatchupRows.push({
          tournamentId: tournament.id,
          round,
          position: pos,
          entryAId: null,
          entryBId: null,
          seedA: null,
          seedB: null,
          winnerId: null,
          votesA: 0,
          votesB: 0,
          isBye: false,
          status: 'pending',
          activatesAt: null,
          closesAt: null,
          resolvedAt: null,
        });
        matchupMeta.push({
          votesA: 0,
          votesB: 0,
          entryAId: null,
          entryBId: null,
          status: 'pending',
          isBye: false,
        });
      }
      matchupsInRound /= 2;
    }
  }

  // One insert for ALL matchups
  const insertedMatchups =
    allMatchupRows.length > 0
      ? await db.insert(matchups).values(allMatchupRows).returning()
      : [];
  console.log(`  ✅ Created ${insertedMatchups.length} matchups`);

  // Build all votes in memory, one insert at the end
  const allVoteRows: Array<{
    matchupId: string;
    userId: string;
    submissionId: string;
  }> = [];
  for (let i = 0; i < insertedMatchups.length; i++) {
    const m = insertedMatchups[i];
    const meta = matchupMeta[i];
    if (meta.status !== 'completed' || meta.isBye) continue;

    const voterCount = Math.min(meta.votesA + meta.votesB, userIds.length);
    const voters = pickN(userIds, voterCount);
    for (let idx = 0; idx < voters.length; idx++) {
      allVoteRows.push({
        matchupId: m.id,
        userId: voters[idx],
        submissionId: idx < meta.votesA ? meta.entryAId! : meta.entryBId!,
      });
    }
  }

  if (allVoteRows.length > 0) {
    // Chunk into batches of 1000 to avoid exceeding Postgres parameter limits
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < allVoteRows.length; i += CHUNK_SIZE) {
      const chunk = allVoteRows.slice(i, i + CHUNK_SIZE);
      try {
        await db.insert(votes).values(chunk);
      } catch {
        /* skip constraint violations */
      }
    }
  }
  console.log(`  ✅ Created ${allVoteRows.length} votes`);

  // 5. Create trending stats
  console.log('  Creating trending stats...');
  const activeTournaments = insertedTournaments.filter(
    (t) => t.status === 'in_progress' || t.status === 'completed',
  );
  const statsRows = activeTournaments.map((t) => {
    const totalVotes = Math.floor(Math.random() * 500);
    const votes24h = Math.floor(Math.random() * totalVotes * 0.3);
    const ageHours = (Date.now() - t.createdAt!.getTime()) / (1000 * 60 * 60);
    return {
      tournamentId: t.id,
      totalVotes,
      votes24h,
      trendingScore: votes24h / Math.pow(ageHours + 2, 1.5),
    };
  });
  if (statsRows.length > 0) {
    await db.insert(tournamentStats).values(statsRows);
  }
  console.log(`  ✅ Created ${statsRows.length} trending stats`);

  // 6. Create user ratings
  console.log('  Creating user ratings...');
  const ratingRows = [];
  for (const userId of userIds.slice(0, 30)) {
    const cats = pickN(CATEGORIES, Math.floor(Math.random() * 4) + 1);
    for (const category of cats) {
      ratingRows.push({
        userId,
        category,
        rating: 1000 + Math.floor(Math.random() * 600),
        matchesPlayed: Math.floor(Math.random() * 50) + 1,
      });
    }
  }
  if (ratingRows.length > 0) {
    await db.insert(userRatings).values(ratingRows);
  }
  console.log(`  ✅ Created ${ratingRows.length} user ratings`);

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

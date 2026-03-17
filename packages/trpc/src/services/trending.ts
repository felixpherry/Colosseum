import { db as database, sql } from '@colosseum/db';

type DB = typeof database;

export async function refreshTrendingScores(db: DB) {
  return db.execute(
    sql`
  INSERT INTO tournament_stats (tournament_id, total_votes, votes_24h, trending_score, last_calculated_at)
  SELECT
    t.id,
    COUNT(v.id) AS total_votes,
    COUNT(v.id) FILTER (WHERE v.created_at > NOW() - INTERVAL '24 hours') AS votes_24h,
    COALESCE(
      COUNT(v.id) FILTER (WHERE v.created_at > NOW() - INTERVAL '24 hours')::float
      / POWER(EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600 + 2, 1.5),
      0
    ) AS trending_score,
    NOW() AS last_calculated_at
  FROM tournaments t
  LEFT JOIN matchups m ON m.tournament_id = t.id
  LEFT JOIN votes v ON v.matchup_id = m.id
  WHERE t.status IN ('in_progress', 'completed')
  GROUP BY t.id
  ON CONFLICT (tournament_id)
  DO UPDATE SET
    total_votes = EXCLUDED.total_votes,
    votes_24h = EXCLUDED.votes_24h,
    trending_score = EXCLUDED.trending_score,
    last_calculated_at = EXCLUDED.last_calculated_at
        `,
  );
}

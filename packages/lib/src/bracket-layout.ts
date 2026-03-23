export type MatchupPosition = {
  round: number;
  position: number;
  y: number;
};

/**
 * Calculates Y positions for every matchup in a bracket.
 * Round 1 nodes are evenly spaced. Each subsequent round
 * is vertically centered between its two children.
 */
export function calculateBracketLayout(
  totalRounds: number,
  nodeHeight: number,
  gap: number,
): MatchupPosition[] {
  const queue: MatchupPosition[] = [];
  const firstRoundMatchups = Math.pow(2, totalRounds - 1);

  let currY = 0;
  for (let i = 0; i < firstRoundMatchups; i++) {
    queue.push({ position: i, round: 1, y: currY });
    currY += nodeHeight + gap;
  }

  const result: MatchupPosition[] = [];
  while (queue.length > 1) {
    const m1 = queue.shift()!;
    const m2 = queue.shift()!;
    queue.push({
      position: Math.floor(m1.position / 2),
      round: m1.round + 1,
      y: (m1.y + m2.y) / 2,
    });
    result.push(m1, m2);
  }

  if (queue.length > 0) {
    result.push(queue.pop()!);
  }

  return result;
}

/**
 * Returns the total pixel height of the bracket.
 */
export function calculateBracketHeight(
  totalRounds: number,
  nodeHeight: number,
  gap: number,
): number {
  const matchups = Math.pow(2, totalRounds - 1);
  return matchups * nodeHeight + (matchups - 1) * gap;
}

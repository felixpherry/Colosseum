'use client';

import { useMemo } from 'react';
import { calculateBracketLayout, calculateBracketHeight } from '@colosseum/lib';
import { MatchupNode } from './matchup-node';
import { trpc } from '@/trpc/client';

const NODE_HEIGHT = 64;
const NODE_WIDTH = 180;
const GAP = 12;
const ROUND_GAP = 60;
const CONNECTOR_WIDTH = 24;

type BracketViewProps = {
  tournamentId: string;
  totalRounds: number;
};

export function BracketView({ tournamentId, totalRounds }: BracketViewProps) {
  const { data: matchups, refetch } = trpc.tournament.listMatchups.useQuery({
    tournamentId,
  });
  const { mutate: castVote } = trpc.vote.cast.useMutation({
    onSuccess: () => refetch(),
  });

  const layout = useMemo(
    () => calculateBracketLayout(totalRounds, NODE_HEIGHT, GAP),
    [totalRounds],
  );

  const bracketHeight = useMemo(
    () => calculateBracketHeight(totalRounds, NODE_HEIGHT, GAP),
    [totalRounds],
  );

  const layoutMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const pos of layout) {
      map.set(`${pos.round}-${pos.position}`, pos.y);
    }
    return map;
  }, [layout]);

  if (!matchups) return <div className="text-text-500">Loading bracket...</div>;

  const totalWidth =
    totalRounds * NODE_WIDTH +
    (totalRounds - 1) * (ROUND_GAP + CONNECTOR_WIDTH * 2);

  // Generate connector lines between rounds
  const connectors: { x1: number; y1: number; x2: number; y2: number; xMid: number }[] = [];
  for (const matchup of matchups) {
    if (matchup.round === 1) continue;
    const parentY = layoutMap.get(`${matchup.round}-${matchup.position}`);
    const childAY = layoutMap.get(`${matchup.round - 1}-${matchup.position * 2}`);
    const childBY = layoutMap.get(`${matchup.round - 1}-${matchup.position * 2 + 1}`);
    if (parentY === undefined || childAY === undefined || childBY === undefined) continue;

    const parentX = (matchup.round - 1) * (NODE_WIDTH + ROUND_GAP + CONNECTOR_WIDTH * 2);
    const childX = (matchup.round - 2) * (NODE_WIDTH + ROUND_GAP + CONNECTOR_WIDTH * 2) + NODE_WIDTH;
    const parentCenterY = parentY + NODE_HEIGHT / 2;
    const childACenterY = childAY + NODE_HEIGHT / 2;
    const childBCenterY = childBY + NODE_HEIGHT / 2;
    const xMid = childX + CONNECTOR_WIDTH;

    connectors.push(
      { x1: childX, y1: childACenterY, x2: xMid, y2: childACenterY, xMid },
      { x1: xMid, y1: childACenterY, x2: xMid, y2: childBCenterY, xMid },
      { x1: xMid, y1: parentCenterY, x2: parentX, y2: parentCenterY, xMid },
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Round headers */}
      <div className="flex mb-3" style={{ width: `${totalWidth}px` }}>
        {Array.from({ length: totalRounds }, (_, i) => {
          const roundNum = i + 1;
          const roundsFromEnd = totalRounds - roundNum;
          let label = `Round ${roundNum}`;
          if (roundsFromEnd === 0) label = 'Finals';
          else if (roundsFromEnd === 1) label = 'Semifinals';
          else if (roundsFromEnd === 2) label = 'Quarterfinals';

          return (
            <div
              key={roundNum}
              className="text-caption text-text-300 font-medium"
              style={{
                width: `${NODE_WIDTH}px`,
                marginRight:
                  i < totalRounds - 1
                    ? `${ROUND_GAP + CONNECTOR_WIDTH * 2}px`
                    : '0',
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Bracket area */}
      <div
        className="relative"
        style={{ width: `${totalWidth}px`, height: `${bracketHeight}px` }}
      >
        {/* SVG connectors */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={bracketHeight}
        >
          {connectors.map((c, i) => (
            <line
              key={i}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
              stroke="var(--color-surface-200)"
              strokeWidth={1.5}
            />
          )}
        </svg>

        {/* Matchup nodes */}
        {matchups.map((matchup) => {
          const y = layoutMap.get(`${matchup.round}-${matchup.position}`);
          if (y === undefined) return null;

          const x =
            (matchup.round - 1) *
            (NODE_WIDTH + ROUND_GAP + CONNECTOR_WIDTH * 2);

          return (
            <div
              key={matchup.id}
              className="absolute"
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              <MatchupNode
                matchup={matchup}
                height={NODE_HEIGHT}
                isFinal={matchup.round === totalRounds}
                onVote={(matchupId, submissionId) =>
                  castVote({ matchupId, submissionId })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

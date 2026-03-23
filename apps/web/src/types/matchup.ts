export type ActiveMatchup = {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  tournamentSlug: string;
  round: number;
  totalRounds: number;
  entryA: {
    id: string;
    title: string;
    imageUrl: string | null;
  };
  entryB: {
    id: string;
    title: string;
    imageUrl: string | null;
  };
  closesAt: Date;
  votesA: number;
  votesB: number;
  userVote: string | null;
  winnerId: string | null; // null = not resolved yet
};

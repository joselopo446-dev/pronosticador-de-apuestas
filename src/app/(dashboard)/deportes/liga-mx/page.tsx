// =============================================
// PÁGINA — LIGA MX
// =============================================

import LeagueView from "../LeagueView";
import {
  getUpcomingFixtures,
  getRecentResults,
  getLeagueStandings,
  LEAGUES,
} from "@/lib/sports";

export default async function LigaMxPage() {
  const [standings, recentResults, upcomingFixtures] = await Promise.all([
    getLeagueStandings(LEAGUES.LIGA_MX),
    getRecentResults(LEAGUES.LIGA_MX, 5),
    getUpcomingFixtures(LEAGUES.LIGA_MX, 5),
  ]);

  return (
    <LeagueView
      leagueName="Liga MX"
      country="México"
      flag="🇲🇽"
      color="green"
      standings={standings}
      recentResults={recentResults}
      upcomingFixtures={upcomingFixtures}
    />
  );
}

// =============================================
// PÁGINA — LA LIGA
// =============================================

import LeagueView from "../LeagueView";
import {
  getUpcomingFixtures,
  getRecentResults,
  getLeagueStandings,
  LEAGUES,
} from "@/lib/sports";

export default async function LaLigaPage() {
  const [standings, recentResults, upcomingFixtures] = await Promise.all([
    getLeagueStandings(LEAGUES.LA_LIGA),
    getRecentResults(LEAGUES.LA_LIGA, 5),
    getUpcomingFixtures(LEAGUES.LA_LIGA, 5),
  ]);

  return (
    <LeagueView
      leagueName="La Liga"
      country="España"
      flag="🇪🇸"
      color="red"
      standings={standings}
      recentResults={recentResults}
      upcomingFixtures={upcomingFixtures}
    />
  );
}

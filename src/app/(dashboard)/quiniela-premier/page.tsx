// =============================================
// QUINIELA PREMIER LEAGUE — WRAPPER
// =============================================
import QuinielaPage from "../quiniela-mexicana/QuinielaPage";

export default function QuinielaPremierPage() {
  return (
    <QuinielaPage
      config={{
        slug: "premier",
        name: "PL",
        fullName: "Quiniela Premier League",
        color: "purple",
        gradient: "from-gray-800/80 via-purple-900/30 to-gray-800/80",
        accentColor: "purple",
      }}
    />
  );
}

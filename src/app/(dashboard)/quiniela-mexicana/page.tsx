// =============================================
// QUINIELA MEXICANA — WRAPPER
// =============================================
import QuinielaPage from "../quiniela-mexicana/QuinielaPage";

export default function QuinielaMexicanaPage() {
  return (
    <QuinielaPage
      config={{
        slug: "liga-mx",
        name: "MX",
        fullName: "Quiniela Mexicana",
        color: "green",
        gradient: "from-gray-800/80 via-gray-900/80 to-gray-800/80",
        accentColor: "green",
      }}
    />
  );
}

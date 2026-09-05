// =============================================
// QUINIELA LA LIGA — WRAPPER
// =============================================
import QuinielaPage from "../quiniela-mexicana/QuinielaPage";

export default function QuinielaLaLigaPage() {
  return (
    <QuinielaPage
      config={{
        slug: "laliga",
        name: "LaLiga",
        fullName: "Quiniela La Liga",
        color: "orange",
        gradient: "from-gray-800/80 via-orange-900/20 to-gray-800/80",
        accentColor: "orange",
      }}
    />
  );
}

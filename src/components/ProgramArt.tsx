import { Icon } from "./Icon";

/**
 * Visuel de remplacement pour les programmes sans photo autorisée (Omra, croisières, voyages à l'étranger) :
 * on n'affiche pas de dunes pour Istanbul ou La Mecque. Aucune photo tierce n'est utilisée.
 */
export default function ProgramArt({ type, label, className = "" }: { type: string; label?: string; className?: string }) {
  const theme =
    type === "OMRA"
      ? { bg: "bg-[radial-gradient(circle_at_75%_20%,rgba(212,168,69,0.45),transparent_45%),linear-gradient(160deg,#0f3b2e,#0B1A2E_75%)]", icon: "moon", word: "عمرة" }
      : type === "CROISIERE"
        ? { bg: "bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.18),transparent_45%),linear-gradient(160deg,#1d5a8c,#0B1A2E_80%)]", icon: "globe", word: "" }
        : { bg: "bg-[radial-gradient(circle_at_80%_15%,rgba(212,168,69,0.35),transparent_45%),linear-gradient(160deg,#16304f,#0B1A2E)]", icon: "globe", word: "" };
  return (
    <span className={`${className.includes("absolute") ? "" : "relative "}block overflow-hidden ${theme.bg} ${className}`} aria-hidden>
      <span className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(45deg,#D4A845_0_1px,transparent_1px_16px)]" />
      <Icon name={theme.icon} className="absolute -end-8 -top-8 h-56 w-56 text-sand/15" />
      {theme.word && <span className="font-display absolute bottom-6 end-6 text-7xl font-semibold text-sand/35">{theme.word}</span>}
      {label && <span className="font-display absolute start-6 top-1/2 max-w-[70%] -translate-y-1/2 text-3xl font-semibold leading-tight text-white/90">{label}</span>}
    </span>
  );
}

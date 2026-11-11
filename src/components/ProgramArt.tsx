import BrandArt from "./BrandArt";
import { Icon } from "./Icon";

/**
 * Visuel de remplacement pour les programmes sans photo autorisée (Omra, croisières, voyages à l'étranger).
 * Aucune photo tierce n'est utilisée ; couleurs issues du système de design.
 */
export default function ProgramArt({ type, label, className = "" }: { type: string; label?: string; className?: string }) {
  const theme =
    type === "OMRA"
      ? { variant: "noon" as const, icon: "moon", word: "عمرة" }
      : type === "CROISIERE"
        ? { variant: "dusk" as const, icon: "globe", word: "" }
        : { variant: "sunset" as const, icon: "globe", word: "" };
  return (
    <span className={`${className.includes("absolute") ? "" : "relative "}block overflow-hidden bg-night ${className}`} aria-hidden>
      <BrandArt variant={theme.variant} seed={label ? label.length * 7 : 5} className="absolute inset-0 h-full w-full" />
      <Icon name={theme.icon} className="absolute -end-8 -top-8 h-48 w-48 text-gold-light/15" />
      {theme.word && <span className="font-display absolute bottom-5 end-6 text-6xl text-gold-light/40">{theme.word}</span>}
      {label && <span className="font-display absolute start-5 top-1/2 max-w-[70%] -translate-y-1/2 text-2xl leading-tight text-white">{label}</span>}
    </span>
  );
}

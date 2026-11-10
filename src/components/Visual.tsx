import DuneArt from "./DuneArt";
import type { Photo } from "@/lib/photos";

type Variant = "sunset" | "dawn" | "night" | "noon" | "dusk";

/** Photo autorisée si disponible, sinon illustration vectorielle — même cadrage */
export default function Visual({
  photo,
  variant = "sunset",
  seed = 1,
  caravan = false,
  className = "",
  imgClassName = "",
  priority = false,
  showCredit = false,
  title,
}: {
  photo?: Photo;
  variant?: Variant;
  seed?: number;
  caravan?: boolean;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  showCredit?: boolean;
  title?: string;
}) {
  if (!photo) return <DuneArt variant={variant} seed={seed} caravan={caravan} className={className} title={title} />;
  return (
    <span className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.src}
        alt={photo.alt || title || ""}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={`h-full w-full object-cover ${imgClassName}`}
      />
      {showCredit && photo.credit && (
        <span className="absolute bottom-1.5 end-2 rounded bg-black/35 px-1.5 py-0.5 text-[10px] text-white/85 backdrop-blur-sm">© {photo.credit}</span>
      )}
    </span>
  );
}

import Image from "next/image";
import BrandArt from "./BrandArt";
import type { Photo } from "@/lib/photos";

type Variant = "sunset" | "dawn" | "night" | "noon" | "dusk";

/** Photo autorisée (next/image : AVIF/WebP, tailles adaptées) si disponible, sinon visuel de marque — même cadrage */
export default function Visual({
  photo,
  variant = "sunset",
  seed = 1,
  className = "",
  imgClassName = "",
  priority = false,
  showCredit = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
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
  sizes?: string;
  title?: string;
}) {
  if (!photo) return <BrandArt variant={variant} seed={seed} className={className} title={title} />;
  return (
    <span className={`${/(absolute|fixed)/.test(className) ? "" : "relative"} block overflow-hidden ${className}`}>
      <Image src={photo.src} alt={photo.alt || title || ""} fill sizes={sizes} priority={priority} className={`object-cover ${imgClassName}`} />
      {showCredit && photo.credit && (
        <span className="absolute bottom-1.5 end-2 rounded bg-night/50 px-1.5 py-0.5 text-[10px] text-white/90">© {photo.credit}</span>
      )}
    </span>
  );
}

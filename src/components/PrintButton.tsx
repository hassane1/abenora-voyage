"use client";

import { Icon } from "./Icon";

/** Génère le programme en PDF via la boîte d'impression du navigateur (« Enregistrer au format PDF ») */
export default function PrintButton({ label, className = "btn btn-ghost text-white" }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Icon name="print" className="h-4 w-4" /> {label}
    </button>
  );
}

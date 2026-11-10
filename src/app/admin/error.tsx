"use client";

/**
 * Erreur inattendue côté serveur : message générique, aucun détail technique.
 * La référence (digest) permet de retrouver l'incident dans les journaux du serveur.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-night">Un incident est survenu</h1>
      <p className="mt-4 text-muted">La page n&apos;a pas pu être affichée. Réessayez dans un instant ; si le problème persiste, contactez-nous.</p>
      {error.digest && <p className="mt-2 text-xs text-muted">Référence : {error.digest}</p>}
      <button onClick={reset} className="btn btn-primary mt-8">Réessayer</button>
    </div>
  );
}

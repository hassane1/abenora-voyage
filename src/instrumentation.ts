/**
 * Exécuté une fois au démarrage du serveur Next.js.
 * En production, sans TRUST_PROXY, l'adresse IP des visiteurs n'est pas connue (« unknown ») :
 * tous partagent alors les mêmes compteurs de limitation de débit. On le signale dans les journaux.
 */
export async function register() {
  if (process.env.NODE_ENV === "production" && !process.env.TRUST_PROXY) {
    console.warn(
      "[sécurité] TRUST_PROXY n'est pas défini : l'IP des visiteurs vaut « unknown » et les limites de débit sont communes à tous. " +
        "Définissez TRUST_PROXY=1 si le site est servi via Cloudflare (serveur à l'écoute sur 127.0.0.1 uniquement).",
    );
  }
}

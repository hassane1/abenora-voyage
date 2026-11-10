import type { Locale } from "./config";
import fr from "./dictionaries/fr";
import en from "./dictionaries/en";
import ar from "./dictionaries/ar";

// Utilisable côté serveur et côté client (les dictionnaires contiennent des fonctions,
// on transmet donc la locale aux composants client plutôt que le dictionnaire).
const dictionaries = { fr, en, ar };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

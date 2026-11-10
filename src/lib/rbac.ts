/** Rôles et permissions de l'administration (RBAC). Aucune dépendance serveur : utilisable dans l'UI. */
export const ROLES = {
  ADMIN: "Administrateur (tous les droits)",
  MANAGER: "Responsable (tout sauf utilisateurs et sécurité)",
  AGENT: "Conseiller (réservations, demandes, devis, messages)",
  ACCOUNTANT: "Comptable (finances, paiements, lecture des réservations)",
} as const;
export type Role = keyof typeof ROLES;

export type Permission =
  | "bookings.read"
  | "bookings.write"
  | "payments.write"
  | "finance.read"
  | "quotes.write"
  | "catalog.write"
  | "content.write"
  | "marketing.write"
  | "settings.write"
  | "users.manage"
  | "audit.read";

const MATRIX: Record<Role, Permission[]> = {
  ADMIN: ["bookings.read", "bookings.write", "payments.write", "finance.read", "quotes.write", "catalog.write", "content.write", "marketing.write", "settings.write", "users.manage", "audit.read"],
  MANAGER: ["bookings.read", "bookings.write", "payments.write", "finance.read", "quotes.write", "catalog.write", "content.write", "marketing.write", "settings.write", "audit.read"],
  AGENT: ["bookings.read", "bookings.write", "quotes.write"],
  ACCOUNTANT: ["bookings.read", "payments.write", "finance.read"],
};

export function can(role: string, perm: Permission): boolean {
  return (MATRIX[role as Role] ?? []).includes(perm);
}

export function isRole(v: string): v is Role {
  return v in ROLES;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/security";
import { sendReviewInvite } from "@/lib/review-invites";

/** Envoi MANUEL des invitations à donner un avis (individuel ou groupé), journalisé dans l'audit */
export async function inviteReviews(formData: FormData) {
  const admin = await requireAdmin("content.write");
  // bouton « Inviter » d'une ligne : ce seul dossier ; bouton groupé : les dossiers cochés
  const single = String(formData.get("single") ?? "");
  const ids = (single ? [single] : formData.getAll("bookingId").map(String)).filter((x) => /^[a-z0-9]{10,40}$/.test(x)).slice(0, 100);
  let sent = 0;
  const refused: string[] = [];
  for (const id of ids) {
    const r = await sendReviewInvite(id, admin.email);
    if (r.ok) sent++;
    else refused.push(r.reason);
  }
  await audit(admin.email, "REVIEW_INVITE", ids.join(","), { sent, refused: refused.length });
  revalidatePath("/admin/avis");
  redirect(`/admin/avis?invited=${sent}&refused=${refused.length}`);
}

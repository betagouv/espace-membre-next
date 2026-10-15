import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { getGristAttachment } from "@/lib/grist";
import config from "@/server/config";
import { authOptions } from "@/lib/authoptions";

/**
 * Relais vers le magasin de pièces jointes du document Grist des formations.
 *
 * Les illustrations n'y sont accessibles qu'avec la clé d'API, que le
 * navigateur n'a pas : cette route les sert aux membres connectés, sans jamais
 * exposer la clé.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { attachmentId } = await params;
  const id = Number(attachmentId);
  if (!Number.isInteger(id) || id <= 0) {
    return new NextResponse("Identifiant invalide", { status: 400 });
  }

  if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
    return new NextResponse("Grist n'est pas configuré", { status: 503 });
  }

  try {
    const { body, contentType } = await getGristAttachment(
      config.GRIST_FORMATIONS_DOC_ID,
      id,
    );
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        // Ces fichiers sont déposés par les membres, et un SVG est un document
        // scriptable : ouvert directement, il s'exécuterait sur l'origine de
        // l'application, que la CSP laisse faire puisqu'elle autorise l'inline.
        // Servi en pièce jointe, une navigation directe télécharge au lieu
        // d'afficher — y compris pour ce qui est déjà stocké. Les balises
        // <img> du catalogue, elles, ignorent cet en-tête : les illustrations
        // s'affichent comme avant. Grist le pose déjà sur son propre endpoint
        // de téléchargement, le relais se contentait de ne pas le reprendre.
        "Content-Disposition": "attachment",
        // Et on interdit au navigateur de deviner un type plus dangereux que
        // celui annoncé.
        "X-Content-Type-Options": "nosniff",
        // Les pièces jointes Grist sont immuables : leur identifiant change
        // quand le fichier change.
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Pièce jointe introuvable", { status: 404 });
  }
}

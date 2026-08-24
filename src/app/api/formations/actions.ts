"use server";

import { getServerSession } from "next-auth";

import {
  addGristRecords,
  getGristRecords,
  GristRecordFields,
} from "@/lib/grist";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import {
  formationProposalSchema,
  formationProposalSchemaType,
} from "@/models/actions/formationProposal";
import {
  FORMATION_STATUT,
  GRIST_FORMATIONS_COLUMNS,
} from "@/models/formationsGrist";
import config from "@/server/config";
import { authOptions } from "@/lib/authoptions";
import {
  AuthorizationError,
  BusinessError,
  withErrorHandling,
} from "@/lib/error";

export const submitFormationProposal = withErrorHandling(
  async (data: formationProposalSchemaType) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthorizationError("Tu dois être connecté·e.");
    }

    const parsed = formationProposalSchema.parse(data);

    if (!config.GRIST_API_KEY || !config.GRIST_FORMATIONS_DOC_ID) {
      throw new BusinessError(
        "gristNotConfigured",
        "L'intégration Grist n'est pas configurée (GRIST_API_KEY / GRIST_FORMATIONS_DOC_ID).",
      );
    }

    // Le statut est décidé ici, jamais par le client : l'équipe d'animation
    // crée une formation directement validée, un membre la propose.
    const isAnimation = await isAnimationTeamMember(session.user);
    const statut = isAnimation
      ? FORMATION_STATUT.VALIDEE
      : FORMATION_STATUT.PROPOSEE;

    // Référent = la ligne Membres du déposant. La table est synchronisée sur le
    // ghid (= username) ; introuvable, on laisse la référence vide plutôt que
    // d'échouer, le titre et le statut suffisent à retrouver la demande.
    const membres = await getGristRecords(
      config.GRIST_FORMATIONS_DOC_ID,
      config.GRIST_FORMATIONS_MEMBRES_TABLE_ID,
      { ghid: [session.user.id] },
    );
    const referentRowId = membres[0]?.id ?? 0;

    const fields: GristRecordFields = {
      [GRIST_FORMATIONS_COLUMNS.titre]: parsed.titre,
      [GRIST_FORMATIONS_COLUMNS.description]: parsed.description,
      [GRIST_FORMATIONS_COLUMNS.modalite]: parsed.modalite,
      // Les ChoiceList passent par l'API records au format ["L", ...valeurs].
      [GRIST_FORMATIONS_COLUMNS.thematiques]: ["L", ...parsed.thematiques],
      [GRIST_FORMATIONS_COLUMNS.audience]: ["L", ...parsed.audience],
      [GRIST_FORMATIONS_COLUMNS.capacite]: parsed.capacite ?? null,
      [GRIST_FORMATIONS_COLUMNS.duree]: parsed.duree ?? null,
      [GRIST_FORMATIONS_COLUMNS.referent]: referentRowId,
      [GRIST_FORMATIONS_COLUMNS.statut]: statut,
    };

    await addGristRecords(
      config.GRIST_FORMATIONS_DOC_ID,
      config.GRIST_FORMATIONS_FORMATS_TABLE_ID,
      [fields],
    );

    return { ok: true, statut };
  },
);

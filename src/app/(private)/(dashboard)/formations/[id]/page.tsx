import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Card from "@codegouvfr/react-dsfr/Card";
import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale/fr";
import MarkdownIt from "markdown-it";
import type { Metadata, ResolvingMetadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BreadCrumbFiller } from "@/app/BreadCrumbProvider";
import { db } from "@/lib/kysely";
import { routes } from "@/lib/routes";
import {
  fetchGristFormationById,
  fetchGristInscriptions,
  fetchGristParticipantsForSessions,
} from "@/lib/formationsGrist";
import { FormationRegisterButton } from "@/components/Formation/FormationRegisterButton";
import { FormationManagePanel } from "@/components/Formation/FormationManagePanel";
import { FormationOtherDates } from "@/components/Formation/FormationOtherDates";
import {
  canManageFormation,
  isFormationAnimator,
} from "@/lib/canManageFormation";
import { FORMATION_DUREES, FORMATION_STATUT } from "@/models/formationsGrist";
import { isAnimationTeamMember } from "@/lib/isAnimationTeamMember";
import { formationUpdateSchemaType } from "@/models/actions/formationProposal";
import { notFound } from "next/navigation";
import { getUserInfos } from "@/lib/kysely/queries/users";
import { userInfosToModel } from "@/models/mapper";
import { CommunicationEmailCode, Domaine } from "@/models/member";
import { authOptions } from "@/lib/authoptions";
import { durationBetweenDate } from "@/lib/date";
import { libelleInscriptions } from "@/lib/formationSeats";

/**
 * Rendu de la description, écrite par la personne qui dépose la formation.
 *
 * `html: false` échappe le HTML brut au lieu de le laisser passer : la
 * description est du texte libre, rendu ensuite via `dangerouslySetInnerHTML`,
 * et la fiche est lisible dès le dépôt — avant toute validation. Sans cet
 * échappement, une balise avec gestionnaire inline (`<img src=x onerror=…>`)
 * s'exécuterait à l'ouverture de la fiche, en premier lieu chez la personne de
 * l'équipe d'animation venue la modérer. La CSP ne l'arrête pas : elle autorise
 * l'inline.
 *
 * Le markdown, lui, continue de fonctionner : c'est tout ce dont la description
 * a besoin.
 */
const mdParser = new MarkdownIt({
  html: false,
});

export async function generateMetadata(
  props: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // fetch data
  const params = await props.params;
  const formation = await fetchGristFormationById(params.id, {
    statuts: [FORMATION_STATUT.VALIDEE, FORMATION_STATUT.PROPOSEE],
  });
  return {
    title: `${formation?.name ?? "Formation"} / Espace Membre`,
  };
}

type Props = {
  params: Promise<{ id: string }>;
};

enum AirtableDomaine {
  Intrapreneur = "Intrapreneur.e",
  "Chargé.e de déploiement" = "Chargé.e de déploiement",
  "Chargé.e de Support usagers" = "Chargé.e de Support usagers",
  "Développpeur.euse" = "Développeur.euse",
  "UX Designer" = "UX Designer",
  Coach = "Coach",
  "Animateur.ice" = "Animateur.ice",
  "Product Owner" = "Product Owner",
  "Growth Hacker" = "Growth Hacker",
  Data = "Data",
  Attributaire = "Attributaire",
  Support = "Support",
}

const DomaineToAirtableDomaine: Record<Domaine, AirtableDomaine> = {
  [Domaine.INTRAPRENARIAT]: AirtableDomaine.Intrapreneur,
  [Domaine.SUPPORT]: AirtableDomaine.Support,
  [Domaine.ATTRIBUTAIRE]: AirtableDomaine.Attributaire,
  [Domaine.ANIMATION]: AirtableDomaine["Animateur.ice"],
  [Domaine.COACHING]: AirtableDomaine.Coach,
  [Domaine.DEPLOIEMENT]: AirtableDomaine["Chargé.e de déploiement"],
  [Domaine.DESIGN]: AirtableDomaine["UX Designer"],
  [Domaine.DEVELOPPEMENT]: AirtableDomaine["Développpeur.euse"],
  [Domaine.PRODUIT]: AirtableDomaine["Product Owner"],
  [Domaine.AUTRE]: AirtableDomaine[""],
  [Domaine.DATA]: AirtableDomaine["Data"],
};

export default async function Page(props: Readonly<Props>) {
  const params = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }
  const buildInscriptionLink = (
    originalUrl: string,
    user: {
      fullname: string;
      email: string;
      username: string;
      domaine: Domaine;
    },
  ) => {
    const url = new URL(originalUrl);
    const newParams = {
      prefill_Nom: user.fullname,
      prefill_Email: user.email,
      prefill_Domaine: DomaineToAirtableDomaine[user.domaine],
      prefill_username: user.username,
    };
    // Access the current search parameters
    const searchParams = new URLSearchParams(url.search);

    // Add new query parameters from the newParams object
    Object.keys(newParams).forEach((key) => {
      searchParams.set(key, newParams[key]);
    });
    // Set the modified search parameters back to the URL object
    url.search = searchParams.toString();

    // Return the modified URL as a string
    return url.toString();
  };
  // Les propositions ne sont pas au catalogue, mais l'équipe d'animation et la
  // personne qui anime doivent pouvoir les ouvrir pour les examiner. On les
  // charge donc, quitte à refermer la porte juste après.
  const formation = await fetchGristFormationById(params.id, {
    statuts: [FORMATION_STATUT.VALIDEE, FORMATION_STATUT.PROPOSEE],
  });
  if (!formation) {
    notFound();
  }

  const isAnimation = await isAnimationTeamMember(session.user);
  const canManage = await canManageFormation(session.user, formation);
  // Une formation pas encore validée n'existe pour personne d'autre : 404, et
  // non « accès refusé », qui révélerait qu'elle existe.
  if (formation.statut !== FORMATION_STATUT.VALIDEE && !canManage) {
    notFound();
  }

  // Inscription du membre à la session à venir, s'il y en a une.
  const inscriptions = await fetchGristInscriptions(session.user.id);
  const gristInscription = formation.sessionId
    ? inscriptions.find((i) => i.sessionId === formation.sessionId)
    : undefined;

  // Panneau de gestion : réservé à l'équipe d'animation et à la personne qui
  // anime. Le droit est recalculé côté serveur, l'affichage n'en est que la
  // conséquence.
  const isAnimator = isFormationAnimator(session.user, formation);
  // Toutes les dates, pas seulement la plus proche : le panneau de gestion
  // déplie les inscrits date par date.
  const participantsBySession = canManage
    ? await fetchGristParticipantsForSessions(
        (formation.sessions ?? []).map((s) => s.id),
      )
    : {};
  const participants = Object.values(participantsBySession).flat();

  // Un lien vers une fiche inexistante est pire que pas de lien : on ne relie
  // que les personnes présentes dans l'annuaire de l'espace membre. Les autres
  // viennent d'un import, ou ont quitté la communauté.
  const ghids = participants
    .map((participant) => participant.ghid)
    .filter((ghid): ghid is string => !!ghid);
  const knownGhids = new Set(
    ghids.length
      ? (
          await db
            .selectFrom("users")
            .select("username")
            .where("username", "in", ghids)
            .execute()
        ).map((user) => user.username)
      : [],
  );
  const ficheUrl = (ghid?: string) =>
    ghid && knownGhids.has(ghid)
      ? routes.communityMember({ username: ghid })
      : undefined;
  const participantsAvecFiche = Object.fromEntries(
    Object.entries(participantsBySession).map(([sessionId, liste]) => [
      sessionId,
      liste.map((participant) => ({
        ...participant,
        profileUrl: ficheUrl(participant.ghid),
      })),
    ]),
  );

  const dbUser = userInfosToModel(
    await getUserInfos({
      uuid: session.user.uuid,
    }),
  );
  if (!dbUser) {
    redirect("/");
    return;
  }
  let email;
  if (dbUser) {
    email =
      dbUser.communication_email === CommunicationEmailCode.PRIMARY
        ? dbUser.primary_email
        : dbUser.secondary_email;
  }
  const isMemberRegistered = formation.registeredMembers?.includes(
    dbUser.username,
  );
  const isInWaitingList = formation.waitingListUsernames?.includes(
    dbUser.username,
  );

  return (
    <>
      <BreadCrumbFiller
        currentPage={formation.name}
        currentItemId={formation.id}
      ></BreadCrumbFiller>
      <div className="fr-container fr-container--fluid">
        <h1>{formation.name}</h1>
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-md-4 fr-col-lg-4 fr-col-sm-12">
            <Card
              background
              border
              start={
                !!formation.isELearning ? (
                  <Badge key={"e-learning"} severity="new" as="span">
                    E-learning
                  </Badge>
                ) : (
                  ""
                )
              }
              imageAlt={``}
              imageUrl={formation.imageUrl || ""}
              size="medium"
              desc={
                <>
                  Animateur : {formation.animator || formation.animatorEmail}
                  {!!(formation.end && formation.start) && (
                    <span
                      style={{
                        display: "block",
                        marginBottom: 5,
                        marginTop: 5,
                      }}
                    >
                      Durée :{" "}
                      {durationBetweenDate(formation.end, formation.start)}
                    </span>
                  )}
                  {!formation.isELearning && (
                    <>
                      <span
                        style={{
                          display: "block",
                          marginBottom: 5,
                          marginTop: 5,
                        }}
                      >
                        {formation.maxSeats
                          ? `Inscription : ${libelleInscriptions(
                              Math.max(
                                0,
                                formation.maxSeats -
                                  (formation.availableSeats ?? 0),
                              ),
                              formation.maxSeats,
                            )}`
                          : // Sans limite, le décompte remplace la fraction.
                            libelleInscriptions(
                              formation.sessions?.[0]?.inscrits ?? 0,
                            )}
                      </span>
                      <span
                        style={{
                          display: "block",
                          marginBottom: 5,
                          marginTop: 5,
                        }}
                      >
                        <FormationRegisterButton
                          sessionId={formation.sessionId}
                          isRegistered={!!gristInscription}
                          isOnWaitingList={!!gristInscription?.onWaitingList}
                          seatsLeft={formation.availableSeats}
                          isAnimator={isAnimator}
                        />
                      </span>
                    </>
                  )}
                </>
              }
              title={
                formation.startDate
                  ? // Fuseau explicite : sans lui le serveur en UTC et le
                    // navigateur affichent deux heures différentes.
                    formatInTimeZone(
                      formation.startDate,
                      "Europe/Paris",
                      "d MMMM à HH'h'mm",
                      { locale: fr },
                    )
                  : "Formation en ligne"
              }
              titleAs="h2"
            />
          </div>
          <div className="fr-col-md-8 fr-col-lg-8 fr-col-sm-12">
            <div
              dangerouslySetInnerHTML={{
                __html: mdParser.render(formation.description) || "",
              }}
            />
            <p>
              Public cible :{" "}
              {formation.audience?.length
                ? formation.audience
                    .filter((a) => !!a)
                    .map((audience) => (
                      <Badge
                        as={"span"}
                        key={audience}
                        noIcon
                        severity="info"
                        style={{ marginRight: 5 }}
                      >
                        {audience}
                      </Badge>
                    ))
                : "Tous"}
            </p>
          </div>
        </div>
        {!formation.isELearning && (
          <FormationOtherDates
            // La première date est déjà celle de la carte ci-dessus.
            sessions={(formation.sessions ?? []).slice(1)}
            inscriptions={inscriptions}
            isAnimator={isAnimator}
          />
        )}
        {canManage && (
          <FormationManagePanel
            statut={formation.statut}
            canValidate={isAnimation}
            sessions={formation.sessions ?? []}
            participantsBySession={participantsAvecFiche}
            defaultValues={{
              formationId: formation.id,
              titre: formation.name,
              description: formation.description,
              modalite: (formation.modalite ??
                "") as formationUpdateSchemaType["modalite"],
              thematiques: formation.category ?? [],
              audience: formation.audience ?? [],
              // La limite du format, pas celle de la date la plus proche :
              // `maxSeats` écraserait le modèle par la valeur d'une séance.
              // Sans limite, le champ reste vide — 1 par défaut ferait passer
              // « aucune limite » pour « une place ».
              capacite: formation.capaciteParDefaut,
              // La durée est requise : à défaut de correspondance, on propose
              // la plus courte plutôt qu'un champ vide qui bloquerait l'envoi.
              duree:
                FORMATION_DUREES.find((d) => d.hours === formation.duree)
                  ?.label ?? FORMATION_DUREES[0].label,
              lienVisioAdmin: formation.lienAdmin ?? "",
              lienSupport: formation.lienSupport ?? "",
              lienFeedback: formation.lienFeedback ?? "",
              animateur: formation.animator ?? "",
              emailOrganisateur: formation.animatorEmail ?? "",
            }}
          />
        )}

        <div className="fr-my-4w">
          <Link
            href="/formations"
            className="fr-link fr-link--lg fr-link--icon-left fr-icon-arrow-left-line"
          >
            Voir toutes les formations
          </Link>
        </div>
      </div>
    </>
  );
}

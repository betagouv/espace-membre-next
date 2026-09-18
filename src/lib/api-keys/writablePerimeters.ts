import { canUseWritePerimeter } from "@/lib/authorization/apiKey";
import { AuthSubject } from "@/lib/authorization/subject";

export type WritablePerimeterOption = { uuid: string; label: string };

/**
 * Perimetres reellement ecrivables, obtenus en interrogeant
 * `canUseWritePerimeter` LUI-MEME plutot qu'en reecrivant son predicat en SQL.
 *
 * C'est ce qui garantit que le formulaire ne propose jamais un perimetre que
 * `assertPerimetersAllowed` refusera au submit : la liste et le controle
 * partagent la meme fonction, ils ne peuvent pas diverger. Un filtre SQL
 * equivalent, lui, deriverait au premier changement de regle, et la regle est
 * asymetrique (equipe sans dates cote incubateur, mission active plus
 * legal_status cote produit).
 *
 * La liste est SAINE, pas exhaustive : elle ne garde que des candidats deja
 * connus de l'appelant. Un membre d'equipe peut ecrire sur un produit de son
 * incubateur sans y avoir de mission, ce produit n'apparaitra pas s'il n'est
 * pas dans les candidats.
 */
export async function writablePerimeters(
  subject: AuthSubject,
  candidates: {
    incubators: WritablePerimeterOption[];
    startups: WritablePerimeterOption[];
  },
): Promise<{
  incubators: WritablePerimeterOption[];
  startups: WritablePerimeterOption[];
}> {
  const keep = async (
    kind: "incubator" | "startup",
    options: WritablePerimeterOption[],
  ) => {
    const allowed = await Promise.all(
      options.map((option) =>
        canUseWritePerimeter(subject, { kind, uuid: option.uuid }),
      ),
    );
    return options.filter((_, index) => allowed[index]);
  };

  const [incubators, startups] = await Promise.all([
    keep("incubator", candidates.incubators),
    keep("startup", candidates.startups),
  ]);
  return { incubators, startups };
}

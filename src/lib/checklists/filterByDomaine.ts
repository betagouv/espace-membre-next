import { Domaine } from "@/models/member";
import { checklistSchemaType } from "@/models/checklist";

export function isVisibleForDomaine(
  domaines: Domaine[] | undefined,
  domaine: Domaine,
): boolean {
  return !domaines || domaines.includes(domaine);
}

export function filterChecklistForDomaine(
  checklistObject: checklistSchemaType,
  domaine: Domaine,
): checklistSchemaType {
  return checklistObject
    .filter((section) => isVisibleForDomaine(section.domaines, domaine))
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        isVisibleForDomaine(item.domaines, domaine),
      ),
    }));
}

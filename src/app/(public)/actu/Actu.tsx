"use client";

import AutoComplete, { OptionType } from "@/components/AutoComplete";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { useEffect, useState } from "react";

export type ThematiqueType = OptionType<true> & {
  value: string;
  group: string;
};

type Actu = { startup: string; thematiques?: string[]; incubator?: string };

const allActus: Actu[] = [
  { startup: "startup 1", thematiques: ["test1"] },
  { startup: "startup 2", thematiques: ["test2"], incubator: "incub1" },
  { startup: "startup 3", thematiques: ["test1"], incubator: "incub2" },
];

const isValidActu = (actu: Actu, filters: ThematiqueType[]) => {
  if (filters.length === 0) return true;
  let isValid = false;
  const results = filters.map((f) => {
    console.log(f.group, actu.thematiques, actu.incubator, f.value);
    if (
      f.group === "thematique" &&
      (actu.thematiques ? actu.thematiques.includes(f.value) : true)
    )
      return true;

    if (f.group === "incubator" && actu.incubator === f.value) return true;
    return false;
  });
  console.log("isValid", results);

  return results.some((e) => !!e);
};

const ActuProduits = () => {
  const [changes, setChanges] = useState("");
  const options: ThematiqueType[] = [
    { value: "test1", label: "Test 1", group: "thematique" },
    { value: "test2", label: "Test 2", group: "thematique" },
    { value: "incub1", label: "Incubateur 1", group: "incubator" },
    { value: "incub2", label: "Incubateur 2", group: "incubator" },
  ];

  const getChanges = (filters) => {
    const validActus = allActus.filter((a) => isValidActu(a, filters));
    const newChanges = validActus.map((v) => v.startup).join("\n");
    return newChanges.trim();
  };

  useEffect(() => {
    setChanges(getChanges([]));
  }, []);

  const onFilterChange = (filters, event) => {
    const newChanges = getChanges(filters);
    if (!newChanges) {
      setChanges("Aucun changement trouvé");
      return;
    }
    setChanges(newChanges);
  };
  return (
    <div>
      <AutoComplete
        id="select-thematiques"
        placeholder={"Filtre par thématique ou incubateur"}
        multiple={true}
        options={options}
        onSelect={onFilterChange}
        defaultValue={[]}
        groupBy={(o) => o.group}
      />
      {changes}
    </div>
  );
};

export function Actu() {
  return (
    <div>
      <br />
      <h1>Actualités de la communauté</h1>
      <br />
      <Accordion label="Actu des produits" defaultExpanded={true}>
        <ActuProduits />
      </Accordion>
      {/*<Accordion label="Actu des membres (wip)">-</Accordion>
      <Accordion label="Actu de la documentation (wip)">-</Accordion>
      <Accordion label="Actu des standards (wip)">-</Accordion>*/}
    </div>
  );
}

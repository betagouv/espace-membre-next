"use client";
import MarkdownIt from "markdown-it";
import AutoComplete, { OptionType } from "@/components/AutoComplete";
import { CardMember } from "@/components/Dashboard/DashboardPage";
import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { useState } from "react";

import productUpdates from "./products-updates.json";
import fichesUpdates from "./fiches-updates.json";
import Link from "next/link";

const mdParser = new MarkdownIt({ html: true });

const thematiquesUpdates = productUpdates
  .reduce((a, c) => {
    c.thematiques.forEach((t) => {
      if (t && !a.includes(t)) a.push(t);
    });
    return a;
  }, [] as string[])
  .sort();

const incubatorsUpdates = productUpdates
  .reduce((a, c) => {
    if (c.incubator && !a.includes(c.incubator)) a.push(c.incubator);
    return a;
  }, [] as string[])
  .sort();

const produitsUpdates = productUpdates
  .reduce((a, c) => {
    if (c.id && !a.includes(c.id)) a.push(c.id);
    return a;
  }, [] as string[])
  .sort();

export type ThematiqueType = OptionType<true> & {
  value: string;
  group: string;
};

type Actu = {
  id: string;
  updates: string;
  thematiques?: string[];
  incubator?: string | null;
};

const isValidActu = (actu: Actu, filters: ThematiqueType[]) => {
  if (!filters || filters.length === 0) return true;
  const results = filters.map((f) => {
    //console.log(f.group, actu.thematiques, actu.incubator, f.value);
    if (
      f.group === "thematique" &&
      (actu.thematiques ? actu.thematiques.includes(f.value) : true)
    )
      return true;

    if (f.group === "incubator" && actu.incubator === f.value) return true;
    if (f.group === "startup" && actu.id === f.value) return true;
    return false;
  });

  return results.some((e) => !!e);
};

const ActuProduits = ({ startups, incubators }) => {
  //const [changes, setChanges] = useState<Actu[] | null>(null);
  const [filters, setFilters] = useState<any[] | null>(null);
  const options: ThematiqueType[] = [
    ...thematiquesUpdates.map((t) => ({
      value: t,
      label: t,
      group: "thematique",
    })),
    ...incubatorsUpdates.map((t) => {
      const incubator = incubators.find((s) => s.ghid === t);
      return {
        value: t,
        label: (incubator && incubator.title) || t,
        group: "incubator",
      };
    }),
    ...produitsUpdates.map((t) => {
      const startup = startups.find((s) => s.ghid === t);
      return {
        value: t,
        label: (startup && startup.name) || t,
        group: "startup",
      };
    }),
  ];

  const getChanges = (filters) => {
    const validActus = productUpdates.filter((a) => isValidActu(a, filters));
    return validActus;
  };

  //   useEffect(() => {
  //     setChanges(getChanges([]));
  //   }, []);

  const onFilterChange = (filters, event) => {
    if (!filters.length) {
      setFilters(null);
      return;
    }
    setFilters(filters);
    // if (!filters.length) {
    //   setChanges(null);
    //   return;
    // }
    // const newChanges = getChanges(filters);
    // if (!newChanges) {
    //   setChanges([]);
    //   return;
    // }
    // setChanges(newChanges);
  };

  const changes = getChanges(filters);

  const selectStartup = (startupId) => {
    console.log("selectStartup", startupId);
    const startup = startups.find((s) => s.ghid === startupId);
    setFilters([
      {
        group: "startup",
        value: startupId,
        label: (startup && startup.name) || startupId,
      },
    ]);
    //const changes = getChanges([{ group: "startup", value: startupId }]);
    //setChanges(changes);
  };

  return (
    <div>
      <AutoComplete
        id="select-thematiques"
        placeholder={"Filtre par thématique, incubateur ou startup"}
        multiple={true}
        options={options}
        onSelect={onFilterChange}
        defaultValue={[]}
        value={filters || []}
        groupBy={(o) => o.group}
      />
      <br />
      <br />
      {filters ? (
        changes.length ? (
          changes.slice(0, 25).map((change, i) => {
            return (
              <div key={change.id}>
                <h3>
                  <Link
                    href={`/startups/${change.id}`}
                    title="Ouvrir la fiche produit"
                    target="_blank"
                  >
                    {change.id}
                  </Link>
                  {/*todo: repo link*/}
                </h3>
                <div
                  key="mission"
                  dangerouslySetInnerHTML={{
                    __html:
                      mdParser.render(
                        change.updates.split("\n").slice(0, 50).join("\n"),
                      ) || "",
                  }}
                />
                <hr />
              </div>
            );
          })
        ) : (
          "Aucun changement trouvé"
        )
      ) : (
        <div>
          {fichesUpdates.map((update) => (
            <div key={update.thematique}>
              <h3>{update.thematique}</h3>
              <ul>
                {update.produits.map((p) => (
                  <li key={p.id}>
                    <Link
                      href="#"
                      onClick={(e) => {
                        selectStartup(p.id);
                        e.preventDefault();
                      }}
                    >
                      <b>{p.nom}</b>
                    </Link>{" "}
                    : {p.changes}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function Actu({
  lastMembers,
  startups,
  incubators,
}: {
  lastMembers: any[];
  startups: any[];
  incubators: any[];
}) {
  return (
    <div>
      <br />
      <h1>Actualités de la communauté</h1>
      <br />
      <Accordion label="Actu des produits" defaultExpanded={true}>
        <ActuProduits startups={startups} incubators={incubators} />
      </Accordion>
      {(lastMembers && lastMembers.length && (
        <Accordion label="Les nouveaux membres">
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {lastMembers.slice(0, 18).map((m) => (
              <div key={m.username} className={fr.cx("fr-col-4")}>
                <CardMember member={m} />
              </div>
            ))}
          </div>
        </Accordion>
      )) ||
        null}
      {/*<Accordion label="Nouveaux produits (wip)">-</Accordion>
      <Accordion label="Actu de la documentation (wip)">-</Accordion>
      <Accordion label="Actu des standards (wip)">-</Accordion>*/}
    </div>
  );
}

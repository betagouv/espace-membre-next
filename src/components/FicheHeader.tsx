import { Button } from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr/fr";

// a basic header with edit link, beacause CSS
export const FicheHeader = ({
  label,
  editLink,
}: {
  label: string;
  editLink?: string | false;
}) => (
  <div
    className={fr.cx("fr-col-12")}
    style={{ display: "flex", alignItems: "flex-start" }}
  >
    <h1
      style={{
        flex: "1",
      }}
      className={fr.cx("fr-mb-0")}
    >
      {label}
    </h1>
    {editLink && (
      <Button
        className={fr.cx("fr-mt-1w")}
        priority="secondary"
        linkProps={{
          href: editLink,
        }}
      >
        Modifier la fiche
      </Button>
    )}
  </div>
);

import { fr } from "@codegouvfr/react-dsfr/fr";

export const ToolTip = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => (
  <>
    <button
      aria-describedby={`tooltip-${id}`}
      className={fr.cx("fr-btn--tooltip", "fr-btn")}
    >
      Information contextuelle
    </button>
    <span
      className={fr.cx("fr-tooltip", "fr-placement")}
      id={`tooltip-${id}`}
      role="tooltip"
    >
      {children}
    </span>
  </>
);

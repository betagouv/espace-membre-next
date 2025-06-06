import { fr } from "@codegouvfr/react-dsfr";

export function Skiplinks() {
  return (
    <div id="top" className={fr.cx("fr-skiplinks")} tabIndex={-1}>
      <nav
        className={fr.cx("fr-container")}
        role="navigation"
        aria-label="Accès rapide"
      >
        <ul className={fr.cx("fr-skiplinks__list")}>
          <li>
            <a
              className={fr.cx("fr-link")}
              href="#root-container"
              title="contenu"
              aria-label="contenu"
            >
              Contenu
            </a>
          </li>
          <li>
            <a
              className={fr.cx("fr-link")}
              href="#fr-header-header-with-quick-access-items-main-navigation"
              title="Menu"
              aria-label="Menu"
            >
              Menu
            </a>
          </li>
          <li>
            <a
              className={fr.cx("fr-link")}
              href="#fr-footer"
              title="Pied de page"
              aria-label="Pied de page"
            >
              Pied de page
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}

import { MjmlButton, MjmlText } from "@/server/modules/mjml/mjml";
import { format } from "date-fns";

import { StandardLayout } from "@/components/emails/layouts/StandardEmail";
import { EmailStartupMembersDidNotChangeInXMonths } from "@/server/modules/email";
import { getBaseUrl } from "@/utils/url";

export function StartupMembersDidNotChangeInXMonthsEmailTitle() {
  return `Vérifie les produits de ton incubateur.`;
}

export function StartupMembersDidNotChangeInXMonthsEmail(
  props: EmailStartupMembersDidNotChangeInXMonths["variables"],
) {
  const title = StartupMembersDidNotChangeInXMonthsEmailTitle();

  return StandardLayout({
    title,
    children:
      MjmlText(
        {},
        `<h1>${title}</h1>
        <p>Bonjour,</p>
        <p>Tu reçois cet email car tu fais partie de l'incubateur : ${props.incubator.title}.</p>
        <p>Ces fiches n'ont pas été modifiés depuis 3 mois :</p>
        <ul>
          <li>Est-ce que la phase de vie est bonne ?</li>
          <li>L'équipe a-t-elle évolué depuis ?</li>
        </ul>
        <table class="member-info" style="width: 100%">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Phase</th>
              <th>Membres actifs</th>
            </tr>
          </thead>
          <tbody>
            ${props.startupWrappers
              .map(
                (wrapper) =>
                  `<tr>
                    <td style="width: 40%"><a href="${getBaseUrl()}/startups/${wrapper.startup.ghid}">${wrapper.startup.name}</a></td>
                    <td style="width: 25%">${wrapper.currentPhase}</td>
                    <td style="width: 25%">${wrapper.activeMembers}</td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>`,
      ) +
      MjmlText(
        {},
        `<p>Si une information a changé, tu peux la mettre à jour via l'espace membre :</p>`,
      ) +
      MjmlButton({ href: getBaseUrl() }, "Accéder à l'espace membre") +
      MjmlText({}, ""),
  });
}

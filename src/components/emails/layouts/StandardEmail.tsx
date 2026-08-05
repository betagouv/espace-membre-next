import {
  Mjml,
  MjmlHead,
  MjmlAttributes,
  MjmlBody,
  MjmlButton,
  MjmlColumn,
  MjmlDivider,
  MjmlGroup,
  MjmlImage,
  MjmlSection,
  MjmlStyle,
  MjmlText,
  MjmlTitle,
  MjmlWrapper,
  MjmlAll,
} from "@/server/modules/mjml/mjml";

import { getBaseUrl } from "@/utils/url";

export interface StandardLayoutProps {
  title: string;
  children: string;
}

export function StandardLayout(props: StandardLayoutProps) {
  const currentYear = new Date().getFullYear();

  return Mjml(
    MjmlHead(
      MjmlTitle(props.title) +
        MjmlAttributes(
          MjmlSection({ padding: "10px 0px" }, "") +
            MjmlColumn({ padding: "0px 0px" }, "") +
            MjmlDivider({
              cssClass: "divider",
              borderWidth: "1px",
              borderColor: "#000000",
            }) +
            MjmlText(
              {
                cssClass: "light-text",
                color: "#3a3a3a",
                fontSize: "14px",
                lineHeight: "24px",
              },
              "",
            ) +
            MjmlButton(
              {
                backgroundColor: "#000091",
                borderRadius: "0px",
                cssClass: "light-button",
                color: "#f5f5fe",
                fontSize: 16,
                fontWeight: 400,
                lineHeight: "24px",
                padding: "8px 16px",
              },
              "",
            ) +
            MjmlAll({ fontFamily: "arial, sans-serif" }),
        ) +
        MjmlStyle(`
          hr {
            color: #000000;
          }
          th {
            background: none !important;
          }
          a {
            color: #000091;
            text-underline-offset: 3px;
          }
          h1, h2 {
            line-height: 1.2em;
          }
          .fr-hr-or {
            font-size: .875rem;
            line-height: 1.5rem;
            text-transform: uppercase;
            font-weight: 700;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            flex-wrap: nowrap;
          }
          .fr-hr-or:after,.fr-hr-or:before {
            content: "";
            display: inline-flex;
            height: 1px;
            width: 40%;
            background-color: #000000;
            --idle: transparent;
            --hover: #000000;
            --active: #000000;
          }
          .fr-hr-or:before {
            margin-right: .75rem;
          }
          .fr-hr-or:after {
            margin-left: .75rem;
          }
          .member-info th, .member-info td {
            border: 1px solid #000;
            padding: 10px;
          }
        `),
    ) +
      MjmlBody({ width: 500 },
        MjmlWrapper({ cssClass: "light-body" },
          MjmlSection({ cssClass: "header-section" },
            MjmlGroup(
              MjmlColumn({ cssClass: "logo-section", verticalAlign: "middle", width: "24%" },
                MjmlImage({
                  src: `${getBaseUrl()}/static/images/home-illustration.png`,
                  alt: "logo",
                  paddingRight: 0,
                }),
              ) +
                MjmlColumn({ verticalAlign: "middle", width: "76%" },
                  MjmlText({ fontSize: 20, fontWeight: 700, paddingBottom: 2 },
                    "Espace-membre beta.gouv.fr",
                  ) +
                    MjmlText({ fontSize: 16, paddingTop: 2 },
                      "Communauté beta.gouv.fr",
                    ),
                ),
            ),
          ) +
            MjmlSection({ cssClass: "light-main-section", backgroundColor: "#f6f6f6" },
              MjmlGroup(
                MjmlColumn({}, props.children),
              ),
            ) +
            MjmlSection({ cssClass: "footer-section" },
              MjmlGroup(
                MjmlColumn({},
                  MjmlText({
                    align: "center",
                    color: "#666666",
                    fontSize: 12,
                    paddingTop: 2,
                    paddingBottom: 0,
                  }, `${currentYear} © Espace-Membre`),
                ),
              ),
            ),
        ),
      ),
  );
}

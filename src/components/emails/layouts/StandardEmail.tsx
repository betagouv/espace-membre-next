import { PropsWithChildren } from "react";

import {
    Mjml,
    MjmlAll,
    MjmlAttributes,
    MjmlBody,
    MjmlButton,
    MjmlColumn,
    MjmlDivider,
    MjmlGroup,
    MjmlHead,
    MjmlImage,
    MjmlSection,
    MjmlStyle,
    MjmlText,
    MjmlTitle,
    MjmlWrapper,
} from "@luma-team/mjml-react";

import { getBaseUrl } from "@/utils/url";

export interface StandardLayoutProps {
    title: string;
}

export function StandardLayout(props: PropsWithChildren<StandardLayoutProps>) {
    const currentYear = new Date().getFullYear();

    return (
        <Mjml>
            <MjmlHead>
                <MjmlTitle>{props.title}</MjmlTitle>
                {/* TODO: the preview can be interesting but it would add transpiling the context one more time and convert the html to plaintext to keep only the first valuable line (not the "Hello Thomas,"...) (ref: https://www.litmus.com/blog/the-ultimate-guide-to-preview-text-support) */}
                {/* <MjmlPreview>{props.title}</MjmlPreview> */}
                <MjmlAttributes>
                    <MjmlSection padding="10px 0px"></MjmlSection>
                    <MjmlColumn padding="0px 0px"></MjmlColumn>
                    <MjmlDivider
                        css-class="divider"
                        border-width="1px"
                        border-color="#000000"
                    ></MjmlDivider>
                    <MjmlText
                        cssClass="light-text"
                        color="#3a3a3a"
                        fontSize="14px"
                        lineHeight="24px"
                    ></MjmlText>
                    <MjmlButton
                        backgroundColor="#000091"
                        borderRadius="0px"
                        cssClass="light-button"
                        color="#f5f5fe"
                        fontSize={16}
                        fontWeight={400}
                        lineHeight="24px"
                        padding="8px 16px"
                    ></MjmlButton>
                    <MjmlAll fontFamily="arial, sans-serif"></MjmlAll>
                </MjmlAttributes>
                <MjmlStyle>
                    {`
                        hr {
                        color: #000000; // Otherwise it's grey
                        }

                        th {
                        background: none !important; // Prevent the heading column/row to have a color
                        }

                        a {
                        color: #000091;
                        text-underline-offset: 3px;
                        }

                        h1,
                        h2 {
                        // Bigger headings were rendering all tight on multiple lines
                        line-height: 1.2em;
                        }

                        // dsfr hr
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
                            margin-right: .75rem
                        }

                        .fr-hr-or:after {
                            margin-left: .75rem
                        }

                        .member-info th, .member-info td {
                        border: 1px solid #000;
                        padding: 10px;
                        }`}
                </MjmlStyle>
            </MjmlHead>
            <MjmlBody width={500}>
                <MjmlWrapper cssClass={`light-body`}>
                    <MjmlSection>
                        <MjmlGroup>
                            <MjmlColumn
                                cssClass="logo-section"
                                verticalAlign="middle"
                                width="24%"
                            >
                                {/* `MjmlColumn` width must be a percentage (ref: https://github.com/mjmlio/mjml/issues/2489) */}
                                {/* TODO: upload images on our own CDN, or use public folder of the app... */}
                                <MjmlImage
                                    src={`${getBaseUrl()}/static/images/home-illustration.png`}
                                    alt="logo"
                                    paddingRight={0}
                                />
                            </MjmlColumn>
                            <MjmlColumn verticalAlign="middle" width="76%">
                                <MjmlText
                                    fontSize={20}
                                    fontWeight={700}
                                    paddingBottom={2}
                                >
                                    Espace-membre beta.gouv.fr
                                </MjmlText>
                                <MjmlText fontSize={16} paddingTop={2}>
                                    Communauté beta.gouv.fr
                                </MjmlText>
                            </MjmlColumn>
                        </MjmlGroup>
                    </MjmlSection>
                    <MjmlSection
                        cssClass="light-main-section"
                        backgroundColor="#f6f6f6"
                    >
                        <MjmlGroup>
                            <MjmlColumn>{props.children}</MjmlColumn>
                        </MjmlGroup>
                    </MjmlSection>
                    <MjmlSection>
                        <MjmlGroup>
                            <MjmlColumn>
                                <MjmlText
                                    align="center"
                                    color="#666666"
                                    fontSize={12}
                                    paddingTop={2}
                                    paddingBottom={0}
                                >
                                    {currentYear} © Espace-Membre
                                </MjmlText>
                            </MjmlColumn>
                        </MjmlGroup>
                    </MjmlSection>
                </MjmlWrapper>
            </MjmlBody>
        </Mjml>
    );
}

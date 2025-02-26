import { compile } from "html-to-text";
import { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export const convertHtmlEmailToText = compile({
    wordwrap: 130,
    selectors: [
        { selector: "head", format: "skip" },
        // TODO: find a way to detect data tables and add to them a specific class to be selected here
        // { selector: 'table', format: 'dataTable' },
        { selector: ".logo-section", format: "skip" },
        { selector: ".social-network-section", format: "skip" },
    ],
});

export function convertComponentEmailToText(component: ReactElement) {
    const html = renderToStaticMarkup(component);

    return convertHtmlEmailToText(html);
}

export const commonEmailsParameters = {
    layout: "fullscreen",
    // TODO: for now we have a race condition on rendering it the first time so it breaks tests into Chromatic,
    // we disable the snapshots for now until we find a solution. Same for local test runners.
    chromatic: { disableSnapshot: true },
    testRunner: { disable: true },
};

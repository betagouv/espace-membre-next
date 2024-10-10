// import { Lang } from "@/src/app/utils/routes/common";
// import { routes } from "@/src/app/utils/routes/list";
// import { getBaseUrl } from "@/src/app/utils/url";

import { Lang } from "./common";
import { routes } from "./list";
import { getBaseUrl } from "../url";

export interface GetOptions {
    lang?: Lang;
    absolute?: boolean;
}

// To simplify the definition we provide an object even when no parameter is needed
// we juste set the type to "undefined" to explicitly say no object is expected
export type Params<RouteName extends keyof (typeof routes)["fr"]> = Parameters<
    (typeof routes)["fr"][RouteName]
>[0] extends undefined
    ? undefined
    : Parameters<(typeof routes)["fr"][RouteName]>[0];

export class LinkRegistry {
    protected defaultLang: Lang;
    protected absoluteBaseUrl: string;
    protected defaultAbsoluteLinks: boolean;
    protected routes = routes;

    constructor(params: { defaultLang: Lang; baseUrl: string }) {
        this.defaultLang = params.defaultLang;
        this.absoluteBaseUrl = params.baseUrl;
        this.defaultAbsoluteLinks = false;
    }

    public get<RouteName extends keyof (typeof routes)["fr"]>(
        key: RouteName,
        params?: Params<RouteName>,
        options?: GetOptions
    ): string {
        let lang: Lang = this.defaultLang;
        let absoluteLink: boolean = false;
        if (options) {
            if (options.lang) {
                lang = options.lang;
            }

            if (options.absolute) {
                absoluteLink = options.absolute;
            }
        }
        const fn = routes[lang][key];
        if (!fn) {
            console.error(`Error getting route ${lang}/${key}`);
            return "/";
        }
        const route = fn(params as unknown as any);

        if (absoluteLink && this.absoluteBaseUrl !== "") {
            // Concatenate pathname and base URL
            return new URL(route.href, this.absoluteBaseUrl).href;
        }

        return route.href;
    }

    public cloneInstance(): LinkRegistry {
        return new LinkRegistry({
            defaultLang: this.defaultLang,
            baseUrl: this.absoluteBaseUrl,
        });
    }
}

export const linkRegistry = new LinkRegistry({
    defaultLang: "fr",
    baseUrl: getBaseUrl(),
});

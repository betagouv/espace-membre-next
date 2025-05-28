import { routes } from "./routes";
import { getBaseUrl } from "../url";

export interface GetOptions {
  absolute?: boolean;
}

// To simplify the definition we provide an object even when no parameter is needed
// we juste set the type to "undefined" to explicitly say no object is expected
export type Params<RouteName extends keyof typeof routes> = Parameters<
  (typeof routes)[RouteName]
>[0] extends undefined
  ? undefined
  : Parameters<(typeof routes)[RouteName]>[0];

export class LinkRegistry {
  protected absoluteBaseUrl: string;
  protected defaultAbsoluteLinks: boolean;
  protected routes = routes;

  constructor(params: { baseUrl: string }) {
    this.absoluteBaseUrl = params.baseUrl;
    this.defaultAbsoluteLinks = false;
  }

  public get<RouteName extends keyof typeof routes>(
    key: RouteName,
    params?: Params<RouteName>,
    options?: GetOptions,
  ): string {
    let absoluteLink: boolean = false;
    if (options) {
      if (options.absolute) {
        absoluteLink = options.absolute;
      }
    }
    const fn = routes[key];
    if (!fn) {
      console.error(`Error getting route ${String(key)}`);
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
      baseUrl: this.absoluteBaseUrl,
    });
  }
}

export const linkRegistry = new LinkRegistry({
  baseUrl: getBaseUrl(),
});

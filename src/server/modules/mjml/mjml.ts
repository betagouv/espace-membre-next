function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function attrs(props: Record<string, string | number | boolean | undefined | null>): string {
  return Object.entries(props)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => {
      const name = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      const value = typeof v === "boolean" ? (v ? "true" : "false") : v;
      return ` ${name}="${escapeAttr(String(value))}"`;
    })
    .join("");
}

export function tag(
  name: string,
  props: Record<string, string | number | boolean | undefined | null>,
  children: string = "",
): string {
  if (!children) {
    return `<${name}${attrs(props)} />`;
  }
  return `<${name}${attrs(props)}>${children}</${name}>`;
}

export function Mjml(children: string) {
  return tag("mjml", {}, children);
}

export function MjmlHead(children: string) {
  return tag("mj-head", {}, children);
}

export function MjmlTitle(title: string) {
  return tag("mj-title", {}, title);
}

export function MjmlPreview(text: string) {
  return tag("mj-preview", {}, text);
}

export function MjmlAttributes(children: string) {
  return tag("mj-attributes", {}, children);
}

export function MjmlStyle(inlineStyle: string) {
  return tag("mj-style", { inline: "inline" }, inlineStyle);
}

export function MjmlAll(props: Record<string, string | number | boolean | undefined | null>) {
  return tag("mj-all", props);
}

export function MjmlBody(props: Record<string, string | number | boolean | undefined | null>, children: string) {
  return tag("mj-body", props, children);
}

export function MjmlSection(children: string): string;
export function MjmlSection(props: Record<string, string | number | boolean | undefined | null>, children: string): string;
export function MjmlSection(propsOrChildren: Record<string, string | number | boolean | undefined | null> | string, children?: string): string {
  if (typeof propsOrChildren === "string") {
    return tag("mj-section", {}, propsOrChildren);
  }
  return tag("mj-section", propsOrChildren, children ?? "");
}

export function MjmlGroup(children: string): string;
export function MjmlGroup(props: Record<string, string | number | boolean | undefined | null>, children: string): string;
export function MjmlGroup(propsOrChildren: Record<string, string | number | boolean | undefined | null> | string, children?: string): string {
  if (typeof propsOrChildren === "string") {
    return tag("mj-group", {}, propsOrChildren);
  }
  return tag("mj-group", propsOrChildren, children ?? "");
}

export function MjmlColumn(children: string): string;
export function MjmlColumn(props: Record<string, string | number | boolean | undefined | null>, children: string): string;
export function MjmlColumn(propsOrChildren: Record<string, string | number | boolean | undefined | null> | string, children?: string): string {
  if (typeof propsOrChildren === "string") {
    return tag("mj-column", {}, propsOrChildren);
  }
  return tag("mj-column", propsOrChildren, children ?? "");
}

export function MjmlWrapper(props: Record<string, string | number | boolean | undefined | null>, children: string) {
  return tag("mj-wrapper", props, children);
}

export function MjmlText(props: Record<string, string | number | boolean | undefined | null>, children: string) {
  return tag("mj-text", props, children);
}

export function MjmlButton(props: Record<string, string | number | boolean | undefined | null>, children: string) {
  return tag("mj-button", props, children);
}

export function MjmlImage(props: Record<string, string | number | boolean | undefined | null>) {
  const { alt, ...rest } = props;
  const allProps = { ...rest, ...(alt !== undefined ? { alt } : {}) };
  return tag("mj-image", allProps);
}

export function MjmlDivider(props: Record<string, string | number | boolean | undefined | null>) {
  return tag("mj-divider", props);
}

export function MjmlRaw(html: string) {
  return tag("mj-raw", {}, html);
}

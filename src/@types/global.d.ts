interface Window {
    chatwootSDK?: {
        run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
        toggle: (string) => null;
    };
}

declare module "*.scss?raw" {
    const content: string;
    export default content;
}

interface Window {
  chatwootSDK?: {
    run: (config: { websiteToken: string; baseUrl: string }) => void;
  };
  $chatwoot?: {
    toggle: (string) => null;
  };
}

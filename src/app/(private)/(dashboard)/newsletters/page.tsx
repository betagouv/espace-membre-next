import { Metadata } from "next";

import NewsletterPage from "@/components/NewsletterPage/NewsletterPage";
import config from "@/server/config";

export const metadata: Metadata = {
  title: "Infolettre / Espace Membre",
};

export default async function Page() {
  return <NewsletterPage contentUrl={config.newsletterContentUrl} />;
}

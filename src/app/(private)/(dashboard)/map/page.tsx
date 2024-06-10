import type { Metadata } from "next";

import { routeTitles } from "@/utils/routes/routeTitles";
import { MapPage, MapPageProps } from "./MapPage";

export const metadata: Metadata = {
    title: `${routeTitles.map()} / Espace Membre`,
};

export default async function Page(props: MapPageProps) {
    return <MapPage {...props} />;
}

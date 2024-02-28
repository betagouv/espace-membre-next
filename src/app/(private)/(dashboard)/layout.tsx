import { PropsWithChildren } from "react";

import { PrivateLayout } from "@/app/(private)/(dashboard)/PrivateLayout";

export default function Layout(props: PropsWithChildren) {
    return <PrivateLayout>{props.children}</PrivateLayout>;
}

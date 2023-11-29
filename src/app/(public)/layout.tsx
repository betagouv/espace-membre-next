"use client";

import { PropsWithChildren } from "react";

export default function Layout(props: PropsWithChildren) {
    return (
        <div className="fr-grid-row fr-grid-row-gutters fr-grid-row--center ">
            {props.children}
        </div>
    );
}

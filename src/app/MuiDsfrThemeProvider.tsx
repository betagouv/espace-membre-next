"use client";
import { createMuiDsfrThemeProvider } from "@codegouvfr/react-dsfr/mui";

import type { Theme } from "@mui/material/styles";

declare module "@mui/material/styles" {
    interface Theme {
        custom: {
            isDarkModeEnabled: boolean;
        };
    }
}

export const { MuiDsfrThemeProvider } = createMuiDsfrThemeProvider({
    augmentMuiTheme: ({ nonAugmentedMuiTheme, isDark }) => ({
        ...nonAugmentedMuiTheme,
        custom: {
            isDarkModeEnabled: true, //isDark,
        },
    }),
});

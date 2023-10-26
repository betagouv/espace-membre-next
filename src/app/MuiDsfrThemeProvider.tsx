"use client";
import { createMuiDsfrThemeProvider } from "@codegouvfr/react-dsfr/mui";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            isDarkModeEnabled: isDark,
        },
    }),
});

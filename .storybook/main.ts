import type { StorybookConfig } from "@storybook/nextjs";
import CopyWebpackPlugin from "copy-webpack-plugin";
import FileManagerPlugin from "filemanager-webpack-plugin";
import path from "path";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

import { applyRawQueryParserOnStorybookCssModule } from "@/utils/webpack";

const staticBuildFolderPath = path.resolve(__dirname, "../storybook-static/");

const config: StorybookConfig = {
    stories: [
        path.resolve(__dirname, "../src/**/*.@(mdx|stories.@(js|ts|jsx|tsx))"),
    ],
    staticDirs: ["../public"],
    addons: [
        "@storybook/addon-a11y",
        "@storybook/addon-coverage",
        "@storybook/addon-designs",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        "@storybook/addon-links",
        "@storybook/addon-measure",
        "@storybook/addon-viewport",
        "storybook-dark-mode",
        "@chromatic-com/storybook",
    ],
    features: {},
    framework: {
        name: "@storybook/nextjs",
        options: {
            // https://github.com/storybookjs/storybook/tree/next/code/frameworks/nextjs
            nextConfigPath: path.resolve(__dirname, "../next.config.js"),
            builder: {
                // TODO: waiting for https://github.com/storybookjs/storybook/pull/29654 to be fixed to enable and improve performance
                fsCache: false,
            },
        },
    },
    core: {
        enableCrashReports: false,
        disableTelemetry: true,
    },
    env: (config) => ({
        ...config,
        ENABLE_MOCKS: "true",
        STORYBOOK_ENVIRONMENT: "true",
        TRPC_SERVER_MOCK: "true",
    }),
    async webpackFinal(config, { configType }) {
        // When building Storybook from scratch assets are copied into the `outputDir` before `CopyWebpackPlugin` builds the `/public/` folder
        // resulting in missing assets... so we have to make sure to copy a new time with all files
        // Ref: https://github.com/chromaui/chromatic-cli/issues/722
        // Note: it requires us to use `FileManagerPlugin` to make it working, `CopyWebpackPlugin` didn't work to copy after others even with priority
        let buildMode = false;
        let outputDir = staticBuildFolderPath;
        for (const [argIndex, argValue] of process.argv.entries()) {
            if (
                argValue.includes("storybook") &&
                process.argv[argIndex + 1] === "build"
            ) {
                buildMode = true;
            } else if (buildMode && argValue === "--output-dir") {
                outputDir = process.argv[argIndex + 1];

                break;
            }
        }

        if (buildMode) {
            config.plugins!.push(
                new FileManagerPlugin({
                    events: {
                        onEnd: {
                            copy: [
                                {
                                    source: path.resolve(
                                        __dirname,
                                        "../public/"
                                    ),
                                    destination: path.resolve(outputDir),
                                },
                            ],
                        },
                    },
                })
            );
        }

        // Expose all DSFR fonts as static at the root so emails and PDFs can download them when needed
        // And also static files embedded in the application
        config.plugins!.push(
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: path.dirname(
                            require.resolve(
                                "@gouvfr/dsfr/dist/fonts/Marianne-Bold.woff2"
                            )
                        ),
                        to: path.resolve(__dirname, "../public/assets/fonts/"),
                    },
                    // {
                    //     from: path.dirname(
                    //         require.resolve(
                    //             "@fontsource/dancing-script/files/dancing-script-latin-400-normal.woff2"
                    //         )
                    //     ),
                    //     to: path.resolve(__dirname, "../public/assets/fonts/"),
                    // },
                    {
                        from: require.resolve("@/assets/fonts/index.css"),
                        to: path.resolve(__dirname, "../public/assets/fonts/"),
                    },
                ],
            })
        );

        applyRawQueryParserOnStorybookCssModule(config.module!.rules!);

        config.module!.rules!.push({
            test: /\.(txt|html)$/i,
            use: "raw-loader",
        });

        if (!config.resolve) {
            config.resolve = {};
        }

        if (!config.resolve.alias) {
            config.resolve.alias = {};
        }

        config.resolve.plugins = [
            new TsconfigPathsPlugin({
                configFile: path.resolve(__dirname, "../tsconfig.json"),
            }),
        ];

        return config;
    },
    docs: {},
    typescript: {
        reactDocgen: "react-docgen-typescript",
    },
};

export default config;

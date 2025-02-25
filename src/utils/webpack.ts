import { ModuleOptions } from "webpack";

// Needed to use `require()`:
// * using `import cssnano from 'cssnano'` was resulting in `TypeError: (0 , cssnano_1.default) is not a function` despite working for Storybook though
// * using `import * as cssnano from 'cssnano'` despite working at runtime was giving us a type not callable
const cssnano = require("cssnano");

export function generateOneOfRawCssRule() {
    return {
        resourceQuery: /raw/, // foo.scss?raw
        type: "asset/source",
        use: [
            {
                loader: "postcss-loader",
                options: {
                    postcssOptions: {
                        // In our case getting raw style in to inject it in emails, we want to make sure it's minified to avoid comments and so on
                        plugins: [cssnano({ preset: "default" })],
                    },
                },
            },
            "resolve-url-loader",
            "sass-loader",
        ],
    };
}

export function applyRawQueryParserOnStorybookCssModule(
    moduleRules: NonNullable<ModuleOptions["rules"]>
) {
    let scssRuleFound = false;
    for (const ruleIndex in moduleRules) {
        const originalRule = moduleRules[ruleIndex];

        // If for `sass` we add our additional one (they cannot colocate on the same level because they would be played both... resulting in CSS parsing errors)
        if (
            originalRule &&
            typeof originalRule === "object" &&
            originalRule.test instanceof RegExp &&
            originalRule.test.test(".scss")
        ) {
            scssRuleFound = true;

            moduleRules[ruleIndex] = {
                test: originalRule.test,
                oneOf: [
                    generateOneOfRawCssRule(),
                    {
                        use: originalRule.use,
                    },
                ],
            };
        }
    }

    if (!scssRuleFound) {
        throw new Error(
            "our custom SCSS rule should have been added, make sure the project manage SCSS by default first"
        );
    }
}

export function applyRawQueryParserOnNextjsCssModule(
    moduleRules: NonNullable<ModuleOptions["rules"]>
) {
    // Inject a style loader when we want to use `foo.scss?raw` for backend processing (like emails)
    // It was not easy because adding this rule was making Next.js removing all default style loaders saying we use a custom style so it left us with nothing...
    // It's due to this check https://github.com/vercel/next.js/blob/v14.2.20/packages/next/src/build/webpack-config.ts#L2381-L2391
    // The trick below is to parse their rules tree and when they use Sass loaders we add our own rule at the beginning of the chain (they do not check that)
    // We could have tried the first attempt while trying to re-add all their loaders by ourselves... but there is a high chance it breaks soon since that's their internal stuff (https://github.com/vercel/next.js/blob/d3e3f28b418a408d865cd7cde255af888739da45/packages/next/build/webpack/config/blocks/css/index.ts used at https://github.com/vercel/next.js/blob/d3e3f28b418a408d865cd7cde255af888739da45/packages/next/build/webpack/config/index.ts#L49)
    const styleRegex = new RegExp("(scss|sass)", "i");
    for (const originalRule of moduleRules) {
        if (
            originalRule &&
            typeof originalRule === "object" &&
            Array.isArray(originalRule.oneOf)
        ) {
            for (const ruleItem of originalRule.oneOf) {
                if (
                    ruleItem &&
                    ruleItem.test &&
                    styleRegex.test(ruleItem.test.toString())
                ) {
                    originalRule.oneOf.splice(0, 0, {
                        test: /\.(scss|sass)$/,
                        ...generateOneOfRawCssRule(),
                    });

                    break; // Break only the current `oneOf` loop to go to the next rule
                }
            }
        }
    }
}

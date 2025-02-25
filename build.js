// build.js
const esbuild = require("esbuild");
const fs = require("fs-extra");
const glob = require("glob");
const path = require("path");
const sass = require("sass");
require("dotenv").config(); // Load .env file

// Load tsconfig to extract path aliases
const tsconfig = require("./tsconfig.server.json");

// Extract path aliases from tsconfig
const aliasPaths = Object.entries(tsconfig.compilerOptions.paths || {}).reduce(
    (aliases, [key, value]) => {
        const alias = key.replace("/*", "");
        const target = path.resolve(__dirname, value[0].replace("/*", ""));
        aliases[alias] = target;
        return aliases;
    },
    {}
);

async function build() {
    try {
        await esbuild.build({
            entryPoints: glob.sync("**/*.{ts,tsx}", {
                ignore: [
                    "**/node_modules/**",
                    "**/*.tsx",
                    "static",
                    "migrations",
                    "src/app",
                    "src/components",
                    "src/providers",
                    "__tests__",
                    "models",
                    "src/lib",
                    "knexfile.js",
                    "**/**.spec.ts",
                    "dist",
                ],
            }),
            outdir: "dist",
            platform: "node",
            format: "cjs",
            target: "es6",
            tsconfig: "tsconfig.server.json",
            sourcemap: true,
            bundle: true, // Enable bundling
            minify: false,
            external: [
                ...Object.keys(require("./package.json").dependencies || {}),
                ...Object.keys(require("./package.json").devDependencies || {}),
            ],
            loader: {
                ".ts": "ts",
                ".tsx": "tsx",
                ".js": "jsx",
                ".json": "json",
            },
            define: {
                "process.env.NODE_ENV": '"production"',
            },
            alias: aliasPaths, // Enable alias mapping
            plugins: [scssPlugin()],
        });

        // Copy static assets like .scss files
        copyStaticFiles("src", "dist", ["scss", "email.scss"]);

        console.log("Build completed successfully!");
    } catch (error) {
        console.error("Build failed:", error);
        process.exit(1);
    }
}

// Function to copy static files (e.g., .scss, .email.scss) to the dist directory
function copyStaticFiles(srcDir, distDir, extensions) {
    extensions.forEach((ext) => {
        const files = glob.sync(`${srcDir}/**/*.${ext}`);
        files.forEach((file) => {
            const relativePath = path.relative(srcDir, file);
            const targetPath = path.join(distDir, relativePath);
            fs.ensureDirSync(path.dirname(targetPath));
            fs.copyFileSync(file, targetPath);
            console.log(`Copied ${file} to ${targetPath}`);
        });
    });
}

// Custom esbuild plugin to handle SCSS files and ?raw imports
// Custom esbuild plugin to handle SCSS files and ?raw imports
function scssPlugin() {
    return {
        name: "scss-plugin",
        setup(build) {
            // Handle standard .scss imports (compiled to CSS)
            build.onResolve({ filter: /\.scss$/ }, (args) => ({
                path: path.resolve(args.resolveDir, args.path),
                namespace: "scss",
            }));

            build.onLoad(
                { filter: /\.scss$/, namespace: "scss" },
                async (args) => {
                    try {
                        const result = sass.compile(args.path, {
                            loadPaths: [path.dirname(args.path)], // Allow @use and @import
                        });
                        return {
                            contents: result.css,
                            loader: "css",
                        };
                    } catch (e) {
                        console.error(`Error compiling SCSS: ${args.path}`, e);
                        return { contents: "", loader: "css" };
                    }
                }
            );

            // Handle .scss?raw imports as raw text
            build.onResolve({ filter: /\.scss\?raw$/ }, (args) => {
                const rawPath = args.path.replace("?raw", "");
                const resolvedPath = path.isAbsolute(rawPath)
                    ? rawPath
                    : path.resolve(args.resolveDir, rawPath);

                return {
                    path: resolvedPath,
                    namespace: "raw-scss",
                };
            });

            build.onLoad(
                { filter: /\.scss$/, namespace: "raw-scss" },
                async (args) => {
                    try {
                        // Compile SCSS to include @use and @import processing
                        const result = sass.compile(args.path, {
                            loadPaths: [path.dirname(args.path)], // Resolve @use and @import
                        });

                        return {
                            contents: `export default ${JSON.stringify(
                                result.css
                            )};`,
                            loader: "js",
                        };
                    } catch (e) {
                        console.error(
                            `Error loading SCSS as raw: ${args.path}`,
                            e
                        );
                        return { contents: "", loader: "js" };
                    }
                }
            );
        },
    };
}

build();
